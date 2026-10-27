import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { User } from './models.js';

const JWT_SECRET = process.env.JWT_SECRET || 'change-this-secret';
const app = express();
app.use(cors());
app.use(express.json());

const publicUser = (user) => ({ id: user._id, name: user.name, email: user.email, createdAt: user.createdAt });
const signToken = (user) => jwt.sign({ id: user._id }, JWT_SECRET, { expiresIn: '1d' });

app.post('/api/auth/signup', async (req, res) => {
  try {
    const { name, email, password } = req.body;
    if (!name?.trim() || !email?.trim() || !password) return res.status(400).json({ message: 'Name, email and password are required' });
    if (password.length < 6) return res.status(400).json({ message: 'Password must be at least 6 characters' });
    if (await User.exists({ email: email.trim().toLowerCase() })) return res.status(409).json({ message: 'An account with this email already exists' });
    const user = await User.create({ name, email, password: await bcrypt.hash(password, 10) });
    res.status(201).json({ token: signToken(user), user: publicUser(user) });
  } catch (error) { res.status(500).json({ message: error.message }); }
});

app.post('/api/auth/signin', async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = email && await User.findOne({ email: email.trim().toLowerCase() });
    if (!user || !password || !(await bcrypt.compare(password, user.password))) return res.status(401).json({ message: 'Invalid email or password' });
    res.json({ token: signToken(user), user: publicUser(user) });
  } catch (error) { res.status(500).json({ message: error.message }); }
});

app.get('/api/auth/me', async (req, res) => {
  try {
    const { id } = jwt.verify(req.headers.authorization?.replace('Bearer ', ''), JWT_SECRET);
    const user = await User.findById(id);
    if (!user) return res.status(401).json({ message: 'User not found' });
    res.json({ user: publicUser(user) });
  } catch { res.status(401).json({ message: 'Not authenticated' }); }
});

const port = process.env.PORT || 5001;
mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/auth_app')
  .then(() => app.listen(port, () => console.log(`API running on port ${port} (MongoDB connected)`)))
  .catch((error) => { console.error('MongoDB connection failed:', error.message); process.exit(1); });
