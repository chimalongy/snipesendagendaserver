// db.js
import mongoose from 'mongoose';

export async function connectDB() {
  await mongoose.connect('', {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  });

  console.log('✅ MongoDB connected');
}

export { mongoose };
