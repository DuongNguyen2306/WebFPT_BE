/**
 * Tạo admin mới (nếu chưa có) hoặc reset mật khẩu khi ADMIN_FORCE_RESET_PASSWORD=true.
 * Đăng nhập API luôn dùng passwordHash trong DB — không đọc .env lúc login.
 *
 * Usage:
 *   npm run seed:admin
 *   ADMIN_FORCE_RESET_PASSWORD=true npm run seed:admin
 */
import mongoose from 'mongoose';
import * as argon2 from 'argon2';
import * as dotenv from 'dotenv';
import { AdminSchema, BuiltInAdminRole } from '../admins/admin.schema';

dotenv.config();

async function run() {
  const uri = process.env.MONGODB_URI;
  if (!uri) throw new Error('Thiếu MONGODB_URI');

  const email = (process.env.ADMIN_SEED_EMAIL ?? 'admin@example.com').toLowerCase().trim();
  const password = process.env.ADMIN_SEED_PASSWORD ?? 'ChangeMeAdmin123!';
  const forceReset = process.env.ADMIN_FORCE_RESET_PASSWORD === 'true';

  await mongoose.connect(uri);
  const Admin = mongoose.models.Admin ?? mongoose.model('Admin', AdminSchema);
  const existing = await Admin.findOne({ email });

  if (existing && !forceReset) {
    console.log(`Admin đã có: "${email}" — giữ nguyên mật khẩu trong DB.`);
    console.log('Muốn ghi đè từ .env: ADMIN_FORCE_RESET_PASSWORD=true npm run seed:admin');
    await mongoose.disconnect();
    return;
  }

  const passwordHash = await argon2.hash(password);
  const result = await Admin.findOneAndUpdate(
    { email },
    { $set: { email, passwordHash, role: BuiltInAdminRole.ADMIN } },
    { upsert: true, new: true },
  );

  console.log(
    existing
      ? `Đã reset mật khẩu admin "${result.email}" theo ADMIN_SEED_PASSWORD (.env).`
      : `Đã tạo admin "${result.email}" — mật khẩu lưu trong DB (hash từ .env lần seed đầu).`,
  );
  await mongoose.disconnect();
}

run().catch((e) => {
  console.error(e);
  process.exit(1);
});
