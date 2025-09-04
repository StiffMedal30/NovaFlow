import { Mic, Send } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import { useMemo, useState } from 'react';
import ChatContainer from '../../components/ui/chat-container';
import { type ChatMessage } from '../../components/ui/chat-message';

export default function ChatPage() {
  const { currentTheme } = useTheme();

  const [isListening, setIsListening] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [inputText, setInputText] = useState(''); //The text that is currently being typed
  const [messages, setMessages] = useState<ChatMessage[]>([]); //Chat messages
  const [isLoading, setIsLoading] = useState(false); //AI response loading state

  const handleListen = () => {
    setIsListening(!isListening);

    //Prevent multiple inputs
    setIsTyping(false);

    console.log(!isListening);
  };

  const handleType = (text: string) => {
    setIsTyping(true);
    setInputText(text);
  };

  //Prevent highlighted send button when text is empty
  useMemo(() => {
    if (inputText === '') {
      setIsTyping(false);
    }
  }, [inputText]);

  const handleSend = () => {
    if (inputText === '') return; //Do not send empty messages
    if (isListening) return; //Do not send if listening to voice input

    setIsTyping(false);
    
    // Add user message
    const userMessage: ChatMessage = {
      id: Date.now().toString() + '-user',
      content: inputText,
      sender: 'user',
      timestamp: new Date()
    };
    
    setMessages(prev => [...prev, userMessage]);
    setInputText('');
    
    // Simulate AI response
    setIsLoading(true);
    setTimeout(() => {
      const aiMessage: ChatMessage = {
        id: Date.now().toString() + '-ai',
        content: `I received your message: "${inputText}". This is a mock response from the AI.`,
        sender: 'assistant',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, aiMessage]);
      setIsLoading(false);
    }, 1000 + Math.random() * 2000); // Random delay between 1-3 seconds
  };

  return (
    <div className="flex-1 flex justify-center items-center">
      {/* Chat Section */}
      <div
        className="w-full h-full max-w-[50vw] max-h-[83vh] min-h-[83vh] rounded-[18px] shadow-lg border py-8 px-6 flex flex-col justify-between mt-28"
        style={{
          background: currentTheme.colors.secondary_background,
          borderColor: currentTheme.colors.border,
          boxShadow: '0 2px 16px 0 rgba(0,0,0,0.08)',
        }}
      >
        <h2 className="text-2xl font-semibold mb-3" style={{ color: currentTheme.colors.text }}>
          Chat
        </h2>
        
        {/* Chat Messages */}
        <ChatContainer 
          messages={messages} 
          isLoading={isLoading}
          className="flex-1"
        />
        
        <div className="w-full mt-4 relative">
          <input //TODO : Add voice input support, grow input depending on content
            type="text"
            placeholder="Type your message..."
            className="w-full pl-4 pr-20 py-3 rounded-full border-2 focus:outline-none focus:ring-0 focus:border-2 transition-all duration-200 peer"
            style={{
              background: currentTheme.colors.background,
              borderColor: currentTheme.colors.border,
              color: currentTheme.colors.text,
            }}
            value={inputText}
            onChange={e => handleType(e.target.value)}
            onKeyDown={e => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
          />
          <div
            className="absolute inset-0 rounded-full opacity-0 peer-focus:opacity-100 transition-opacity duration-200 pointer-events-none"
            style={{
              boxShadow: `inset 0 0 0 2px ${currentTheme.colors.accent}`,
            }}
          />
          <div className="absolute right-3 top-1/2 transform -translate-y-1/2 flex items-center gap-2">
            <button
              className="p-1 rounded-full hover:opacity-70 transition-opacity duration-200"
              style={{ color: currentTheme.colors.text }}
              aria-label="Voice input"
            >
              <Mic
                className={isListening ? 'animate-pulse' : ''}
                style={{
                  color: isListening ? currentTheme.colors.primary : currentTheme.colors.text,
                  animation: isListening ? 'noticeablePulse 1.5s ease-in-out infinite' : 'none',
                  transformOrigin: 'center',
                }}
                size={20}
                onClick={handleListen}
              />
            </button>
            <button
              className="p-1 rounded-full hover:opacity-70 transition-opacity duration-200"
              aria-label="Send message"
            >
              <Send
                style={{
                  color: isTyping ? currentTheme.colors.primary : currentTheme.colors.text,
                }}
                size={20}
                onClick={handleSend}
              />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
