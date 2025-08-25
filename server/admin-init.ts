import { createUser, getUserByEmail } from './database';

export async function initializeAdmin(): Promise<void> {
  try {
    const adminEmail = 'admin179e@gmail.com';
    const adminPassword = '123456';
    
    // Check if admin already exists
    const existingAdmin = getUserByEmail(adminEmail);
    
    if (!existingAdmin) {
      // Create the only admin user
      const adminUser = {
        username: 'admin179e',
        email: adminEmail,
        password: adminPassword,
        role: 'admin' as const,
        full_name: 'System Administrator',
        phone: '+91 9999999999'
      };
      
      const adminId = await createUser(adminUser);
      console.log('✅ Default admin user created successfully');
      console.log('📧 Admin Email: admin179e@gmail.com');
      console.log('🔐 Admin Password: 123456');
      console.log(`👤 Admin ID: ${adminId}`);
    } else {
      console.log('ℹ️ Admin user already exists');
    }
  } catch (error) {
    console.error('❌ Error initializing admin:', error);
  }
}

// Function to check if signup as admin should be allowed
export function isAdminSignupAllowed(email: string): boolean {
  // Only allow the specific admin email
  return email === 'admin179e@gmail.com';
}
