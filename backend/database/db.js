import mongoose from "../models/node_modules/mongoose/index.js";

const MONGO_URI = "mongodb://127.0.0.1:27017/lightning_stores";

const dbConnect = async () => {
  try {
    mongoose.set('bufferCommands', false);
    await mongoose.connect(MONGO_URI, {
      serverSelectionTimeoutMS: 5000,
    });
    console.log("MongoDB connected successfully");
    mongoose.connection.on('error', (err) => {
      console.error('Mongo connection error:', err?.message || err);
    });
    mongoose.connection.on('disconnected', () => {
      console.error('Mongo connection disconnected');
    });
  } catch (err) {
    console.error("MongoDB connection error:", err?.message || err);
  }
};

export default dbConnect;
