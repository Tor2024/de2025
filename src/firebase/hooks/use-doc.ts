
import { doc, onSnapshot } from 'firebase/firestore';
import { useEffect, useState } from 'react';
import { useFirebase } from '../provider';

export function useDoc<T>(path: string, id: string) {
  const [data, setData] = useState<T>();
  const [loading, setLoading] = useState(true);
  const { firestore: db } = useFirebase();

  useEffect(() => {
    if (!db) {
      return;
    }
    const unsub = onSnapshot(doc(db, path, id), (snap) => {
      if (snap.exists()) {
        const data = { id: snap.id, ...snap.data() } as T;
        setData(data);
      }
      setLoading(false);
    });
    return () => unsub();
  }, [path, id, db]);

  return { data, loading };
}
