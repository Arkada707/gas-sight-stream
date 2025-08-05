import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Activity, Clock } from "lucide-react";
import { cn } from "@/lib/utils";

interface DeviceHeaderProps {
  deviceName: string;
  isConnected: boolean;
  lastUpdate: Date;
  className?: string;
}

export function DeviceHeader({ 
  deviceName, 
  isConnected, 
  lastUpdate, 
  className 
}: DeviceHeaderProps) {
  const formatTimeAgo = (date: Date) => {
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
    
    if (diffInSeconds < 60) return "just now";
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} minutes ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} hours ago`;
    return `${Math.floor(diffInSeconds / 86400)} days ago`;
  };

  return (
    <div className={cn("space-y-4", className)}>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{deviceName}</h1>
          <p className="text-muted-foreground">Real-time Gas Cylinder Monitoring</p>
        </div>
        <div className="flex items-center space-x-3">
          <Badge 
            variant={isConnected ? "default" : "destructive"}
            className={cn(
              "flex items-center space-x-1 px-3 py-1",
              isConnected 
                ? "bg-status-online text-success-foreground" 
                : "bg-status-offline text-danger-foreground"
            )}
          >
            <Activity className="h-3 w-3" />
            <span>{isConnected ? "Live" : "Offline"}</span>
          </Badge>
        </div>
      </div>
      
      <div className="flex items-center text-sm text-muted-foreground">
        <Clock className="h-4 w-4 mr-2" />
        <span>Last updated: {formatTimeAgo(lastUpdate)}</span>
      </div>
      
      <Separator />
    </div>
  );
}