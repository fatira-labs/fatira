import mongoose from 'mongoose'
import dotenv from 'dotenv';
import express from 'express';
import userRoutes from './routes/user.js';
import cors from 'cors';

dotenv.config();


main().catch((err) => console.log(err));
const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use('/api/users', userRoutes);

async function main() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB');
    app.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`);
    });
  } catch (error) {
    console.error('Error connecting to MongoDB:', error);
  }
}