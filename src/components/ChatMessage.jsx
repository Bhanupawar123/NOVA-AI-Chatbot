import './ChatMessage.css'

// Simple markdown parser
function parseMarkdown(text) {
  // Code blocks ```code```
  text = text.replace(/```(\w+)?\n?([\s\S]*?)```/g, (_, lang, code) => {
    return `<pre class="code-block"><code>${escapeHtml(code.trim())}</code></pre>`;
  });

  // Inline code `code`
  text = text.replace(/`([^`]+)`/g, '<code class="inline-code">$1</code>');

  // Bold **text**
  text = text.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');

  // Italic *text*
  text = text.replace(/\*(.+?)\*/g, '<em>$1</em>');

  // Bullet points * item or - item
  text = text.replace(/^[\*\-] (.+)/gm, '<li>$1</li>');
  text = text.replace(/(<li>.*<\/li>)/s, '<ul>$1</ul>');

  // Numbered list 1. item
  text = text.replace(/^\d+\. (.+)/gm, '<li>$1</li>');

  // ### Heading
  text = text.replace(/^### (.+)/gm, '<h3 class="md-h3">$1</h3>');
  text = text.replace(/^## (.+)/gm, '<h2 class="md-h2">$1</h2>');
  text = text.replace(/^# (.+)/gm, '<h1 class="md-h1">$1</h1>');

  // Line breaks
  text = text.replace(/\n\n/g, '<br/><br/>');
  text = text.replace(/\n/g, '<br/>');

  return text;
}

function escapeHtml(text) {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

export function ChatMessage({ message, sender, index }) {
  const time = new Date().toLocaleTimeString('en-IN', {
    hour: '2-digit',
    minute: '2-digit'
  });

  const isBot = sender === 'robot';

  return (
    <div
      className={`chat-message ${isBot ? 'chat-message-robot' : 'chat-message-user'}`}
      style={{ animationDelay: `${Math.min(index * 0.05, 0.3)}s` }}
    >
      {isBot && (
        <div className="avatar bot-msg-avatar">🤖</div>
      )}

      <div className="message-content">
        <div className={`chat-message-text ${isBot ? 'bot-bubble' : 'user-bubble'}`}>
          {isBot ? (
            <div
              className="markdown-body"
              dangerouslySetInnerHTML={{ __html: parseMarkdown(message) }}
            />
          ) : (
            message
          )}
        </div>
        <span className={`message-time ${isBot ? 'time-left' : 'time-right'}`}>
          {time}
        </span>
      </div>

      {!isBot && (
        <div className="avatar user-msg-avatar">👤</div>
      )}
    </div>
  );
}
