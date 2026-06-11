import { useTheme } from '../../context/ThemeContext';
import { Home, Sparkles } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export function IdeaSideMenu() {
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
        <div className='group flex items-center gap-2 mb-8'>
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
        {/* Home Button */}
        <button
            onClick={()=>{navigate('/home')}}
            className="px-3 py-2 rounded-md no-underline text-text hover:bg-primary hover:text-text transition-colors text-sm flex items-center gap-2"
        >
            <Home size={20} /> Home
        </button>

      {/*Put other buttons and kak here JP "Heart Emoji"*/}

    </div>
  );
}
