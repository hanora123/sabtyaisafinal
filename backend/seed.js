async function seed() {
  const res = await fetch('http://localhost:3000/v1/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'admin@alhanora.com', password: 'password123' })
  });
  const cookie = res.headers.get('set-cookie');
  console.log('Login:', await res.json());

  const accRes = await fetch('http://localhost:3000/v1/accounting/seed-default-accounts', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'cookie': cookie }
  });
  console.log('Accounts:', await accRes.text());

  const invRes = await fetch('http://localhost:3000/v1/inventories/seed-default', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'cookie': cookie }
  });
  console.log('Inventory:', await invRes.text());
}
seed().catch(console.error);
