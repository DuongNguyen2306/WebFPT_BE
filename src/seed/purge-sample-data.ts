/**
 * Xóa dữ liệu mẫu (gói cước + lead), GIỮ tài khoản: admins + customers.
 *
 * Usage: npm run db:purge-sample
 */
import mongoose from 'mongoose';
import * as dotenv from 'dotenv';

dotenv.config();

const PURGE_COLLECTIONS = ['packages', 'leads'] as const;
const KEEP_COLLECTIONS = ['admins', 'customers'] as const;

function buildUriWithDb(baseUri: string, dbName: string): string {
  const qIndex = baseUri.indexOf('?');
  const query = qIndex >= 0 ? baseUri.slice(qIndex) : '';
  const withoutQuery = qIndex >= 0 ? baseUri.slice(0, qIndex) : baseUri;
  const lastSlash = withoutQuery.lastIndexOf('/');
  const prefix =
    lastSlash > 'mongodb://'.length ? withoutQuery.slice(0, lastSlash) : withoutQuery.replace(/\/$/, '');
  return `${prefix}/${dbName}${query}`;
}

async function count(conn: mongoose.Connection, name: string) {
  if (!conn.db) return 0;
  const cols = await conn.db.listCollections({ name }).toArray();
  if (!cols.length) return 0;
  return conn.db.collection(name).countDocuments();
}

async function run() {
  const baseUri = process.env.MONGODB_URI;
  if (!baseUri) throw new Error('Thiếu MONGODB_URI trong .env');

  const uri = buildUriWithDb(baseUri, 'telecom_landing');
  console.log('=== Xóa data mẫu (giữ user) ===\n');
  console.log(`Database: telecom_landing\n`);

  const conn = await mongoose.createConnection(uri).asPromise();

  console.log('--- Trước ---');
  for (const c of [...PURGE_COLLECTIONS, ...KEEP_COLLECTIONS]) {
    console.log(`  ${c}: ${await count(conn, c)}`);
  }

  console.log('\n--- Xóa packages + leads ---');
  for (const c of PURGE_COLLECTIONS) {
    if (!conn.db) continue;
    const r = await conn.db.collection(c).deleteMany({});
    console.log(`  ${c}: đã xóa ${r.deletedCount} document`);
  }

  console.log('\n--- Sau (giữ nguyên) ---');
  for (const c of KEEP_COLLECTIONS) {
    console.log(`  ${c}: ${await count(conn, c)} (giữ)`);
  }
  for (const c of PURGE_COLLECTIONS) {
    console.log(`  ${c}: ${await count(conn, c)}`);
  }

  console.log('\nXong. Tài khoản admin/khách vẫn còn. Gói & lead đã xóa.\n');
  await conn.close();
}

run().catch((e) => {
  console.error(e);
  process.exit(1);
});
