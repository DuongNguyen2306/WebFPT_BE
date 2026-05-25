/**
 * Admin chỉ ở collection `admins` — không còn trong `customers`.
 * - Gán email từ username (document admins cũ)
 * - Xóa mọi customer trùng login với admin
 * - Chuyển customer role=ADMIN sang admins (nếu chưa có) rồi xóa customer
 * - $unset role trên customers (field không dùng nữa)
 *
 * Usage: npm run db:admins-only
 */
import mongoose from 'mongoose';
import * as dotenv from 'dotenv';
import { AdminSchema, BuiltInAdminRole } from '../admins/admin.schema';
import { CustomerSchema } from '../customers/customer.schema';

dotenv.config();

async function run() {
  const uri = process.env.MONGODB_URI;
  if (!uri) throw new Error('Thiếu MONGODB_URI');

  await mongoose.connect(uri);
  const db = mongoose.connection.db!;
  const Admin = mongoose.models.Admin ?? mongoose.model('Admin', AdminSchema);
  const Customer = mongoose.models.Customer ?? mongoose.model('Customer', CustomerSchema);

  console.log('=== Admin chỉ trong collection admins ===\n');

  const legacy = await Admin.find({
    $or: [{ email: { $exists: false } }, { email: null }, { email: '' }],
  }).lean();
  for (const a of legacy) {
    const u = (a as { username?: string }).username;
    if (u) {
      await Admin.updateOne({ _id: a._id }, { $set: { email: String(u).toLowerCase().trim() } });
      console.log(`  admins: email ← username "${u}"`);
    }
  }

  const adminLogins = new Set<string>();
  for (const a of await Admin.find().lean()) {
    if (a.email) adminLogins.add(String(a.email).toLowerCase());
    const u = (a as { username?: string }).username;
    if (u) adminLogins.add(String(u).toLowerCase());
  }

  const wrongRole = await Customer.find({ role: { $in: ['ADMIN', 'admin'] } }).lean();
  for (const c of wrongRole) {
    const login = String(c.username).toLowerCase();
    const exists = await Admin.findOne({ $or: [{ email: login }, { username: login }] });
    if (!exists) {
      await Admin.create({
        email: login,
        passwordHash: c.passwordHash,
        fullName: (c as { fullName?: string }).fullName,
        role: BuiltInAdminRole.ADMIN,
      });
      console.log(`  chuyển customer ADMIN → admins: "${login}"`);
    }
    await Customer.deleteOne({ _id: c._id });
  }

  for (const login of adminLogins) {
    const r = await Customer.deleteMany({ username: login });
    if (r.deletedCount) {
      console.log(`  xóa ${r.deletedCount} customer trùng "${login}"`);
    }
  }

  const unsetRole = await db.collection('customers').updateMany({}, { $unset: { role: '' } });
  console.log(`  customers: đã bỏ field role (${unsetRole.modifiedCount} doc)`);

  console.log(`\nadmins: ${await Admin.countDocuments()}`);
  console.log(`customers: ${await Customer.countDocuments()}`);
  console.log('\nĐăng nhập admin: account = email trong admins (vd. admin1)');
  await mongoose.disconnect();
}

run().catch((e) => {
  console.error(e);
  process.exit(1);
});
