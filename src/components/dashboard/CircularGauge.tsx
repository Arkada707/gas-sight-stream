import { cn } from "@/lib/utils";

interface CircularGaugeProps {
  value: number;
  max?: number;
  size?: number;
  strokeWidth?: number;
  label: string;
  unit?: string;
  className?: string;
  color?: "primary" | "success" | "warning" | "danger";
}

export function CircularGauge({
  value,
  max = 100,
  size = 120,
  strokeWidth = 8,
  label,
  unit = "%",
  className,
  color = "primary"
}: CircularGaugeProps) {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const percentage = Math.min(Math.max(value, 0), max) / max;
  const strokeDasharray = circumference;
  const strokeDashoffset = circumference - (circumference * percentage);

  const colorClasses = {
    primary: "text-primary",
    success: "text-status-online",
    warning: "text-status-warning", 
    danger: "text-status-offline"
  };

  const strokeClasses = {
    primary: "stroke-primary",
    success: "stroke-status-online",
    warning: "stroke-status-warning",
    danger: "stroke-status-offline"
  };

  return (
    <div className={cn("flex flex-col items-center space-y-2", className)}>
      <div className="relative" style={{ width: size, height: size }}>
        <svg
          width={size}
          height={size}
          className="transform -rotate-90"
        >
          {/* Background circle */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke="currentColor"
            strokeWidth={strokeWidth}
            fill="none"
            className="text-muted opacity-20"
          />
          
          {/* Progress circle */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke="currentColor"
            strokeWidth={strokeWidth}
            fill="none"
            strokeDasharray={strokeDasharray}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            className={cn("transition-all duration-1000 ease-out", strokeClasses[color])}
          />
        </svg>
        
        {/* Center content */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className={cn("text-2xl font-bold", colorClasses[color])}>
            {Math.round(value)}
          </span>
          <span className="text-xs text-muted-foreground">{unit}</span>
        </div>
      </div>
      
      <span className="text-sm font-medium text-center">{label}</span>
    </div>
  );
}