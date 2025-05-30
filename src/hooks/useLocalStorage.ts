
"use client";

import { useState, useEffect, Dispatch, SetStateAction } from 'react';

type SetValue<T> = Dispatch<SetStateAction<T>>;

function useLocalStorage<T>(key: string, initialValue: T): [T, SetValue<T>, boolean] {
  const [storedValue, setStoredValue] = useState<T>(initialValue);
  const [isLoading, setIsLoading] = useState(true); // Loading state for this hook

  // Effect to read from localStorage on initial mount (client-side only)
  useEffect(() => {
    if (typeof window === 'undefined') {
      setIsLoading(false); // Should not happen in client-side effect, but good practice
      return;
    }

    try {
      const item = window.localStorage.getItem(key);
      if (item) {
        setStoredValue(JSON.parse(item) as T);
      } else {
        // If no item, storedValue remains initialValue (set by useState)
        // or explicitly set it again if initialValue reference might change, though unlikely for this app's initialUserData
        setStoredValue(initialValue);
      }
    } catch (error) {
      console.warn(`Error reading localStorage key "${key}":`, error);
      setStoredValue(initialValue); // Fallback to initialValue on error
    }
    setIsLoading(false); // Signal that initial read attempt is complete
  }, [key, initialValue]); // Rerun if key or initialValue reference changes (though initialValue should be stable)


  const setValue: SetValue<T> = value => {
    if (typeof window === 'undefined') {
      console.warn(
        `Tried setting localStorage key "${key}" even though environment is not a client`
      );
      // Still update the state in memory for SSR consistency if needed, though localStorage won't be hit.
      // However, for this app, setValue is typically client-side.
      const newValue = value instanceof Function ? value(storedValue) : value;
      setStoredValue(newValue);
      return;
    }

    try {
      const newValue = value instanceof Function ? value(storedValue) : value;
      window.localStorage.setItem(key, JSON.stringify(newValue));
      setStoredValue(newValue);
      window.dispatchEvent(new Event("local-storage")); // For same-tab updates
    } catch (error) {
      console.warn(`Error setting localStorage key "${key}":`, error);
    }
  };

  // Effect for listening to storage events from other tabs/windows
  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    const handleStorageChange = () => {
      try {
        const item = window.localStorage.getItem(key);
        if (item) {
          setStoredValue(JSON.parse(item) as T);
        } else {
          setStoredValue(initialValue);
        }
      } catch (error) {
        console.warn(`Error reading localStorage key "${key}" on storage event:`, error);
        setStoredValue(initialValue);
      }
    };

    window.addEventListener("storage", handleStorageChange);
    window.addEventListener("local-storage", handleStorageChange); // For same-tab updates triggered by setValue

    return () => {
      window.removeEventListener("storage", handleStorageChange);
      window.removeEventListener("local-storage", handleStorageChange);
    };
  }, [key, initialValue]); // Rerun if key or initialValue reference changes

  return [storedValue, setValue, isLoading];
}

export default useLocalStorage;
