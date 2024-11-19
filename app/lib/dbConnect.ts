import mongoose from 'mongoose';

const MONGO_URI = process.env.MONGODB_URI || 'mongodb+srv://kariakistephen809:GPH8xjvvq8UuTjLL@invoice-db.08gaz.mongodb.net/?retryWrites=true&w=majority&appName=invoice-db';

if (!MONGO_URI) {
  throw new Error('Please define the MONGO_URI environment variable inside .env.local');
}

let cached: { conn: mongoose.Connection | null; promise: Promise<mongoose.Connection> | null } = global.mongoose;

if (!cached) {
  cached = global.mongoose = { conn: null, promise: null };
}


async function dbConnect() {
  if (cached.conn) {
    return cached.conn;
  }

  if (!cached.promise) {
    cached.promise = mongoose.connect(MONGO_URI).then((mongoose) => mongoose);
  }
  
  cached.conn = await cached.promise;
  return cached.conn;
}

export default dbConnect;
