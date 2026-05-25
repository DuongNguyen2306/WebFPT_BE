/**
 * Tạo chuỗi passwordHash (argon2) để dán vào MongoDB Compass.
 * Usage: npm run hash:password -- yourPlainPassword
 */
import * as argon2 from 'argon2';

async function run() {
  const plain = process.argv[2];
  if (!plain) {
    console.error('Cách dùng: npm run hash:password -- MatKhauCuaBan');
    process.exit(1);
  }
  const hash = await argon2.hash(plain);
  console.log('\nDán vào field passwordHash (admins hoặc customers):\n');
  console.log(hash);
  console.log('');
}

run().catch((e) => {
  console.error(e);
  process.exit(1);
});
