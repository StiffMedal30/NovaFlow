import { Bot, Lightbulb, Sparkles } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useTheme } from "../context/ThemeContext";

export function LeftSideMenu() {
  const { currentTheme } = useTheme();
  const navigate = useNavigate();
  
  return (
    <div 
      className="w-64 h-screen rounded-r-[18px] shadow-lg border-r border-t-0 border-b-0 border-l-0 py-6 px-4 flex flex-col fixed left-0 top-0 z-10"
      style={{
        background: currentTheme.colors.background,
        borderColor: currentTheme.colors.border,
        boxShadow: '2px 0 16px 0 rgba(0,0,0,0.08)',
        color: currentTheme.colors.text,
      }}
    >
      {/* Logo */}
      <div className='group flex items-center gap-3 mb-8'>
          <Sparkles
              size={24}
              color={'#7f5af0'}
          />
          <h1
          className="text-2xl font-normal text-text font-['Didact_Gothic']"
          >
              NovaFlow
          </h1>
      </div>

      {/* Menu Items */}
      <div className="flex flex-col gap-2 flex-grow">
        <a
          href="#"
          className="px-3 py-2 rounded-md no-underline text-text hover:bg-primary hover:text-text transition-colors text-sm flex items-center gap-2"
          onClick={(e) => {
            e.preventDefault();
            navigate("/Chat");
          }}
        >
          <Bot size={20} /> Chat
        </a>
        <a
          href="#"
          className="px-3 py-2 rounded-md no-underline text-text hover:bg-primary hover:text-text transition-colors text-sm flex items-center gap-2"
          onClick={(e) => {
            e.preventDefault();
            navigate("/Idea");
          }}
        >
          <Lightbulb size={20} /> Ideas
        </a>
      </div>
    </div>
  );
}
