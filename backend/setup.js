const BASE_URL = 'http://localhost:3000/v1';

async function setup() {
  console.log('--- Starting System Setup ---');

  // 1. Seed Admin
  console.log('1. Seeding Default Admin...');
  const seedAdminRes = await fetch(`${BASE_URL}/auth/seed-default-admin`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: 'admin@alhanora.com',
      password: 'password123',
      username: 'admin',
      fullName: 'System Admin'
    })
  });
  
  if (seedAdminRes.ok || seedAdminRes.status === 401) { // 401 might mean already seeded
    console.log('Admin seeded or already exists.');
  } else {
    console.error('Failed to seed admin:', await seedAdminRes.text());
    return;
  }

  // 2. Login
  console.log('2. Logging in...');
  const loginRes = await fetch(`${BASE_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: 'admin@alhanora.com',
      password: 'password123'
    })
  });

  if (!loginRes.ok) {
    console.error('Login failed:', await loginRes.text());
    return;
  }
  
  const loginData = await loginRes.json();
  console.log('Logged in as:', loginData.user.email);
  const cookie = loginRes.headers.get('set-cookie');

  // 3. Seed Accounts
  console.log('3. Seeding Default Accounts...');
  const seedAccountsRes = await fetch(`${BASE_URL}/accounting/seed-default-accounts`, {
    method: 'POST',
    headers: { 
      'Content-Type': 'application/json',
      'cookie': cookie
    }
  });
  
  if (seedAccountsRes.ok) {
    console.log('Default accounts seeded successfully.');
  } else {
    console.error('Failed to seed accounts:', await seedAccountsRes.text());
  }

  // 4. Seed Inventory
  console.log('4. Seeding Default Inventory...');
  const seedInvRes = await fetch(`${BASE_URL}/inventories/seed-default`, {
    method: 'POST',
    headers: { 
      'Content-Type': 'application/json',
      'cookie': cookie
    }
  });
  
  if (seedInvRes.ok) {
    console.log('Default inventory seeded successfully.');
  } else {
    console.error('Failed to seed inventory:', await seedInvRes.text());
  }

  console.log('--- Setup Complete ---');
}

setup().catch(console.error);
