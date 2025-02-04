import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();
mongoose.connection.on('connected', () => console.log('Connected to db'));
mongoose.connection.on('open', () => console.log('Open connection to db'));
mongoose.connection.on('disconnected', () => console.log('disconnected from db'));
mongoose.connection.on('reconnected', () => console.log('Reconnected to db'));
mongoose.connection.on('disconnecting', () => console.log('disconnecting from db'));
mongoose.connection.on('close', () => console.log('Close connection to db'));

const mongoUri = process.env.MONGODB_URL;

if (!mongoUri) {
  throw new Error('Please define the MONGODB_URL environment variable inside .env');
}

const connectToDB = () =>
  mongoose.connect(mongoUri).catch((err) => {
    console.error(err);
    process.exit(1);
  });

const conn = mongoose.connection;

export { connectToDB, conn };
