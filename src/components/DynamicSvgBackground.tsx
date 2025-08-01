import React from "react";
import { useTheme } from "../context/ThemeContext";

interface DynamicSvgBackgroundProps {
  opacity?: number;
}

const DynamicSvgBackground: React.FC<DynamicSvgBackgroundProps> = ({ 
  opacity = 0.1 
}) => {
  const { currentTheme } = useTheme();
  
  const generateGradientPattern = () => (
    <svg width="100%" height="100%" viewBox="0 0 1200 800" preserveAspectRatio="xMidYMid slice">
      <defs>
        {/* Flowing wave gradient 1 */}
        <linearGradient id="waveFlow1" x1="0%" y1="30%" x2="70%" y2="80%">
          <stop offset="0%" stopColor={currentTheme.colors.accent} stopOpacity={opacity * 0.4} />
          <stop offset="40%" stopColor={currentTheme.colors.background} stopOpacity={opacity * 0.6} />
          <stop offset="70%" stopColor={currentTheme.colors.text} stopOpacity={opacity * 0.2} />
          <stop offset="100%" stopColor="transparent" stopOpacity="0" />
        </linearGradient>
        
        {/* Curved wave gradient 2 */}
        <linearGradient id="waveFlow2" x1="100%" y1="10%" x2="20%" y2="60%">
          <stop offset="0%" stopColor={currentTheme.colors.secondary} stopOpacity={opacity * 0.3} />
          <stop offset="50%" stopColor={currentTheme.colors.background} stopOpacity={opacity * 0.5} />
          <stop offset="100%" stopColor="transparent" stopOpacity="0" />
        </linearGradient>
        
        {/* Diagonal wave flow */}
        <linearGradient id="waveFlow3" x1="30%" y1="100%" x2="80%" y2="20%">
          <stop offset="0%" stopColor={currentTheme.colors.text} stopOpacity={opacity * 0.15} />
          <stop offset="35%" stopColor={currentTheme.colors.background} stopOpacity={opacity * 0.7} />
          <stop offset="65%" stopColor={currentTheme.colors.accent} stopOpacity={opacity * 0.25} />
          <stop offset="100%" stopColor="transparent" stopOpacity="0" />
        </linearGradient>
        
        {/* Subtle horizontal wave */}
        <linearGradient id="waveFlow4" x1="0%" y1="60%" x2="100%" y2="40%">
          <stop offset="0%" stopColor={currentTheme.colors.background} stopOpacity={opacity * 0.8} />
          <stop offset="30%" stopColor={currentTheme.colors.accent} stopOpacity={opacity * 0.2} />
          <stop offset="70%" stopColor={currentTheme.colors.secondary} stopOpacity={opacity * 0.3} />
          <stop offset="100%" stopColor={currentTheme.colors.background} stopOpacity={opacity * 0.4} />
        </linearGradient>
      </defs>
      
      {/* Organic wave shapes using paths */}
      <path d="M0,200 Q300,150 600,250 T1200,200 L1200,400 Q900,350 600,400 T0,350 Z" 
            fill="url(#waveFlow1)" />
      
      <path d="M1200,100 Q900,80 600,120 T0,100 L0,300 Q300,280 600,300 T1200,280 Z" 
            fill="url(#waveFlow2)" />
      
      <path d="M0,500 Q400,450 800,500 T1200,480 L1200,700 Q800,650 400,700 T0,680 Z" 
            fill="url(#waveFlow3)" />
      
      <path d="M0,0 Q600,50 1200,0 L1200,150 Q600,100 0,150 Z" 
            fill="url(#waveFlow4)" />
    </svg>
  );

  return (
    <div
      style={{
        position: "absolute",
        top: 0,
        left: 0,
        width: "100%",
        height: "100%",
        zIndex: 0,
        pointerEvents: "none"
      }}
    >
      {generateGradientPattern()}
    </div>
  );
};

export default DynamicSvgBackground;
