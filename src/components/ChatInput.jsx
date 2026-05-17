import { useState, useEffect, useRef } from 'react';
import './ChatInput.css'

const STORAGE_KEY = 'ai_chat_history';
const API_URL = 'https://nova-ai-chatbot-442l.onrender.com';

export function ChatInput({ chatMessages, setChatMessages, setIsTyping }) {
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const recognitionRef = useRef(null);
  const isListeningRef = useRef(false);
  const keepAliveRef = useRef(null);
  const fileInputRef = useRef(null);
  const token = localStorage.getItem('nova_token');
  const preferences = JSON.parse(localStorage.getItem('nova_preferences') || '{}');

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) { const parsed = JSON.parse(saved); if (parsed.length > 0) setChatMessages(parsed); }
    // eslint-disable-next-line no-unused-vars
    } catch (e) { /* empty */ }
  }, [setChatMessages]);

  useEffect(() => {
    // eslint-disable-next-line no-unused-vars
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(chatMessages)); } catch (e) { /* empty */ }
  }, [chatMessages]);

  function createRecognition() {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) return null;
    const recognition = new SpeechRecognition();
    recognition.continuous = false; recognition.interimResults = false; recognition.lang = 'en-US';
    recognition.onstart = () => { isListeningRef.current = true; setIsListening(true); };
    recognition.onresult = (e) => setInputText(e.results[0][0].transcript);
    recognition.onerror = () => { isListeningRef.current = false; setIsListening(false); };
    recognition.onend = () => { isListeningRef.current = false; setIsListening(false); };
    return recognition;
  }

  useEffect(() => {
    recognitionRef.current = createRecognition();
    return () => { if (recognitionRef.current) recognitionRef.current.abort(); };
  }, []);

  function toggleListening() {
    if (!recognitionRef.current) { alert('Use Chrome for voice!'); return; }
    if (isListeningRef.current) {
      recognitionRef.current.abort(); isListeningRef.current = false; setIsListening(false);
    } else {
      if (window.speechSynthesis.speaking) { window.speechSynthesis.cancel(); setIsSpeaking(false); }
      const recognition = createRecognition();
      recognitionRef.current = recognition;
      // eslint-disable-next-line no-unused-vars
      setTimeout(() => { try { recognition.start(); } catch (e) { setIsListening(false); } }, 150);
    }
  }

  function speakText(text) {
    const clean = text.replace(/```[\s\S]*?```/g, 'code block').replace(/`([^`]+)`/g, '$1')
      .replace(/\*\*(.+?)\*\*/g, '$1').replace(/\*(.+?)\*/g, '$1').replace(/#{1,3} /g, '').replace(/<[^>]+>/g, '');
    window.speechSynthesis.cancel();
    setTimeout(() => {
      const utterance = new SpeechSynthesisUtterance(clean);
      utterance.lang = 'en-US';
      utterance.onstart = () => setIsSpeaking(true);
      utterance.onend = () => { setIsSpeaking(false); clearInterval(keepAliveRef.current); };
      utterance.onerror = () => { setIsSpeaking(false); clearInterval(keepAliveRef.current); };
      keepAliveRef.current = setInterval(() => {
        if (!window.speechSynthesis.speaking) { clearInterval(keepAliveRef.current); setIsSpeaking(false); }
        else { window.speechSynthesis.pause(); window.speechSynthesis.resume(); }
      }, 5000);
      window.speechSynthesis.speak(utterance);
    }, 100);
  }

  function stopSpeaking() { clearInterval(keepAliveRef.current); window.speechSynthesis.cancel(); setIsSpeaking(false); }

  function handleImageSelect(e) {
    const file = e.target.files[0];
    if (!file) return;
    setSelectedImage(file);
    if (file.type === 'application/pdf') {
      setImagePreview('pdf');
    } else {
      const reader = new FileReader();
      reader.onload = () => setImagePreview(reader.result);
      reader.readAsDataURL(file);
    }
  }

  function removeImage() {
    setSelectedImage(null); setImagePreview(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  }

  async function sendMessage() {
    if ((!inputText.trim() && !selectedImage) || isLoading) return;
    const userMessage = inputText.trim() || 'What is in this image?';
    const newChatMessages = [...chatMessages, { message: userMessage, sender: 'user', id: crypto.randomUUID(), image: imagePreview || null }];
    setChatMessages(newChatMessages);
    setInputText(''); setIsLoading(true); setIsTyping(true);

    try {
      let response;
      if (selectedImage) {
        const formData = new FormData();
        formData.append('file', selectedImage);
        formData.append('message', userMessage);
        response = await fetch(`${API_URL}/api/chat/file`, {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}` },
          body: formData
        });
      } else {
        response = await fetch(`${API_URL}/api/chat`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify({ 
            message: userMessage,
            history: chatMessages.slice(-10),
            preferences
          })
        });
      }
      const data = await response.json();
      setChatMessages([...newChatMessages, { message: data.reply || 'Sorry, no response.', sender: 'robot', id: crypto.randomUUID() }]);
      removeImage();
    } catch {
      setChatMessages([...newChatMessages, { message: 'Sorry, something went wrong.', sender: 'robot', id: crypto.randomUUID() }]);
    } finally { setIsLoading(false); setIsTyping(false); }
  }

  function handleKeyPress(e) { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); } }

  

  return (
    <div className="chat-input-wrapper">
      {imagePreview && (
        <div className="image-preview-container">
          {imagePreview === 'pdf' ? (
            <div className="pdf-preview">📄</div>
          ) : (
            <img src={imagePreview} alt="Selected" className="image-preview" />
          )}
          <span className="image-label">
            {imagePreview === 'pdf' ? `📄 ${selectedImage?.name}` : '🖼️ Image ready to send'}
          </span>
          <button className="remove-image" onClick={removeImage}>✕</button>
        </div>
      )}
      <div className="chat-input-container">
        <input type="file" accept="image/jpeg,image/jpg,image/png,image/gif,image/webp,application/pdf" ref={fileInputRef} onChange={handleImageSelect} style={{ display: 'none' }} />
        <button className={`icon-btn img-btn ${selectedImage ? 'active' : ''}`} onClick={() => fileInputRef.current.click()} title="Upload image or PDF" disabled={isLoading}>＋</button>
        <input
          placeholder={isListening ? "🎤 Listening..." : isLoading ? "NOVA is thinking..." : selectedImage ? (selectedImage.type === 'application/pdf' ? 'Ask about this PDF...' : 'Ask about this image...') : 'Ask NOVA anything...'}
          onChange={(e) => setInputText(e.target.value)}
          onKeyPress={handleKeyPress}
          value={inputText}
          className={`chat-input ${isListening ? 'listening' : ''}`}
          disabled={isLoading}
          autoFocus
        />
        <button className={`icon-btn mic-btn ${isListening ? 'active' : ''}`} onClick={toggleListening} disabled={isLoading} title={isListening ? "Stop mic" : "Speak"}>{isListening ? '🔴' : '🎤'}</button>
        <button className={`icon-btn speaker-btn ${isSpeaking ? 'active' : ''}`}
          onClick={() => { if (isSpeaking) { stopSpeaking(); } else { const lastBot = [...chatMessages].reverse().find(m => m.sender === 'robot'); if (lastBot) speakText(lastBot.message); } }}
          title={isSpeaking ? "Stop" : "Hear last response"}>{isSpeaking ? '🔇' : '🔊'}</button>
        <button onClick={sendMessage} className="send-button" disabled={isLoading || (!inputText.trim() && !selectedImage)}>
          {isLoading ? <span className="spinner"></span> : '➤'}
        </button>
      </div>
      <p className="input-hint">{isListening ? '🔴 Mic ON — click to stop' : 'Enter to send • 🖼️ image • 🎤 voice'}</p>
    </div>
  );
}
