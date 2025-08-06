import { Link, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Home, TrendingUp, Settings, Wifi, WifiOff } from "lucide-react";
import { useDeviceData } from "@/hooks/useDeviceData";

const Navigation = () => {
  const location = useLocation();
  const { devices, selectedDeviceId, selectDevice, getConnectedDevices } = useDeviceData();
  const connectedDevices = getConnectedDevices();
  
  const selectedDevice = selectedDeviceId ? devices.find(d => d.id === selectedDeviceId) : null;
  
  return (
    <nav className="flex items-center justify-between mb-6">
      <div className="flex items-center space-x-2">
        <Button
          variant={location.pathname === "/" ? "default" : "outline"}
          size="sm"
          asChild
        >
          <Link to="/" className="flex items-center gap-2">
            <Home className="h-4 w-4" />
            Dashboard
          </Link>
        </Button>
        
        <Button
          variant={location.pathname === "/charts" ? "default" : "outline"}
          size="sm"
          asChild
        >
          <Link to="/charts" className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            Charts
          </Link>
        </Button>

        <Button
          variant={location.pathname === "/devices" ? "default" : "outline"}
          size="sm"
          asChild
        >
          <Link to="/devices" className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            Devices
          </Link>
        </Button>
      </div>

      {/* Device Selector and Status */}
      <div className="flex items-center space-x-4">
        {devices.length > 0 && (
          <>
            {/* Connection Status */}
            <div className="flex items-center space-x-2">
              <Badge variant={connectedDevices.length > 0 ? "default" : "secondary"}>
                {connectedDevices.length > 0 ? (
                  <>
                    <Wifi className="h-3 w-3 mr-1" />
                    {connectedDevices.length} Connected
                  </>
                ) : (
                  <>
                    <WifiOff className="h-3 w-3 mr-1" />
                    No Connection
                  </>
                )}
              </Badge>
            </div>

            {/* Device Selector */}
            <div className="flex items-center space-x-2">
              <span className="text-sm font-medium">Device:</span>
              <Select value={selectedDeviceId || ""} onValueChange={selectDevice}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Select device">
                    {selectedDevice && (
                      <div className="flex items-center space-x-2">
                        <div 
                          className="w-3 h-3 rounded-full border border-white shadow-sm"
                          style={{ backgroundColor: selectedDevice.color }}
                        />
                        <span className="truncate">{selectedDevice.title}</span>
                        {selectedDevice.isConnected ? (
                          <Wifi className="h-3 w-3 text-green-600" />
                        ) : (
                          <WifiOff className="h-3 w-3 text-gray-400" />
                        )}
                      </div>
                    )}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {devices.map((device) => (
                    <SelectItem key={device.id} value={device.id}>
                      <div className="flex items-center space-x-2 w-full">
                        <div 
                          className="w-3 h-3 rounded-full border border-white shadow-sm"
                          style={{ backgroundColor: device.color }}
                        />
                        <span className="flex-1 truncate">{device.title}</span>
                        <span className="text-xs text-muted-foreground">
                          {device.location}
                        </span>
                        {device.isConnected ? (
                          <Wifi className="h-3 w-3 text-green-600" />
                        ) : (
                          <WifiOff className="h-3 w-3 text-gray-400" />
                        )}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </>
        )}
      </div>
    </nav>
  );
};

export default Navigation;