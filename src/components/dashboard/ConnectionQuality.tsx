import { cn } from "@/lib/utils";
import { Wifi, WifiOff } from "lucide-react";

interface ConnectionQualityProps {
  percentage: number;
  className?: string;
}

export function ConnectionQuality({ percentage, className }: ConnectionQualityProps) {
  const getSignalStrength = (percent: number) => {
    if (percent >= 80) return { strength: "excellent", bars: 4, color: "text-status-online" };
    if (percent >= 60) return { strength: "good", bars: 3, color: "text-status-online" };
    if (percent >= 40) return { strength: "fair", bars: 2, color: "text-status-warning" };
    if (percent >= 20) return { strength: "poor", bars: 1, color: "text-status-offline" };
    return { strength: "none", bars: 0, color: "text-status-offline" };
  };

  const signal = getSignalStrength(percentage);
  const Icon = percentage > 0 ? Wifi : WifiOff;

  return (
    <div className={cn("flex items-center space-x-3", className)}>
      <Icon className={cn("h-5 w-5", signal.color)} />
      <div className="flex-1">
        <div className="flex items-center justify-between mb-1">
          <span className="text-sm font-medium">Connection</span>
          <span className={cn("text-sm font-bold", signal.color)}>{percentage}%</span>
        </div>
        <div className="flex space-x-1">
          {[...Array(4)].map((_, i) => (
            <div
              key={i}
              className={cn(
                "w-2 rounded-full transition-all duration-300",
                i < signal.bars 
                  ? `${signal.color.replace('text-', 'bg-')} h-3` 
                  : "bg-muted h-2"
              )}
            />
          ))}
        </div>
        <span className="text-xs text-muted-foreground capitalize">{signal.strength}</span>
      </div>
    </div>
  );
}