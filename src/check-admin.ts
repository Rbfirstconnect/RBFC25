import { getAdminUser } from './firebase';

getAdminUser().then(admin => {
  if (admin) {
    console.log('Admin user details:', {
      name: admin.displayName || 'No display name',
      email: admin.email,
      id: admin.id
    });
  } else {
    console.log('No admin user found');
  }
}).catch(err => console.error('Error:', err));