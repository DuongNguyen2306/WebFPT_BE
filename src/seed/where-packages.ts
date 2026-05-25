import mongoose from 'mongoose';
import * as dotenv from 'dotenv';

dotenv.config();

async function run() {
  const uri = process.env.MONGODB_URI;
  if (!uri) throw new Error('Thiếu MONGODB_URI');
  await mongoose.connect(uri);
  const dbName = mongoose.connection.db?.databaseName;
  const count = await mongoose.connection.db?.collection('packages').countDocuments();
  const sample = await mongoose.connection.db
    ?.collection('packages')
    .find({}, { projection: { code: 1, name: 1, type: 1 } })
    .limit(5)
    .toArray();
  console.log('Database:', dbName);
  console.log('Collection: packages');
  console.log('Số document:', count);
  console.log('Mẫu:', sample);
  await mongoose.disconnect();
}

run().catch((e) => {
  console.error(e);
  process.exit(1);
});
