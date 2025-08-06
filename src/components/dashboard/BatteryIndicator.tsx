import { cn } from "@/lib/utils";
import { Battery, BatteryLow, BatteryMedium } from "lucide-react";

interface BatteryIndicatorProps {
  status: string;
  className?: string;
}

export function BatteryIndicator({ status, className }: BatteryIndicatorProps) {
  const batteryConfig = {
    Full: {
      icon: Battery,
      color: "text-status-online",
      bgColor: "bg-status-online/20",
      percentage: 100
    },
    Ok: {
      icon: BatteryMedium,
      color: "text-status-warning",
      bgColor: "bg-status-warning/20", 
      percentage: 60
    },
    Low: {
      icon: BatteryLow,
      color: "text-status-offline",
      bgColor: "bg-status-offline/20",
      percentage: 20
    }
  };

  const normalizedStatus = status as keyof typeof batteryConfig;
  const config = batteryConfig[normalizedStatus] || batteryConfig.Ok;
  const Icon = config.icon;

  return (
    <div className={cn("flex items-center space-x-3 p-3 rounded-lg", config.bgColor, className)}>
      <Icon className={cn("h-6 w-6", config.color)} />
      <div className="flex-1">
        <div className="flex items-center justify-between mb-1">
          <span className="text-sm font-medium">Battery</span>
          <span className={cn("text-sm font-bold", config.color)}>{normalizedStatus}</span>
        </div>
        <div className="w-full bg-muted rounded-full h-2">
          <div
            className={cn("h-2 rounded-full transition-all duration-300", config.color.replace('text-', 'bg-'))}
            style={{ width: `${config.percentage}%` }}
          />
        </div>
      </div>
    </div>
  );
}