import { initializeApp, getApps } from 'firebase/app';
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import { getFirestore, enableIndexedDbPersistence } from 'firebase/firestore';
import { collection, doc, getDoc, updateDoc, getDocs, query, limit } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyAKt3ELBP9GEEubuL1FDzJoVAhYuANisZw",
  authDomain: "rbfc25-b9560.firebaseapp.com",
  projectId: "rbfc25-b9560",
  storageBucket: "rbfc25-b9560.firebasestorage.app",
  messagingSenderId: "861239797265",
  appId: "1:861239797265:web:22ab3e8961e5ce65eb33b0",
  measurementId: "G-V16HJE3E4E"
};

// Initialize Firebase only if it hasn't been initialized
const app = !getApps().length ? initializeApp(firebaseConfig) : getApps()[0];

export const auth = getAuth(app);

// Initialize Firestore
const db = getFirestore(app);

// Only try to enable persistence in browser environments
if (typeof window !== 'undefined' && window.indexedDB) {
  enableIndexedDbPersistence(db).catch((err) => {
    if (err.code === 'failed-precondition') {
      console.warn('Multiple tabs open, persistence can only be enabled in one tab at a time.');
    } else if (err.code === 'unimplemented') {
      console.warn('The current browser does not support persistence.');
    }
  });
}

export { db };

// Function to get admin user info
export const getAdminUser = async () => {
  try {
    const usersRef = collection(db, 'users');
    const snapshot = await getDocs(usersRef);
    const adminUser = snapshot.docs.find(doc => doc.data().role === 'admin');
    if (adminUser) {
      return {
        id: adminUser.id,
        ...adminUser.data()
      };
    }
    return null;
  } catch (error) {
    console.error('Error getting admin user:', error);
    return null;
  }
};

// Function to make first user admin
export const makeFirstUserAdmin = async () => {
  try {
    const user = auth.currentUser;
    if (!user) return false;
    
    await updateDoc(doc(db, 'users', user.uid), {
      role: 'admin'
    });
    return true;
  } catch (error) {
    console.error('Error making first user admin:', error);
    return false;
  }
};
// Function to check if user is admin
export const isUserAdmin = async (uid: string): Promise<boolean> => {
  try {
    const userDoc = await getDoc(doc(db, 'users', uid));
    const userData = userDoc.data();
    return userDoc.exists() && (
      userData?.role === 'admin' || 
      userData?.email === 'Rbfcyoungstown@gmail.com'
    );
  } catch (error) {
    console.error('Error checking admin status:', error);
    return false;
  }
};

// Function to promote user to admin
export const promoteToAdmin = async (userId: string): Promise<boolean> => {
  try {
    const userRef = doc(db, 'users', userId);
    await updateDoc(userRef, {
      role: 'admin'
    });
    return true;
  } catch (error) {
    console.error('Error promoting user to admin:', error);
    return false;
  }
};

// Function to get all users
export const getAllUsers = async () => {
  try {
    const usersRef = collection(db, 'users');
    const snapshot = await getDocs(usersRef);
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  } catch (error) {
    console.error('Error fetching users:', error);
    return [];
  }
};
