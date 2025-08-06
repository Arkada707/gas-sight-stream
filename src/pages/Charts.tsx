import { useState, useEffect } from "react";
import { useDeviceData } from "@/hooks/useDeviceData";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { format, subHours, subDays, subWeeks, parseISO } from 'date-fns';
import { TrendingUp, Download, Calendar, Palette, Layers } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import Navigation from "@/components/Navigation";

interface SensorDataPoint {
  id: string;
  device_id: string;
  title_name: string;
  tank_level: number;
  measurement: number;
  battery: "Full" | "Ok" | "Low";
  connection_strength: number;
  created_at: string;
}

interface ChartDataPoint {
  timestamp: Date;
  time: string;
  raw_timestamp: string;
  [key: string]: any; // Dynamic device data keys
}

interface DeviceVisibility {
  [deviceId: string]: boolean;
}

const Charts = () => {
  const { devices, selectedDeviceId, getEnabledDevices } = useDeviceData();
  const [historicalData, setHistoricalData] = useState<SensorDataPoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRange, setSelectedRange] = useState("24h");
  const [deviceVisibility, setDeviceVisibility] = useState<DeviceVisibility>({});
  const [chartMode, setChartMode] = useState<'single' | 'multi'>('single');

  const enabledDevices = getEnabledDevices();

  const timeRanges = {
    "3h": { hours: 3, label: "3 Hours" },
    "6h": { hours: 6, label: "6 Hours" },
    "24h": { hours: 24, label: "24 Hours" },
    "1w": { days: 7, label: "1 Week" },
    "1m": { days: 30, label: "1 Month" }
  };

  // Initialize device visibility
  useEffect(() => {
    const initialVisibility: DeviceVisibility = {};
    enabledDevices.forEach(device => {
      initialVisibility[device.id] = true;
    });
    setDeviceVisibility(initialVisibility);
  }, [enabledDevices]);

  const fetchHistoricalData = async (range: string) => {
    setLoading(true);
    try {
      let startDate: Date;
      const now = new Date();

      if (range === "1w") {
        startDate = subWeeks(now, 1);
      } else if (range === "1m") {
        startDate = subDays(now, 30);
      } else {
        const hours = timeRanges[range as keyof typeof timeRanges]?.hours || 24;
        startDate = subHours(now, hours);
      }

      let query = supabase
        .from('sensor_data')
        .select('*')
        .gte('created_at', startDate.toISOString())
        .order('created_at', { ascending: true });

      // Filter by selected device in single mode
      if (chartMode === 'single' && selectedDeviceId) {
        query = query.eq('device_id', selectedDeviceId);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Error fetching historical data:', error);
        return;
      }

      setHistoricalData(data || []);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHistoricalData(selectedRange);
  }, [selectedRange, chartMode, selectedDeviceId]);

  const formatChartData = (data: SensorDataPoint[]): ChartDataPoint[] => {
    if (chartMode === 'single') {
      // Single device mode
      return data.map(point => ({
        timestamp: parseISO(point.created_at),
        time: format(parseISO(point.created_at), selectedRange === "1m" ? "MMM dd" : selectedRange === "1w" ? "MMM dd HH:mm" : "HH:mm"),
        gasLevel: point.measurement,
        tankLevel: point.tank_level,
        connectionQuality: point.connection_strength,
        batteryLevel: point.battery === 'Full' ? 100 : point.battery === 'Ok' ? 75 : 25,
        raw_timestamp: point.created_at
      }));
    } else {
      // Multi-device mode
      const timeGroups: { [timestamp: string]: SensorDataPoint[] } = {};
      
      data.forEach(point => {
        const timeKey = point.created_at;
        if (!timeGroups[timeKey]) {
          timeGroups[timeKey] = [];
        }
        timeGroups[timeKey].push(point);
      });

      const chartPoints: ChartDataPoint[] = [];
      
      Object.entries(timeGroups).forEach(([timestamp, points]) => {
        const chartPoint: ChartDataPoint = {
          timestamp: parseISO(timestamp),
          time: format(parseISO(timestamp), selectedRange === "1m" ? "MMM dd" : selectedRange === "1w" ? "MMM dd HH:mm" : "HH:mm"),
          raw_timestamp: timestamp
        };

        points.forEach(point => {
          const devicePrefix = point.device_id;
          chartPoint[`${devicePrefix}_gasLevel`] = point.measurement;
          chartPoint[`${devicePrefix}_tankLevel`] = point.tank_level;
          chartPoint[`${devicePrefix}_connection`] = point.connection_strength;
          chartPoint[`${devicePrefix}_battery`] = point.battery === 'Full' ? 100 : point.battery === 'Ok' ? 75 : 25;
        });

        chartPoints.push(chartPoint);
      });

      return chartPoints.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
    }
  };

  const chartData = formatChartData(historicalData);

  const downloadData = (format: 'csv' | 'json') => {
    const dataToDownload = historicalData.map(point => ({
      timestamp: point.created_at,
      device_id: point.device_id,
      device_title: point.title_name,
      gas_level: point.measurement,
      tank_level: point.tank_level,
      battery: point.battery,
      connection_strength: point.connection_strength
    }));

    if (format === 'json') {
      const blob = new Blob([JSON.stringify(dataToDownload, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `sensor_data_${chartMode}_${selectedRange}_${format(new Date(), 'yyyy-MM-dd')}.json`;
      a.click();
      URL.revokeObjectURL(url);
    } else if (format === 'csv') {
      const headers = ['timestamp', 'device_id', 'device_title', 'gas_level', 'tank_level', 'battery', 'connection_strength'];
      const csvContent = [
        headers.join(','),
        ...dataToDownload.map(row => headers.map(header => row[header as keyof typeof row]).join(','))
      ].join('\n');
      
      const blob = new Blob([csvContent], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `sensor_data_${chartMode}_${selectedRange}_${format(new Date(), 'yyyy-MM-dd')}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    }
  };

  const toggleDeviceVisibility = (deviceId: string) => {
    setDeviceVisibility(prev => ({
      ...prev,
      [deviceId]: !prev[deviceId]
    }));
  };

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      
      if (chartMode === 'single') {
        return (
          <div className="bg-background border border-border rounded-lg p-3 shadow-lg">
            <p className="font-semibold">{format(data.timestamp, 'PPpp')}</p>
            {payload.map((entry: any, index: number) => (
              <p key={index} style={{ color: entry.color }}>
                {entry.name}: {entry.value.toFixed(1)}{entry.name === 'Gas Level' || entry.name === 'Connection Quality' || entry.name === 'Battery Level' ? '%' : entry.name === 'Tank Level' ? ' cm' : ''}
              </p>
            ))}
          </div>
        );
      } else {
        const visibleDevices = enabledDevices.filter(d => deviceVisibility[d.id]);
        
        return (
          <div className="bg-background border border-border rounded-lg p-3 shadow-lg max-w-xs">
            <p className="font-semibold mb-2">{format(data.timestamp, 'PPpp')}</p>
            {visibleDevices.map(device => {
              const gasLevel = data[`${device.id}_gasLevel`];
              const tankLevel = data[`${device.id}_tankLevel`];
              const connection = data[`${device.id}_connection`];
              
              if (gasLevel !== undefined) {
                return (
                  <div key={device.id} className="mb-2 last:mb-0">
                    <div className="flex items-center gap-2 mb-1">
                      <div 
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: device.color }}
                      />
                      <span className="font-medium text-sm">{device.title}</span>
                    </div>
                    <div className="text-sm space-y-1 ml-5">
                      <p>Gas: {gasLevel.toFixed(1)}%</p>
                      <p>Tank: {tankLevel.toFixed(1)} cm</p>
                      <p>Signal: {connection}%</p>
                    </div>
                  </div>
                );
              }
              return null;
            })}
          </div>
        );
      }
    }
    return null;
  };

  const renderSingleDeviceLines = () => (
    <>
      <Line
        type="monotone"
        dataKey="gasLevel"
        stroke="#22c55e"
        strokeWidth={2}
        dot={{ fill: '#22c55e', r: 3 }}
        name="Gas Level"
      />
      <Line
        type="monotone"
        dataKey="tankLevel"
        stroke="#3b82f6"
        strokeWidth={2}
        dot={{ fill: '#3b82f6', r: 3 }}
        name="Tank Level"
      />
      <Line
        type="monotone"
        dataKey="connectionQuality"
        stroke="#f59e0b"
        strokeWidth={2}
        dot={{ fill: '#f59e0b', r: 3 }}
        name="Connection Quality"
      />
      <Line
        type="monotone"
        dataKey="batteryLevel"
        stroke="#ef4444"
        strokeWidth={2}
        dot={{ fill: '#ef4444', r: 3 }}
        name="Battery Level"
      />
    </>
  );

  const renderMultiDeviceLines = (metric: string, unit: string) => {
    return enabledDevices
      .filter(device => deviceVisibility[device.id])
      .map(device => (
        <Line
          key={`${device.id}_${metric}`}
          type="monotone"
          dataKey={`${device.id}_${metric}`}
          stroke={device.color}
          strokeWidth={2}
          dot={{ fill: device.color, r: 3 }}
          name={`${device.title} (${unit})`}
        />
      ));
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto p-6">
          <Navigation />
          <div className="flex items-center justify-center h-64">
            <div className="text-lg">Loading charts...</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto p-6 space-y-6">
        {/* Navigation */}
        <Navigation />
        
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold text-foreground">
              {chartMode === 'single' ? 'Device Charts' : 'Multi-Device Charts'}
            </h1>
            <p className="text-muted-foreground mt-1">
              {chartMode === 'single' 
                ? 'Historical data visualization for selected device'
                : 'Compare data across multiple devices with color-coded visualization'
              }
            </p>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => downloadData('csv')}
                className="flex items-center gap-2"
              >
                <Download className="h-4 w-4" />
                CSV
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => downloadData('json')}
                className="flex items-center gap-2"
              >
                <Download className="h-4 w-4" />
                JSON
              </Button>
            </div>
          </div>
        </div>

        {/* Controls */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Chart Mode */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Layers className="h-5 w-5" />
                Chart Mode
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col space-y-3">
                <div className="flex items-center space-x-2">
                  <input
                    type="radio"
                    id="single"
                    name="chartMode"
                    checked={chartMode === 'single'}
                    onChange={() => setChartMode('single')}
                    className="w-4 h-4 text-blue-600"
                  />
                  <Label htmlFor="single" className="text-sm font-medium cursor-pointer">
                    Single Device
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <input
                    type="radio"
                    id="multi"
                    name="chartMode"
                    checked={chartMode === 'multi'}
                    onChange={() => setChartMode('multi')}
                    className="w-4 h-4 text-blue-600"
                  />
                  <Label htmlFor="multi" className="text-sm font-medium cursor-pointer">
                    Multi-Device Comparison
                  </Label>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Time Range */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Time Range
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {Object.entries(timeRanges).map(([key, range]) => (
                  <Button
                    key={key}
                    variant={selectedRange === key ? "default" : "outline"}
                    size="sm"
                    onClick={() => setSelectedRange(key)}
                  >
                    {range.label}
                  </Button>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Device Visibility - only show in multi mode */}
          {chartMode === 'multi' && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Palette className="h-5 w-5" />
                  Device Visibility
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 max-h-48 overflow-y-auto">
                  {enabledDevices.map(device => (
                    <div key={device.id} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div 
                          className="w-4 h-4 rounded-full border border-white shadow-sm"
                          style={{ backgroundColor: device.color }}
                        />
                        <Label className="text-sm font-medium cursor-pointer">
                          {device.title}
                        </Label>
                      </div>
                      <Switch
                        checked={deviceVisibility[device.id] || false}
                        onCheckedChange={() => toggleDeviceVisibility(device.id)}
                      />
                    </div>
                  ))}
                  {enabledDevices.length === 0 && (
                    <p className="text-sm text-muted-foreground">
                      No devices available. Add devices in the Device Management page.
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Charts */}
        {(chartMode === 'single' && selectedDeviceId) || (chartMode === 'multi' && enabledDevices.length > 0) ? (
          chartMode === 'single' ? (
            // Single Device View
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  Device Metrics
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-96">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                      <XAxis 
                        dataKey="time" 
                        tick={{ fontSize: 12 }}
                        tickLine={{ strokeWidth: 1 }}
                      />
                      <YAxis 
                        tick={{ fontSize: 12 }}
                        label={{ value: 'Level/Quality (%)', angle: -90, position: 'insideLeft' }}
                      />
                      <Tooltip content={<CustomTooltip />} />
                      <Legend />
                      {renderSingleDeviceLines()}
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          ) : (
            // Multi-Device View
            <Tabs defaultValue="gas" className="w-full">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="gas">Gas Levels</TabsTrigger>
                <TabsTrigger value="tank">Tank Levels</TabsTrigger>
                <TabsTrigger value="connection">Signal Strength</TabsTrigger>
                <TabsTrigger value="battery">Battery Status</TabsTrigger>
              </TabsList>

              <TabsContent value="gas" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <TrendingUp className="h-5 w-5" />
                      Gas Levels Comparison
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="h-96">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={chartData}>
                          <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                          <XAxis dataKey="time" tick={{ fontSize: 12 }} />
                          <YAxis 
                            domain={[0, 100]}
                            tick={{ fontSize: 12 }}
                            label={{ value: 'Gas Level (%)', angle: -90, position: 'insideLeft' }}
                          />
                          <Tooltip content={<CustomTooltip />} />
                          <Legend />
                          {renderMultiDeviceLines('gasLevel', '%')}
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="tank" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <TrendingUp className="h-5 w-5" />
                      Tank Levels Comparison
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="h-96">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={chartData}>
                          <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                          <XAxis dataKey="time" tick={{ fontSize: 12 }} />
                          <YAxis 
                            tick={{ fontSize: 12 }}
                            label={{ value: 'Tank Level (cm)', angle: -90, position: 'insideLeft' }}
                          />
                          <Tooltip content={<CustomTooltip />} />
                          <Legend />
                          {renderMultiDeviceLines('tankLevel', 'cm')}
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="connection" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <TrendingUp className="h-5 w-5" />
                      Connection Quality Comparison
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="h-96">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={chartData}>
                          <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                          <XAxis dataKey="time" tick={{ fontSize: 12 }} />
                          <YAxis 
                            domain={[0, 100]}
                            tick={{ fontSize: 12 }}
                            label={{ value: 'Signal Strength (%)', angle: -90, position: 'insideLeft' }}
                          />
                          <Tooltip content={<CustomTooltip />} />
                          <Legend />
                          {renderMultiDeviceLines('connection', '%')}
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="battery" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <TrendingUp className="h-5 w-5" />
                      Battery Status Comparison
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="h-96">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={chartData}>
                          <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                          <XAxis dataKey="time" tick={{ fontSize: 12 }} />
                          <YAxis 
                            domain={[0, 100]}
                            tick={{ fontSize: 12 }}
                            label={{ value: 'Battery Level (%)', angle: -90, position: 'insideLeft' }}
                          />
                          <Tooltip content={<CustomTooltip />} />
                          <Legend />
                          {renderMultiDeviceLines('battery', '%')}
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          )
        ) : (
          <Card>
            <CardContent className="p-12 text-center">
              <TrendingUp className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2">
                {chartMode === 'single' ? 'No Device Selected' : 'No Devices Available'}
              </h3>
              <p className="text-muted-foreground mb-6">
                {chartMode === 'single' 
                  ? 'Select a device from the navigation bar to view its charts.'
                  : 'Add and enable devices in the Device Management page to see multi-device charts.'
                }
              </p>
              {chartMode === 'multi' && (
                <Button asChild>
                  <a href="/devices">Manage Devices</a>
                </Button>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default Charts;