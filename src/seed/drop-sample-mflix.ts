/**
 * Xóa database mẫu sample_mflix trên cluster (Atlas).
 * Usage: npm run db:drop-sample-mflix
 */
import mongoose from 'mongoose';
import * as dotenv from 'dotenv';

dotenv.config();

async function run() {
  const uri = process.env.MONGODB_URI;
  if (!uri) throw new Error('Thiếu MONGODB_URI trong .env');

  await mongoose.connect(uri);
  const client = mongoose.connection.getClient();

  const { databases } = await client.db().admin().listDatabases();
  const found = databases.some((d) => d.name === 'sample_mflix');
  if (!found) {
    console.log('Không có database sample_mflix — bỏ qua.');
    await mongoose.disconnect();
    return;
  }

  await client.db('sample_mflix').dropDatabase();
  console.log('Đã xóa database sample_mflix.');

  await mongoose.disconnect();
}

run().catch((e) => {
  console.error(e);
  process.exit(1);
});
