import { Mic, Send } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import { useEffect, useMemo, useState, useCallback, useRef } from 'react';
import ChatContainer from '../../components/ui/chat-container';
import { type ChatMessage } from '../../components/ui/chat-message';
import SpeechRecognition, { useSpeechRecognition } from 'react-speech-recognition'
import toast from 'react-hot-toast';

export default function ChatPage() {
  const { currentTheme } = useTheme();

  const [isTyping, setIsTyping] = useState(false);
  const [inputText, setInputText] = useState(''); //The text that is currently being typed
  const [messages, setMessages] = useState<ChatMessage[]>([]); //Chat messages
  const [isLoading, setIsLoading] = useState(false); //AI response loading state
  const textareaRef = useRef<HTMLTextAreaElement>(null); // Ref for textarea
  const autoSendTimeoutRef = useRef<NodeJS.Timeout | null>(null); // Track auto-send timeout

  const {
    transcript,
    listening,
    resetTranscript,
    browserSupportsSpeechRecognition
  } = useSpeechRecognition();

  const handleListen = () => {
    if(!browserSupportsSpeechRecognition){
      toast.error("Your browser does not support speech recognition. Please use a supported browser in order to use this feature.");
      return;
    } else {
      console.log("Listening: ", listening);

      if(listening) {
        SpeechRecognition.stopListening();
      } else {
        // Clear any pending auto-send when starting new speech recognition
        if (autoSendTimeoutRef.current) {
          clearTimeout(autoSendTimeoutRef.current);
          autoSendTimeoutRef.current = null;
        }
        resetTranscript();
        setInputText('');
        SpeechRecognition.startListening({ continuous: true, language: 'en-US' });
      }
    }
  };

  const handleSend = useCallback(() => {
    if (inputText.trim() === '') return; //Do not send empty messages (including whitespace)
    if (listening) return; // Don't send while listening
    if (isLoading) return; // Don't send while AI is responding

    // Clear any pending auto-send timeout to prevent duplicates
    if (autoSendTimeoutRef.current) {
      clearTimeout(autoSendTimeoutRef.current);
      autoSendTimeoutRef.current = null;
    }

    const messageText = inputText; //Store the message before sending it
    setIsTyping(false);
    setInputText('');

    // Reset textarea height to original size
    if (textareaRef.current) {
      textareaRef.current.style.height = '48px';
    }

    // Add user message
    const userMessage: ChatMessage = {
      id: Date.now().toString() + '-user',
      content: messageText,
      sender: 'user',
      timestamp: new Date()
    };
    
    setMessages(prev => [...prev, userMessage]);

    // Simulate AI response
    setIsLoading(true);
    setTimeout(() => {
      const aiMessage: ChatMessage = {
        id: Date.now().toString() + '-ai',
        content: `I received your message: "${messageText}". This is a mock response from the AI.`,
        sender: 'assistant',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, aiMessage]);
      setIsLoading(false);
    }, 1000 + Math.random() * 2000); // Random delay between 1-3 seconds
  }, [inputText, listening, isLoading]);

  const handleType = (text: string) => {
    setIsTyping(true);
    setInputText(text);
  };``

  //Prevent highlighted send button when text is empty
  useMemo(() => {
    if (inputText === '') {
      setIsTyping(false);
    }
  }, [inputText]);

    //Listen for changes in the transcript and update inputText to display what is being heard
  useEffect (() => {
    if (transcript) {
      setInputText(transcript);
      // Trigger textarea resize when speech recognition updates the text
      if (textareaRef.current) {
        textareaRef.current.style.height = '48px';
        const newHeight = Math.min(textareaRef.current.scrollHeight, 120);
        textareaRef.current.style.height = newHeight + 'px';
      }
    }
  }, [transcript]);

  //Auto send message when voice input stops
  useEffect(() => {
    // Clear any existing timeout to prevent duplicates
    if (autoSendTimeoutRef.current) {
      clearTimeout(autoSendTimeoutRef.current);
      autoSendTimeoutRef.current = null;
    }

    if (!listening && transcript && inputText) {
      //Small delay to ensure voice recognition has actually stopped
      autoSendTimeoutRef.current = setTimeout(() => {
        handleSend();
        resetTranscript();
        autoSendTimeoutRef.current = null; //Clear the ref after sending
      }, 500);
    }
  }, [transcript, listening, inputText, handleSend]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (autoSendTimeoutRef.current) {
        clearTimeout(autoSendTimeoutRef.current);
      }
    };
  }, []);

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
        
        {/* Chat Messages */}
        <ChatContainer 
          messages={messages} 
          isLoading={isLoading}
          className="flex-1"
        />
        
        <div className="w-full mt-4 relative">
          <div 
            className="relative border-2 transition-all duration-200 overflow-hidden chat-input-container"
            style={{
              background: currentTheme.colors.background,
              borderColor: currentTheme.colors.border,
              borderRadius: inputText.includes('\n') || inputText.length > 50 ? '20px' : '24px', // Dynamic border radius
              '--accent-color': currentTheme.colors.accent,
            } as React.CSSProperties & { '--accent-color': string }}
          >
            <textarea 
              ref={textareaRef} //In order to resize the text area to its original size on send
              className="w-full pl-4 pr-20 resize-none outline-none scrollbar-hide"
              style={{
                background: 'transparent',
                color: currentTheme.colors.text,
                minHeight: '48px',
                maxHeight: '120px',
                lineHeight: '1.4',
                fontFamily: 'inherit',
                fontSize: 'inherit',
                border: 'none',
                overflowY: 'auto',
                paddingTop: '16px',
                paddingBottom: '12px',
                height: '48px', // Force initial height
              }}
              value={inputText}
              onChange={e => handleType(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Enter' && !e.shiftKey && !listening) {
                  e.preventDefault();
                  handleSend();
                }
              }}
              onInput={(e) => {
                const target = e.target as HTMLTextAreaElement;
                target.style.height = '48px';
                const newHeight = Math.min(target.scrollHeight, 120);
                target.style.height = newHeight + 'px';
              }}
              disabled={isLoading || listening}
              placeholder={listening ? "Listening..." : "Type your message..."}
              rows={1}
            />
          </div>
          
          <div className="absolute right-4 bottom-3.5 flex items-center gap-2">
            <button
              className="p-1 rounded-full hover:opacity-70 transition-opacity duration-200"
              style={{ color: currentTheme.colors.text }}
              aria-label="Voice input"
              onClick={handleListen}
            >
              <Mic
                className={listening ? 'animate-pulse' : ''}
                style={{
                  color: listening ? currentTheme.colors.primary : currentTheme.colors.text,
                  animation: listening ? 'noticeablePulse 1.5s ease-in-out infinite' : 'none',
                  transformOrigin: 'center',
                }}
                size={20}
              />
            </button>
            <button
              className="p-1 rounded-full hover:opacity-70 transition-opacity duration-200"
              aria-label="Send message"
              onClick={handleSend}
            >
              <Send
                style={{
                  color: isTyping ? currentTheme.colors.primary : currentTheme.colors.text,
                  opacity: listening ? 0.5 : 1, // Dim when listening
                }}
                size={20}
              />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
