import React, { createContext, useContext, useState, useEffect } from 'react';
import { 
  onSnapshot, 
  collection, 
  doc, 
  setDoc, 
  deleteDoc, 
  query, 
  orderBy,
  getDoc
} from 'firebase/firestore';
import { 
  onAuthStateChanged, 
  signInWithPopup, 
  GoogleAuthProvider, 
  signOut,
  User as FirebaseUser
} from 'firebase/auth';
import { db, auth, handleFirestoreError, OperationType } from './firebase';
import { User, UserRole, Branch, ConferenceBatch } from './types';

interface FirebaseContextType {
  users: User[];
  branches: Branch[];
  batches: ConferenceBatch[];
  currentUser: User | null;
  firebaseUser: FirebaseUser | null;
  loading: boolean;
  login: () => Promise<void>;
  logout: () => Promise<void>;
  addUser: (user: User) => Promise<void>;
  deleteUser: (id: string) => Promise<void>;
  updateUser: (user: User) => Promise<void>;
  addBranch: (branch: Branch) => Promise<void>;
  deleteBranch: (id: string) => Promise<void>;
  addBatch: (batch: ConferenceBatch) => Promise<void>;
  updateBatch: (batch: ConferenceBatch) => Promise<void>;
  deleteBatch: (id: string) => Promise<void>;
}

const FirebaseContext = createContext<FirebaseContextType | undefined>(undefined);

export const FirebaseProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [users, setUsers] = useState<User[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [batches, setBatches] = useState<ConferenceBatch[]>([]);
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setFirebaseUser(user);
      if (user) {
        // Fetch user profile from Firestore
        try {
          const userDoc = await getDoc(doc(db, 'users', user.uid));
          if (userDoc.exists()) {
            setCurrentUser(userDoc.data() as User);
          } else {
            // If user doesn't exist in Firestore, we might need to create them or handle it
            // For now, let's just set currentUser to null or a guest profile
            setCurrentUser(null);
          }
        } catch (error) {
          console.error("Error fetching user profile:", error);
        }
      } else {
        setCurrentUser(null);
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!firebaseUser) return;

    const unsubUsers = onSnapshot(collection(db, 'users'), (snapshot) => {
      setUsers(snapshot.docs.map(doc => doc.data() as User));
    }, (error) => handleFirestoreError(error, OperationType.LIST, 'users'));

    const unsubBranches = onSnapshot(collection(db, 'branches'), (snapshot) => {
      setBranches(snapshot.docs.map(doc => doc.data() as Branch));
    }, (error) => handleFirestoreError(error, OperationType.LIST, 'branches'));

    const unsubBatches = onSnapshot(query(collection(db, 'batches'), orderBy('startTime', 'desc')), (snapshot) => {
      setBatches(snapshot.docs.map(doc => doc.data() as ConferenceBatch));
    }, (error) => handleFirestoreError(error, OperationType.LIST, 'batches'));

    return () => {
      unsubUsers();
      unsubBranches();
      unsubBatches();
    };
  }, [firebaseUser]);

  const login = async () => {
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider);
    } catch (error) {
      console.error("Login Error:", error);
    }
  };

  const logout = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error("Logout Error:", error);
    }
  };

  const addUser = async (user: User) => {
    try {
      await setDoc(doc(db, 'users', user.id), user);
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `users/${user.id}`);
    }
  };

  const deleteUser = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'users', id));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `users/${id}`);
    }
  };

  const updateUser = async (user: User) => {
    try {
      await setDoc(doc(db, 'users', user.id), user);
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `users/${user.id}`);
    }
  };

  const addBranch = async (branch: Branch) => {
    try {
      await setDoc(doc(db, 'branches', branch.id), branch);
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `branches/${branch.id}`);
    }
  };

  const deleteBranch = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'branches', id));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `branches/${id}`);
    }
  };

  const addBatch = async (batch: ConferenceBatch) => {
    try {
      await setDoc(doc(db, 'batches', batch.id), batch);
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `batches/${batch.id}`);
    }
  };

  const updateBatch = async (batch: ConferenceBatch) => {
    try {
      await setDoc(doc(db, 'batches', batch.id), batch);
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `batches/${batch.id}`);
    }
  };

  const deleteBatch = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'batches', id));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `batches/${id}`);
    }
  };

  return (
    <FirebaseContext.Provider value={{ 
      users, branches, batches, currentUser, firebaseUser, loading, 
      login, logout, addUser, deleteUser, updateUser, addBranch, deleteBranch,
      addBatch, updateBatch, deleteBatch
    }}>
      {children}
    </FirebaseContext.Provider>
  );
};

export const useFirebase = () => {
  const context = useContext(FirebaseContext);
  if (context === undefined) {
    throw new Error('useFirebase must be used within a FirebaseProvider');
  }
  return context;
};
