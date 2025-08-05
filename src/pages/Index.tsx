import { useSensorData } from "@/hooks/useSensorData";
import { DeviceHeader } from "@/components/dashboard/DeviceHeader";
import { CircularGauge } from "@/components/dashboard/CircularGauge";
import { StatusCard } from "@/components/dashboard/StatusCard";
import { BatteryIndicator } from "@/components/dashboard/BatteryIndicator";
import { ConnectionQuality } from "@/components/dashboard/ConnectionQuality";
import { LinearGauge } from "@/components/dashboard/LinearGauge";
import { AlertPanel } from "@/components/dashboard/AlertPanel";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Fuel, Gauge, Thermometer, Clock } from "lucide-react";

const Index = () => {
  const { parsedData, isConnected, lastUpdate } = useSensorData();

  const getGasLevelColor = (level: number) => {
    if (level > 50) return "success";
    if (level > 20) return "warning";
    return "danger";
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto p-6 space-y-6">
        {/* Header */}
        <DeviceHeader
          deviceName={parsedData.deviceName}
          isConnected={isConnected}
          lastUpdate={lastUpdate}
        />

        {/* Main Metrics Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Gas Level Gauge */}
          <Card className="lg:col-span-2 border-border/50 bg-card/50 backdrop-blur">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Fuel className="h-5 w-5 text-primary" />
                <span>Gas Level</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="flex justify-center">
              <CircularGauge
                value={parsedData.gasLevel}
                label="Current Level"
                color={getGasLevelColor(parsedData.gasLevel)}
                size={160}
                strokeWidth={12}
              />
            </CardContent>
          </Card>

          {/* Quick Stats */}
          <div className="lg:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-4">
            <StatusCard
              title="Tank Level"
              value={`${parsedData.tankLevel} cm`}
              icon={Gauge}
              status={parsedData.tankLevel > 30 ? "online" : "warning"}
            />
            <StatusCard
              title="Connection"
              value={`${parsedData.connectionQuality}%`}
              icon={Clock}
              status={
                parsedData.connectionQuality > 70 ? "online" :
                parsedData.connectionQuality > 40 ? "warning" : "offline"
              }
            />
          </div>
        </div>

        {/* Secondary Metrics */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Tank Level Linear Gauge */}
          <Card className="border-border/50 bg-card/50 backdrop-blur">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Thermometer className="h-5 w-5 text-primary" />
                <span>Tank Depth</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <LinearGauge
                value={parsedData.tankLevel}
                max={60}
                label="Liquid Level"
                unit="cm"
                height={12}
              />
            </CardContent>
          </Card>

          {/* Battery Status */}
          <Card className="border-border/50 bg-card/50 backdrop-blur">
            <CardHeader>
              <CardTitle>Power Status</CardTitle>
            </CardHeader>
            <CardContent>
              <BatteryIndicator status={parsedData.batteryStatus} />
            </CardContent>
          </Card>

          {/* Connection Quality */}
          <Card className="border-border/50 bg-card/50 backdrop-blur">
            <CardHeader>
              <CardTitle>Network Status</CardTitle>
            </CardHeader>
            <CardContent>
              <ConnectionQuality percentage={parsedData.connectionQuality} />
            </CardContent>
          </Card>
        </div>

        {/* Alerts Panel */}
        <AlertPanel
          gasLevel={parsedData.gasLevel}
          batteryStatus={parsedData.batteryStatus}
          connectionQuality={parsedData.connectionQuality}
        />
      </div>
    </div>
  );
};

export default Index;
