import { useState } from 'react';
import { useAuth } from './context/AuthContext';
import { AuthPage } from './pages/AuthPage';
import { ChatInput } from './components/ChatInput'
import { ChatMessages } from './components/ChatMessages'
import './App.css'

function App() {
  const { user, logout, loading } = useAuth();
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return `Good morning, ${user?.name}! ☀️`;
    if (hour < 17) return `Good afternoon, ${user?.name}! 👋`;
    return `Good evening, ${user?.name}! 🌙`;
  };

  const [chatMessages, setChatMessages] = useState([
    {
      message: `${getGreeting()} I am NOVA, your personal AI assistant. I remember our conversations and learn your preferences. How can I help you today? 🌟`,
      sender: 'robot',
      id: 'id1'
    }
  ]);
  const [darkMode, setDarkMode] = useState(true);
  const [isTyping, setIsTyping] = useState(false);

  // Loading screen
  if (loading) {
    return (
      <div style={{
        height: '100vh', display: 'flex', alignItems: 'center',
        justifyContent: 'center', background: '#0d0f14', color: '#6c63ff',
        fontSize: '1.5rem', fontFamily: 'Sora, sans-serif'
      }}>
        🤖 Loading NOVA...
      </div>
    );
  }

  // Agar logged in nahi hai toh Auth page dikhao
  if (!user) {
    return <AuthPage />;
  }

  // Logged in hai toh chat dikhao
  return (
    <div className={`app-container ${darkMode ? 'dark' : 'light'}`}>
      {/* Header */}
      <div className="chat-header">
        <div className="header-left">
          <div className="bot-avatar">
            <span>🤖</span>
            <div className="online-dot"></div>
          </div>
          <div className="header-info">
            <h1 className="header-title">NOVA — AI Assistant</h1>
            <p className="header-status">
              {isTyping ? (
                <span className="typing-status">typing<span className="dot-anim">...</span></span>
              ) : (
                <span className="online-status">● Online</span>
              )}
            </p>
          </div>
        </div>

        <div className="header-right">
          {/* Theme toggle */}
          <button className="theme-toggle" onClick={() => setDarkMode(!darkMode)} title="Toggle theme">
            {darkMode ? '☀️' : '🌙'}
          </button>

          {/* User + Logout */}
          <div className="user-info">
            <span className="user-avatar">👤</span>
            <span className="user-name">{user.name}</span>
            <button className="logout-btn" onClick={logout} title="Logout">
              Logout
            </button>
          </div>
        </div>
      </div>

      <ChatMessages
        chatMessages={chatMessages}
        isTyping={isTyping}
        darkMode={darkMode}
      />
      <ChatInput
        chatMessages={chatMessages}
        setChatMessages={setChatMessages}
        setIsTyping={setIsTyping}
        darkMode={darkMode}
      />
    </div>
  );
}

export default App;
