import { auth, isUserAdmin } from './firebase';

const checkCurrentUserAdmin = async () => {
  const user = auth.currentUser;
  
  if (!user) {
    console.log('No user is currently logged in');
    return;
  }

  try {
    const isAdmin = await isUserAdmin(user.uid);
    console.log('Current user:', {
      name: user.displayName || 'No display name',
      email: user.email,
      isAdmin: isAdmin
    });
  } catch (error) {
    console.error('Error checking admin status:', error);
  }
};

checkCurrentUserAdmin();