import { useTheme } from '../../context/ThemeContext';
import { Avatar, AvatarFallback } from './avatar'; // Use shadcn Avatar component
import { cn } from '../../lib/utils';

export interface ChatMessage {
  id: string;
  content: string;
  sender: 'user' | 'assistant';
  timestamp: Date;
  isTyping?: boolean;
}

interface ChatMessageProps {
  message: ChatMessage;
  className?: string;
}

export function ChatMessageComponent({ message, className }: ChatMessageProps) {
  const { currentTheme } = useTheme();
  const isUser = message.sender === 'user';

  return (
    <div
      className={cn(
        'flex w-full mb-4 animate-in slide-in-from-bottom-2 duration-300',
        isUser ? 'justify-end' : 'justify-start',
        className
      )}
    >
      <div
        className={cn(
          'flex max-w-[80%] gap-3',
          isUser ? 'flex-row-reverse' : 'flex-row'
        )}
      >
        {/* Avatar */}
        <Avatar className="w-8 h-8 mt-1 flex-shrink-0">
          <AvatarFallback
            style={{
              backgroundColor: isUser 
                ? currentTheme.colors.primary 
                : currentTheme.colors.accent,
              color: currentTheme.colors.background
            }}
          >
            {isUser ? 'U' : 'AI'}
          </AvatarFallback>
        </Avatar>

        {/* Message Content */}
        <div
          className={cn(
            'rounded-2xl px-4 py-3 shadow-sm',
            isUser 
              ? 'rounded-br-sm' 
              : 'rounded-bl-sm'
          )}
          style={{
            backgroundColor: isUser 
              ? currentTheme.colors.primary 
              : currentTheme.colors.secondary_background,
            color: isUser 
              ? currentTheme.colors.background 
              : currentTheme.colors.text,
            border: `1px solid ${currentTheme.colors.border}`
          }}
        >
          <div 
            className="text-sm leading-relaxed whitespace-pre-wrap break-words"
            style={{ wordBreak: 'break-word', overflowWrap: 'break-word' }}
          >
            {message.isTyping ? (
              <div className="flex items-center gap-1">
                <div className="flex gap-1">
                  <div 
                    className="w-2 h-2 rounded-full animate-bounce"
                    style={{ 
                      backgroundColor: currentTheme.colors.text,
                      animationDelay: '0ms' 
                    }}
                  />
                  <div 
                    className="w-2 h-2 rounded-full animate-bounce"
                    style={{ 
                      backgroundColor: currentTheme.colors.text,
                      animationDelay: '150ms' 
                    }}
                  />
                  <div 
                    className="w-2 h-2 rounded-full animate-bounce"
                    style={{ 
                      backgroundColor: currentTheme.colors.text,
                      animationDelay: '300ms' 
                    }}
                  />
                </div>
              </div>
            ) : (
              message.content
            )}
          </div>
          
          {/* Timestamp */}
          <div 
            className="text-xs mt-1 opacity-70"
            style={{ 
              color: isUser 
                ? currentTheme.colors.background 
                : currentTheme.colors.text 
            }}
          >
            {message.timestamp.toLocaleTimeString([], { 
              hour: '2-digit', 
              minute: '2-digit' 
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

export default ChatMessageComponent;