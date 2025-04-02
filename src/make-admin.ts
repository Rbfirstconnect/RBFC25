import { auth, db } from './firebase';
import { doc, updateDoc } from 'firebase/firestore';

const makeAdmin = async () => {
  try {
    const user = auth.currentUser;
    if (!user) {
      console.log('No user is currently logged in');
      return false;
    }
    
    await updateDoc(doc(db, 'users', user.uid), {
      role: 'admin'
    });
    
    console.log('Successfully made current user an admin!');
    return true;
  } catch (error) {
    console.error('Error making user admin:', error);
    return false;
  }
}

makeAdmin().catch(error => {
  console.error('Error:', error);
  process.exit(1);
});