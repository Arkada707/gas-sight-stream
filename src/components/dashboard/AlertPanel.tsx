import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertTriangle, Battery, Wifi, Fuel } from "lucide-react";
import { cn } from "@/lib/utils";

interface AlertData {
  id: string;
  type: "gas" | "battery" | "connection";
  severity: "high" | "medium" | "low";
  message: string;
  timestamp: Date;
}

interface AlertPanelProps {
  gasLevel: number;
  batteryStatus: string;
  connectionQuality: number;
  className?: string;
}

export function AlertPanel({ 
  gasLevel, 
  batteryStatus, 
  connectionQuality, 
  className 
}: AlertPanelProps) {
  const generateAlerts = (): AlertData[] => {
    const alerts: AlertData[] = [];

    // Gas level alerts
    if (gasLevel < 20) {
      alerts.push({
        id: "gas-low",
        type: "gas",
        severity: gasLevel < 10 ? "high" : "medium",
        message: `Gas level critically low at ${gasLevel.toFixed(1)}%`,
        timestamp: new Date()
      });
    }

    // Battery alerts
    if (batteryStatus === "Low") {
      alerts.push({
        id: "battery-low",
        type: "battery", 
        severity: "medium",
        message: "Battery level is low, consider replacing",
        timestamp: new Date()
      });
    }

    // Connection alerts
    if (connectionQuality < 50) {
      alerts.push({
        id: "connection-poor",
        type: "connection",
        severity: connectionQuality < 30 ? "high" : "medium", 
        message: `Poor connection quality at ${connectionQuality}%`,
        timestamp: new Date()
      });
    }

    return alerts;
  };

  const alerts = generateAlerts();

  if (alerts.length === 0) {
    return (
      <Alert className={cn("border-status-online bg-status-online/10", className)}>
        <AlertTriangle className="h-4 w-4 text-status-online" />
        <AlertTitle className="text-status-online">All Systems Normal</AlertTitle>
        <AlertDescription>
          No active alerts. All monitoring systems are operating within normal parameters.
        </AlertDescription>
      </Alert>
    );
  }

  const getAlertIcon = (type: string) => {
    switch (type) {
      case "gas": return Fuel;
      case "battery": return Battery;
      case "connection": return Wifi;
      default: return AlertTriangle;
    }
  };

  const getSeverityStyles = (severity: string) => {
    switch (severity) {
      case "high":
        return "border-status-offline bg-status-offline/10 text-status-offline";
      case "medium":
        return "border-status-warning bg-status-warning/10 text-status-warning";
      default:
        return "border-primary bg-primary/10 text-primary";
    }
  };

  return (
    <div className={cn("space-y-3", className)}>
      <h3 className="text-lg font-semibold">Active Alerts</h3>
      {alerts.map((alert) => {
        const Icon = getAlertIcon(alert.type);
        return (
          <Alert key={alert.id} className={getSeverityStyles(alert.severity)}>
            <Icon className="h-4 w-4" />
            <AlertTitle className="capitalize">
              {alert.severity} Priority Alert
            </AlertTitle>
            <AlertDescription>{alert.message}</AlertDescription>
          </Alert>
        );
      })}
    </div>
  );
}