import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { LucideIcon } from "lucide-react";

interface StatusCardProps {
  title: string;
  value: string | number;
  status?: "online" | "warning" | "offline";
  icon?: LucideIcon;
  subtitle?: string;
  className?: string;
}

export function StatusCard({
  title,
  value,
  status = "online",
  icon: Icon,
  subtitle,
  className
}: StatusCardProps) {
  const statusConfig = {
    online: {
      badge: "bg-status-online text-success-foreground",
      icon: "text-status-online",
      label: "Online"
    },
    warning: {
      badge: "bg-status-warning text-warning-foreground",
      icon: "text-status-warning", 
      label: "Warning"
    },
    offline: {
      badge: "bg-status-offline text-danger-foreground",
      icon: "text-status-offline",
      label: "Offline"
    }
  };

  const config = statusConfig[status];

  return (
    <Card className={cn("border-border/50 bg-card/50 backdrop-blur", className)}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {title}
        </CardTitle>
        {Icon && (
          <Icon className={cn("h-4 w-4", config.icon)} />
        )}
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-between">
          <div>
            <div className="text-2xl font-bold">{value}</div>
            {subtitle && (
              <p className="text-xs text-muted-foreground">{subtitle}</p>
            )}
          </div>
          <Badge 
            variant="secondary" 
            className={cn("ml-2", config.badge)}
          >
            {config.label}
          </Badge>
        </div>
      </CardContent>
    </Card>
  );
}