import { useTheme } from "../../context/ThemeContext";
import { PieChart, TrendingUp, MoreHorizontal } from "lucide-react";

interface PieSlice {
  label: string;
  value: number;
  color: string;
  percentage: number;
}

function MockPieChart() {
  const { currentTheme } = useTheme();

  // Mock data for the pie chart
  const data: PieSlice[] = [
    { label: "Chat Sessions", value: 45, color: "#7f5af0", percentage: 45 },
    { label: "API Calls", value: 30, color: "#2cb67d", percentage: 30 },
    { label: "User Interactions", value: 15, color: "#ffd23f", percentage: 15 },
    { label: "Error Logs", value: 10, color: "#ff6b6b", percentage: 10 },
  ];

  const total = data.reduce((sum, item) => sum + item.value, 0);
  
  const calculateStrokeArray = (percentage: number) => {
    const circumference = 2 * Math.PI * 40; // radius = 40
    const strokeLength = (percentage / 100) * circumference;
    return `${strokeLength} ${circumference - strokeLength}`;
  };

  let accumulatedPercentage = 0;

  return (
    <div
      className="w-full h-fit"
      style={{
        background: currentTheme.colors.background,
        borderRadius: 18,
        boxShadow: "0 4px 24px 0 rgba(0,0,0,0.08)",
        border: `1.5px solid ${currentTheme.colors.border}`,
      }}
    >
      {/* Header */}
      <div className="flex items-center justify-between p-6 border-b" style={{ borderColor: currentTheme.colors.border }}>
        <div className="flex items-center gap-3">
          <PieChart size={24} className="text-primary" />
          <h2 className="text-xl font-semibold text-text">MOCK! Usage Analytics</h2>
        </div>
        <button className="p-2 hover:bg-primary/10 rounded-lg transition-colors">
          <MoreHorizontal size={20} className="text-text opacity-60" />
        </button>
      </div>

      {/* Content */}
      <div className="p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-2xl font-bold text-text">{total}</h3>
            <p className="text-sm text-text opacity-60">Total Events</p>
          </div>
          <div className="flex items-center gap-1 px-3 py-1 rounded-full" style={{ background: `${currentTheme.colors.primary}15` }}>
            <TrendingUp size={14} className="text-primary" />
            <span className="text-sm font-medium text-primary">+12%</span>
          </div>
        </div>

        {/* Pie Chart Container */}
        <div className="flex items-center justify-center mb-6">
          <div className="relative w-32 h-32">
            <svg className="w-32 h-32 transform -rotate-90" viewBox="0 0 100 100">
              {data.map((slice, index) => {
                const strokeDasharray = calculateStrokeArray(slice.percentage);
                const strokeDashoffset = calculateStrokeArray(accumulatedPercentage);
                accumulatedPercentage += slice.percentage;
                
                return (
                  <circle
                    key={index}
                    cx="50"
                    cy="50"
                    r="40"
                    fill="transparent"
                    stroke={slice.color}
                    strokeWidth="8"
                    strokeDasharray={strokeDasharray}
                    strokeDashoffset={-strokeDashoffset}
                    className="transition-all duration-300 hover:stroke-[10]"
                  />
                );
              })}
            </svg>
            {/* Center content */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center">
                <div className="text-lg font-bold text-text">100%</div>
                <div className="text-xs text-text opacity-60">Coverage</div>
              </div>
            </div>
          </div>
        </div>

        {/* Legend */}
        <div className="space-y-3">
          {data.map((item, index) => (
            <div key={index} className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: item.color }}
                />
                <span className="text-sm text-text">{item.label}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-text">{item.value}</span>
                <span className="text-xs text-text opacity-60">({item.percentage}%)</span>
              </div>
            </div>
          ))}
        </div>

        {/* Footer Action */}
        <div className="mt-6 pt-4 border-t" style={{ borderColor: currentTheme.colors.border }}>
          <button className="w-full py-2 text-sm text-primary hover:text-text hover:bg-primary transition-colors rounded-lg font-medium">
            View Detailed Report
          </button>
        </div>
      </div>
    </div>
  );
}

export { MockPieChart };
