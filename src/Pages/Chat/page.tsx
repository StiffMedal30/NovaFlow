import { Mic, Send } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import { useEffect, useMemo, useState, useCallback } from 'react';
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
        resetTranscript();
        setInputText('');
        SpeechRecognition.startListening({ continuous: true, language: 'en-US' });
      }
    }
  };

  const handleSend = useCallback(() => {
    if (inputText === '') return; //Do not send empty messages
    if (listening) return; // Don't send while listening
    if (isLoading) return; // Don't send while AI is responding

    const messageText = inputText; //Store the message before sending it
    setIsTyping(false);
    setInputText('');

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
  };


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
    }
  }, [transcript]);

  //Auto send message when voice input stops
  useEffect(() => {
    if (!listening && transcript && inputText) {
      //Small delay to ensure voice recognition has actually stopped
      setTimeout(() => {
        handleSend();
        resetTranscript();
      }, 500);
    }
  }, [transcript, listening, inputText, handleSend]);

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
          <input 
            type="text"
            className="w-full pl-4 pr-20 py-3 rounded-full border-2 focus:outline-none focus:ring-0 focus:border-2 transition-all duration-200 peer"
            style={{
              background: currentTheme.colors.background,
              borderColor: currentTheme.colors.border,
              color: currentTheme.colors.text,
            }}
            value={inputText}
            onChange={e => handleType(e.target.value)}
            onKeyDown={e => {
              if (e.key === 'Enter' && !e.shiftKey && !listening) {
                e.preventDefault();
                handleSend();
              }
            }}
            disabled={isLoading || listening} // Disable when listening OR loading
            placeholder={listening ? "Listening..." : "Type your message..."} 
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
                className={listening ? 'animate-pulse' : ''}
                style={{
                  color: listening ? currentTheme.colors.primary : currentTheme.colors.text,
                  animation: listening ? 'noticeablePulse 1.5s ease-in-out infinite' : 'none',
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
                  opacity: listening ? 0.5 : 1, // Dim when listening
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
