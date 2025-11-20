
import {
  collection,
  onSnapshot,
  query,
  where,
  getDocs,
  Query,
  DocumentData,
} from 'firebase/firestore';
import { useEffect, useState } from 'react';
import { useFirebase } from '../provider';

export function useCollection<T>(path: string, uid?: string | null) {
  const [data, setData] = useState<T[]>();
  const [loading, setLoading] = useState(true);
  const { firestore: db } = useFirebase();

  useEffect(() => {
    if (!db) {
      return;
    }
    let colQuery: Query<DocumentData>;
    if (uid !== undefined) {
      // If uid is provided, create a query to filter by uid.
      // Note: This requires a composite index in Firestore.
      colQuery = query(collection(db, path), where('uid', '==', uid));
    } else {
      // If no uid, get the whole collection.
      colQuery = query(collection(db, path));
    }
    const unsubscribe = onSnapshot(
      colQuery,
      (snapshot) => {
        const data: T[] = [];
        snapshot.forEach((doc) => {
          data.push({ id: doc.id, ...doc.data() } as T);
        });
        setData(data);
        setLoading(false);
      },
      (err) => {
        console.error(err);
        setLoading(false);
      },
    );
    return () => unsubscribe();
  }, [path, uid, db]);

  return { data, loading };
}
