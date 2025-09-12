import { useRef, useEffect } from 'react';
import { useTheme } from '../../context/ThemeContext';
import ChatMessageComponent, { type ChatMessage } from './chat-message';
import { cn } from '../../lib/utils';

interface ChatContainerProps {
  messages: ChatMessage[];
  className?: string;
  isLoading?: boolean;
}

export function ChatContainer({ messages, className, isLoading }: ChatContainerProps) {
  const { currentTheme } = useTheme();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  return (
    <div
      className={cn(
        'flex-1 overflow-y-auto px-4 py-2 space-y-2',
        className
      )}
      style={{
        scrollbarWidth: 'thin',
        scrollbarColor: `${currentTheme.colors.border} transparent`
      }}
    >
      {messages.length === 0 ? (
        <div 
          className="flex-1 flex items-center justify-center opacity-50 text-base"
          style={{ color: currentTheme.colors.text }}
        >
          <span>Start a conversation...</span>
        </div>
      ) : (
        <>
          {messages.map((message) => (
            <ChatMessageComponent
              key={message.id}
              message={message}
            />
          ))}
          
          {/* Loading indicator */}
          {isLoading && (
            <ChatMessageComponent
              message={{
                id: 'loading',
                content: '',
                sender: 'assistant',
                timestamp: new Date(),
                isTyping: true
              }}
            />
          )}
          
          {/* Scroll anchor */}
          <div ref={messagesEndRef} />
        </>
      )}
    </div>
  );
}

export default ChatContainer;
