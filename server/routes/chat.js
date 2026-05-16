import express from 'express';
import multer from 'multer';
import fs from 'fs';
import { GoogleGenAI } from '@google/genai';
import { protect } from '../middleware/auth.js';
import dotenv from 'dotenv';
dotenv.config();

const router = express.Router();
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

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
    // Chat history ko context mein convert karo
    const historyContext = history.slice(-10).map(msg =>
      `${msg.sender === 'user' ? req.user.name : 'NOVA'}: ${msg.message}`
    ).join('\n');

    // Preferences context
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

    const response = await ai.models.generateContent({
      model: 'gemini-2.0-flash',
      contents: message,
      config: { systemInstruction: systemPrompt }
    });

    res.json({ reply: response.text });

  } catch (error) {
    console.error('Gemini Error:', error);
    res.status(500).json({ error: 'Something went wrong. Please try again.' });
  }
});

// ===== FILE UPLOAD WITH MEMORY =====
router.post('/file', protect, upload.single('file'), async (req, res) => {
  const { message, history = [] } = req.body;
  const uploadedFile = req.file;

  if (!uploadedFile) return res.status(400).json({ error: 'File is required' });

  try {
    const fileData = fs.readFileSync(uploadedFile.path);
    const base64Data = fileData.toString('base64');
    const isPDF = uploadedFile.mimetype === 'application/pdf';

    const historyContext = history.slice(-6).map(msg =>
      `${msg.sender === 'user' ? req.user.name : 'NOVA'}: ${msg.message}`
    ).join('\n');

    const response = await ai.models.generateContent({
      model: 'gemini-2.0-flash',
      contents: [{
        parts: [
          { inlineData: { mimeType: uploadedFile.mimetype, data: base64Data } },
          { text: message || (isPDF ? 'Summarize this PDF.' : 'Describe this image.') }
        ]
      }],
      config: {
        systemInstruction: `You are NOVA. User's name is ${req.user.name}. Previous context:\n${historyContext}`
      }
    });

    fs.unlinkSync(uploadedFile.path);
    res.json({ reply: response.text });

  } catch (error) {
    if (uploadedFile && fs.existsSync(uploadedFile.path)) fs.unlinkSync(uploadedFile.path);
    console.error('File Error:', error);
    res.status(500).json({ error: 'Could not analyze file.' });
  }
});

export default router;
