/**
 * - Xóa khách trùng username với admin (vd. admin1)
 * - Sửa admins thiếu `email` (copy từ `username`)
 * - Đặt role customers = CUSTOMER
 *
 * Usage: npm run db:fix-admin-collision
 */
import mongoose from 'mongoose';
import * as dotenv from 'dotenv';
import { AdminSchema } from '../admins/admin.schema';
import { CustomerSchema } from '../customers/customer.schema';
import { AppRole } from '../common/enums';

dotenv.config();

async function run() {
  const uri = process.env.MONGODB_URI;
  if (!uri) throw new Error('Thiếu MONGODB_URI');

  await mongoose.connect(uri);
  const Admin = mongoose.models.Admin ?? mongoose.model('Admin', AdminSchema);
  const Customer = mongoose.models.Customer ?? mongoose.model('Customer', CustomerSchema);

  const legacyAdmins = await Admin.find({
    $or: [{ email: { $exists: false } }, { email: null }, { email: '' }],
  }).lean();
  let emailFixed = 0;
  for (const a of legacyAdmins) {
    const u = (a as { username?: string }).username;
    if (u) {
      await Admin.updateOne({ _id: a._id }, { $set: { email: u.toLowerCase().trim() } });
      emailFixed += 1;
      console.log(`  admins: đã gán email="${u}" từ username`);
    }
  }
  if (!emailFixed) console.log('  admins: không cần sửa email/username');

  const admins = await Admin.find().lean();
  let removed = 0;
  for (const a of admins) {
    const email = String(a.email).toLowerCase();
    const r = await Customer.deleteMany({ username: email });
    if (r.deletedCount) {
      console.log(`Đã xóa ${r.deletedCount} customer trùng username "${email}"`);
      removed += r.deletedCount;
    }
  }

  const fixed = await Customer.updateMany({}, { $set: { role: AppRole.CUSTOMER } });
  console.log(`Đã đặt role=CUSTOMER cho mọi document customers: ${fixed.modifiedCount} sửa`);
  console.log(`Tổng customer bị xóa (trùng admin): ${removed}`);
  console.log(`Admins đã sửa email từ username: ${emailFixed}`);
  console.log('\nĐăng nhập admin: POST /api/v1/auth/login-unified hoặc /admin/auth/login');
  console.log('  account = email trong document (vd. admin1) + mật khẩu plain khớp passwordHash');
  await mongoose.disconnect();
}

run().catch((e) => {
  console.error(e);
  process.exit(1);
});
