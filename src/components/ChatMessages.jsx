import { useRef, useEffect } from 'react';
import { ChatMessage } from './ChatMessage'
import './ChatMessages.css'

export function ChatMessages({ chatMessages, isTyping, darkMode }) {
  const chatMessagesRef = useRef(null);

  useEffect(() => {
    const containerElem = chatMessagesRef.current;
    if (containerElem) {
      containerElem.scrollTop = containerElem.scrollHeight;
    }
  }, [chatMessages, isTyping]);

  return (
    <div className="chat-messages-container" ref={chatMessagesRef}>
      {chatMessages.map((chatMessage, index) => (
        <ChatMessage
          message={chatMessage.message}
          sender={chatMessage.sender}
          key={chatMessage.id}
          index={index}
          darkMode={darkMode}
        />
      ))}

      {/* Typing Indicator */}
      {isTyping && (
        <div className="typing-indicator-wrapper">
          <div className="typing-bubble">
            <span></span>
            <span></span>
            <span></span>
          </div>
          <p className="typing-label">AI is thinking...</p>
        </div>
      )}
    </div>
  );
}
