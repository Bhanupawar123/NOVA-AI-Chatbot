import express from 'express';
import multer from 'multer';
import fs from 'fs';
import Groq from 'groq-sdk';
import { protect } from '../middleware/auth.js';
import dotenv from 'dotenv';
dotenv.config();

const router = express.Router();
const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

// ===== MULTER SETUP =====
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = 'uploads/';
    if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir);
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`);
  }
});

const fileFilter = (req, file, cb) => {
  const allowed = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp', 'application/pdf'];
  allowed.includes(file.mimetype) ? cb(null, true) : cb(new Error('Only JPG, PNG, GIF, WEBP, PDF allowed!'), false);
};

const upload = multer({ storage, fileFilter, limits: { fileSize: 10 * 1024 * 1024 } });

// ===== TEXT CHAT WITH MEMORY =====
router.post('/', protect, async (req, res) => {
  const { message, history = [], preferences = {} } = req.body;
  if (!message) return res.status(400).json({ error: 'Message is required' });

  try {
    const historyContext = history.slice(-10).map(msg =>
      `${msg.sender === 'user' ? req.user.name : 'NOVA'}: ${msg.message}`
    ).join('\n');

    const prefContext = Object.keys(preferences).length > 0
      ? `User preferences: ${JSON.stringify(preferences)}`
      : '';

    const systemPrompt = `You are NOVA, a smart and friendly AI assistant. 
The user's name is ${req.user.name}. Always address them by name occasionally to make it personal.
${prefContext}

Previous conversation context:
${historyContext}

Remember everything the user has told you and refer back to it naturally when relevant.
Keep responses concise, helpful, and friendly. Use the user's name naturally in responses.`;

    const completion = await groq.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: message }
      ],
      max_tokens: 1024,
    });

    const botReply = completion.choices[0]?.message?.content || 'Sorry, no response.';
    res.json({ reply: botReply });

  } catch (error) {
    console.error('Groq Error:', error);
    res.status(500).json({ error: 'Something went wrong. Please try again.' });
  }
});

// ===== FILE UPLOAD (Image description via text) =====
router.post('/file', protect, upload.single('file'), async (req, res) => {
  const { message } = req.body;
  const uploadedFile = req.file;

  if (!uploadedFile) return res.status(400).json({ error: 'File is required' });

  try {
    const isPDF = uploadedFile.mimetype === 'application/pdf';
    const userMessage = message || (isPDF ? 'Summarize this document.' : 'Describe this image.');

    // Groq text model use karenge — image describe karne ke liye user ka message forward karenge
    const completion = await groq.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      messages: [
        { role: 'system', content: `You are NOVA, a helpful AI assistant. User's name is ${req.user.name}.` },
        { role: 'user', content: `User uploaded a ${isPDF ? 'PDF document' : 'image'} and asks: "${userMessage}". Please respond helpfully.` }
      ],
      max_tokens: 1024,
    });

    fs.unlinkSync(uploadedFile.path);

    const botReply = completion.choices[0]?.message?.content || 'Sorry, could not process the file.';
    res.json({ reply: botReply });

  } catch (error) {
    if (uploadedFile && fs.existsSync(uploadedFile.path)) fs.unlinkSync(uploadedFile.path);
    console.error('File Error:', error);
    res.status(500).json({ error: 'Could not analyze file.' });
  }
});

export default router;
