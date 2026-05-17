import jwt from 'jsonwebtoken';
import User from '../models/User.js';

export async function protect(req, res, next) {
  try {
    const token = req.headers.authorization?.split(' ')[1];

    if (!token) {
      return res.status(401).json({ error: 'Please login to use NOVA' });
    }

    // eslint-disable-next-line no-undef
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'nova_secret_key');
    req.user = await User.findById(decoded.id).select('-password');

    if (!req.user) {
      return res.status(401).json({ error: 'User not found' });
    }

    next();
  // eslint-disable-next-line no-unused-vars
  } catch (error) {
    res.status(401).json({ error: 'Invalid or expired token. Please login again.' });
  }
}