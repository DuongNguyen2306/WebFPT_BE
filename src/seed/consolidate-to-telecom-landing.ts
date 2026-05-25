/**
 * Gom dữ liệu app vào một database: telecom_landing
 * - Copy từ DB `test` (nếu có) sang telecom_landing
 * - Đảm bảo admin + packages seed
 * - Tùy chọn xóa DB `test` sau khi copy (DROP_TEST_DB=true)
 *
 * Usage: npm run db:consolidate
 */
import mongoose from 'mongoose';
import * as dotenv from 'dotenv';
import * as argon2 from 'argon2';
import { PackageSchema } from '../packages/package.schema';
import { AdminSchema, BuiltInAdminRole } from '../admins/admin.schema';
import { CustomerSchema } from '../customers/customer.schema';
import { LeadSchema } from '../leads/lead.schema';

dotenv.config();

const APP_COLLECTIONS = ['packages', 'admins', 'customers', 'leads'] as const;

function buildUriWithDb(baseUri: string, dbName: string): string {
  const qIndex = baseUri.indexOf('?');
  const query = qIndex >= 0 ? baseUri.slice(qIndex) : '';
  const withoutQuery = qIndex >= 0 ? baseUri.slice(0, qIndex) : baseUri;
  const lastSlash = withoutQuery.lastIndexOf('/');
  const prefix =
    lastSlash > 'mongodb://'.length ? withoutQuery.slice(0, lastSlash) : withoutQuery.replace(/\/$/, '');
  return `${prefix}/${dbName}${query}`;
}

async function countDocs(conn: mongoose.Connection, name: string) {
  if (!conn.db) return 0;
  const cols = await conn.db.listCollections({ name }).toArray();
  if (!cols.length) return 0;
  return conn.db.collection(name).countDocuments();
}

async function copyCollection(
  from: mongoose.Connection,
  to: mongoose.Connection,
  name: string,
  uniqueField?: string,
) {
  if (!from.db || !to.db) return { copied: 0, skipped: 0 };

  const cols = await from.db.listCollections({ name }).toArray();
  if (!cols.length) return { copied: 0, skipped: 0 };

  const docs = await from.db.collection(name).find({}).toArray();
  let copied = 0;
  let skipped = 0;

  for (const doc of docs) {
    const filter = uniqueField && doc[uniqueField] != null ? { [uniqueField]: doc[uniqueField] } : { _id: doc._id };
    const exists = await to.db.collection(name).findOne(filter);
    if (exists) {
      skipped += 1;
      continue;
    }
    const { _id, ...rest } = doc;
    await to.db.collection(name).insertOne({ ...rest });
    copied += 1;
  }

  return { copied, skipped };
}

async function ensureAdmin(conn: mongoose.Connection) {
  const email = (process.env.ADMIN_SEED_EMAIL ?? 'admin1').toLowerCase().trim();
  const password = process.env.ADMIN_SEED_PASSWORD ?? '123456';
  const forceReset = process.env.ADMIN_FORCE_RESET_PASSWORD === 'true';
  const Admin = conn.models.Admin ?? conn.model('Admin', AdminSchema);
  const existing = await Admin.findOne({ email });
  if (existing && !forceReset) {
    console.log(`  admin: "${email}" đã có — giữ mật khẩu trong DB`);
    return;
  }
  const passwordHash = await argon2.hash(password);
  await Admin.findOneAndUpdate(
    { email },
    { $set: { email, passwordHash, role: BuiltInAdminRole.ADMIN } },
    { upsert: true },
  );
  console.log(
    existing
      ? `  admin: đã reset mật khẩu "${email}" từ .env`
      : `  admin: đã tạo "${email}" (mật khẩu hash trong DB)`,
  );
}

async function run() {
  const uri = process.env.MONGODB_URI;
  if (!uri) throw new Error('Thiếu MONGODB_URI');

  const targetDb = 'telecom_landing';
  const sourceTestDb = 'test';

  const mainUri = buildUriWithDb(uri, targetDb);
  const testUri = buildUriWithDb(uri, sourceTestDb);

  console.log('=== Gom dữ liệu vào telecom_landing ===\n');
  console.log(`Target: ${targetDb}`);

  const main = await mongoose.createConnection(mainUri).asPromise();
  const test = await mongoose.createConnection(testUri).asPromise();

  // Đăng ký model trên main (cho ensureAdmin)
  main.model('Admin', AdminSchema);
  main.model('Package', PackageSchema);
  main.model('Customer', CustomerSchema);
  main.model('Lead', LeadSchema);

  console.log('\n--- Trước khi gom ---');
  for (const c of APP_COLLECTIONS) {
    const n = await countDocs(main, c);
    const t = await countDocs(test, c);
    console.log(`  ${c}: telecom_landing=${n}, test=${t}`);
  }

  console.log('\n--- Copy test → telecom_landing (bỏ qua trùng) ---');
  const uniqueKeys: Record<string, string | undefined> = {
    packages: 'code',
    admins: 'email',
    customers: 'username',
    leads: undefined,
  };

  for (const c of APP_COLLECTIONS) {
    const { copied, skipped } = await copyCollection(test, main, c, uniqueKeys[c]);
    console.log(`  ${c}: +${copied} mới, ${skipped} đã có (bỏ qua)`);
  }

  console.log('\n--- Đồng bộ admin đăng nhập ---');
  await ensureAdmin(main);

  const pkgCount = await countDocs(main, 'packages');
  if (pkgCount < 10) {
    console.log('\n--- Packages ít — chạy: npm run seed:packages ---');
  }

  console.log('\n--- Sau khi gom ---');
  for (const c of APP_COLLECTIONS) {
    console.log(`  ${c}: ${await countDocs(main, c)}`);
  }

  if (process.env.DROP_TEST_DB === 'true') {
    if (test.db) {
      await test.db.dropDatabase();
      console.log(`\nĐã xóa database "${sourceTestDb}" (DROP_TEST_DB=true).`);
    }
  } else {
    console.log(
      `\nGiữ nguyên DB "test". Muốn xóa sau khi đã kiểm tra: DROP_TEST_DB=true npm run db:consolidate`,
    );
  }

  console.log(
    '\nLưu ý: "sample_mflix" là data mẫu Atlas — không thuộc app. Xóa tay trên Compass nếu không dùng.',
  );
  console.log('Chỉ dùng database: telecom_landing (admins, customers, leads, packages).\n');

  await test.close();
  await main.close();
}

run().catch((e) => {
  console.error(e);
  process.exit(1);
});
