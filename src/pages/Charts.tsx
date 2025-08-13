import { useState, useEffect, useRef } from "react";
import { useDeviceData } from "@/hooks/useDeviceData";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ReferenceDot } from 'recharts';
import { format, subHours, subDays, subWeeks, parseISO, differenceInMinutes } from 'date-fns';
import { TrendingUp, Download, Calendar, Palette, Layers, MessageCircle, Send, User } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import Navigation from "@/components/Navigation";
import { toast } from "sonner";

interface SensorDataPoint {
  id: string;
  device_id: string;
  title_name: string;
  tank_level: number;
  measurement: number;
  battery: string;
  connection_strength: number;
  created_at: string;
}

interface ChartDataPoint {
  timestamp: Date;
  time: string;
  raw_timestamp: string;
  gasLevel?: number;
  tankLevel?: number;
  connectionQuality?: number;
  batteryLevel?: number;
  [key: string]: number | string | Date | Comment[] | undefined; // Dynamic device data keys
}

interface DeviceVisibility {
  [deviceId: string]: boolean;
}

interface Comment {
  id: string;
  sensor_data_id: string;
  comment_text: string;
  user_name: string;
  created_at: string;
  updated_at: string;
}

interface DataPointWithComments extends ChartDataPoint {
  sensor_data_id?: string;
  comments?: Comment[];
}

const Charts = () => {
  const { devices, selectedDeviceId, getEnabledDevices } = useDeviceData();
  const [historicalData, setHistoricalData] = useState<SensorDataPoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRange, setSelectedRange] = useState("24h");
  const [deviceVisibility, setDeviceVisibility] = useState<DeviceVisibility>({});
  const [chartMode, setChartMode] = useState<'single' | 'multi'>('single');
  const [comments, setComments] = useState<Comment[]>([]);
  const [selectedDataPoint, setSelectedDataPoint] = useState<DataPointWithComments | null>(null);
  const [newComment, setNewComment] = useState('');
  const [userName, setUserName] = useState('Anonymous');
  const [isCommentDialogOpen, setIsCommentDialogOpen] = useState(false);
  const [isLiveConnected, setIsLiveConnected] = useState(false);
  const [lastDataUpdate, setLastDataUpdate] = useState<Date | null>(null);
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const connectionTimeoutRef = useRef<NodeJS.Timeout | null>(null);

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
        const rangeData = timeRanges[range as keyof typeof timeRanges];
        const hours = 'hours' in rangeData ? rangeData.hours : 24;
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

      setHistoricalData((data || []) as SensorDataPoint[]);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHistoricalData(selectedRange).then(() => {
      // Auto-scroll to latest data when view changes
      setTimeout(() => {
        if (chartContainerRef.current) {
          const scrollContainer = chartContainerRef.current;
          scrollContainer.scrollLeft = scrollContainer.scrollWidth;
        }
      }, 100);
    });
    
    // Set up periodic refresh as fallback (every 2 minutes to avoid conflicts with device data timing)
    const intervalId = setInterval(() => {
      fetchHistoricalData(selectedRange);
    }, 120000);
    
    return () => {
      clearInterval(intervalId);
    };
  }, [selectedRange, chartMode, selectedDeviceId]); // eslint-disable-line react-hooks/exhaustive-deps

  // Set up real-time subscription for new data with optimistic updates and auto-scroll
  useEffect(() => {
    const subscription = supabase
      .channel('sensor_data_realtime_charts')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'sensor_data'
        },
        (payload) => {
          console.log('New sensor data received:', payload);
          const newData = payload.new as SensorDataPoint;
          
          // Update live connection status and timestamp
          setIsLiveConnected(true);
          setLastDataUpdate(new Date());
          
          // Reset connection timeout - expect next update within 3 minutes (device sends ~1min)
          if (connectionTimeoutRef.current) {
            clearTimeout(connectionTimeoutRef.current);
          }
          connectionTimeoutRef.current = setTimeout(() => {
            setIsLiveConnected(false);
          }, 180000); // 3 minutes timeout
          
          // Check if this data point is relevant to current view
          let shouldUpdate = false;
          
          if (chartMode === 'single') {
            if (selectedDeviceId && newData.device_id === selectedDeviceId) {
              shouldUpdate = true;
            }
          } else {
            // In multi-device mode, refresh if any enabled device has new data
            const enabledDeviceIds = enabledDevices.map(d => d.id);
            if (enabledDeviceIds.includes(newData.device_id)) {
              shouldUpdate = true;
            }
          }
          
          if (shouldUpdate) {
            // Optimistic update - add new data point immediately
            setHistoricalData(prevData => {
              const updatedData = [...prevData, newData];
              // Keep data sorted by timestamp
              return updatedData.sort((a, b) => 
                new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
              );
            });
            
            // Auto-scroll to latest data after optimistic update
            setTimeout(() => {
              if (chartContainerRef.current) {
                const scrollContainer = chartContainerRef.current;
                scrollContainer.scrollLeft = scrollContainer.scrollWidth;
              }
            }, 100);
            
            // Show toast notification only occasionally (every 5th update) to avoid spam
            const shouldShowToast = Math.random() < 0.2; // 20% chance
            if (shouldShowToast) {
              toast.success(`📊 Live data updated`, {
                duration: 1500,
                description: `${newData.title_name}: ${newData.measurement}% gas`,
              });
            }
            
            // Also refresh data from server to ensure consistency
            setTimeout(() => {
              fetchHistoricalData(selectedRange);
            }, 1000);
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'sensor_data'
        },
        (payload) => {
          console.log('Sensor data updated:', payload);
          // Refresh data when existing data is updated (silently)
          fetchHistoricalData(selectedRange);
        }
      )
      .subscribe((status) => {
        console.log('Real-time subscription status:', status);
        if (status === 'SUBSCRIBED') {
          setIsLiveConnected(true);
          // Only show success toast on initial connection, not on every reconnect
          if (!isLiveConnected) {
            toast.success('🟢 Live updates connected!', { 
              duration: 2000,
              description: 'Charts will update automatically with new data'
            });
          }
        } else if (status === 'CLOSED') {
          // Only show warning if we were previously connected
          if (isLiveConnected) {
            setIsLiveConnected(false);
            toast.warning('🔴 Live updates disconnected', { 
              duration: 2000,
              description: 'Attempting to reconnect...'
            });
          }
        }
      });

    return () => {
      subscription.unsubscribe();
      setIsLiveConnected(false);
      if (connectionTimeoutRef.current) {
        clearTimeout(connectionTimeoutRef.current);
      }
    };
  }, [selectedRange, chartMode, selectedDeviceId, enabledDevices]); // eslint-disable-line react-hooks/exhaustive-deps

  // Fetch comments
  const fetchComments = async () => {
    try {
      const { data, error } = await supabase
        .from('comments')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching comments:', error);
        return;
      }

      setComments(data || []);
    } catch (error) {
      console.error('Error:', error);
    }
  };

  useEffect(() => {
    fetchComments();
  }, []);

  // Real-time subscription for comments
  useEffect(() => {
    const subscription = supabase
      .channel('comments_realtime')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'comments'
        },
        () => {
          fetchComments();
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const formatChartData = (data: SensorDataPoint[]): DataPointWithComments[] => {
    if (chartMode === 'single') {
      // Single device mode - add disconnection gaps
      const sortedData = data.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
      const result: DataPointWithComments[] = [];
      
      for (let i = 0; i < sortedData.length; i++) {
        const point = sortedData[i];
        const timestamp = parseISO(point.created_at);
        
        // Add gap if there's more than 10 minutes between data points
        if (i > 0) {
          const prevTimestamp = parseISO(sortedData[i - 1].created_at);
          const timeDiff = differenceInMinutes(timestamp, prevTimestamp);
          
          if (timeDiff > 10) {
            // Add a gap marker (null values)
            result.push({
              timestamp: new Date(prevTimestamp.getTime() + 5 * 60000), // 5 minutes after last point
              time: '',
              gasLevel: null as unknown as number,
              tankLevel: null as unknown as number,
              connectionQuality: null as unknown as number,
              batteryLevel: null as unknown as number,
              raw_timestamp: '',
              sensor_data_id: undefined,
              comments: []
            });
          }
        }
        
        const pointComments = comments.filter(c => c.sensor_data_id === point.id);
        result.push({
          timestamp,
          time: format(timestamp, selectedRange === "1m" ? "MMM dd" : selectedRange === "1w" ? "MMM dd HH:mm" : "HH:mm"),
          gasLevel: point.measurement,
          tankLevel: point.tank_level,
          connectionQuality: point.connection_strength,
          batteryLevel: point.battery === 'Full' ? 100 : point.battery === 'Ok' ? 75 : 25,
          raw_timestamp: point.created_at,
          sensor_data_id: point.id,
          comments: pointComments
        });
      }
      
      return result;
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

      const chartPoints: DataPointWithComments[] = [];
      
      Object.entries(timeGroups).forEach(([timestamp, points]) => {
        const chartPoint: DataPointWithComments = {
          timestamp: parseISO(timestamp),
          time: format(parseISO(timestamp), selectedRange === "1m" ? "MMM dd" : selectedRange === "1w" ? "MMM dd HH:mm" : "HH:mm"),
          raw_timestamp: timestamp,
          comments: []
        };

        points.forEach(point => {
          const devicePrefix = point.device_id;
          chartPoint[`${devicePrefix}_gasLevel`] = point.measurement;
          chartPoint[`${devicePrefix}_tankLevel`] = point.tank_level;
          chartPoint[`${devicePrefix}_connection`] = point.connection_strength;
          chartPoint[`${devicePrefix}_battery`] = point.battery === 'Full' ? 100 : point.battery === 'Ok' ? 75 : 25;
          
          // Collect comments for this data point
          const pointComments = comments.filter(c => c.sensor_data_id === point.id);
          chartPoint.comments = [...(chartPoint.comments || []), ...pointComments];
        });

        chartPoints.push(chartPoint);
      });

      return chartPoints.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
    }
  };

  const chartData = formatChartData(historicalData);

  // Handle adding comments
  const handleAddComment = async () => {
    if (!newComment.trim() || !selectedDataPoint?.sensor_data_id) return;

    try {
      const { error } = await supabase
        .from('comments')
        .insert({
          sensor_data_id: selectedDataPoint.sensor_data_id,
          comment_text: newComment.trim(),
          user_name: userName.trim() || 'Anonymous'
        });

      if (error) {
        console.error('Error adding comment:', error);
        toast.error('Failed to add comment');
        return;
      }

      setNewComment('');
      toast.success('Comment added successfully!');
    } catch (error) {
      console.error('Error:', error);
      toast.error('Failed to add comment');
    }
  };

  // Handle chart click to show comment dialog
  const handleChartClick = (data: { activePayload?: Array<{ payload: DataPointWithComments }> }) => {
    if (data && data.activePayload && data.activePayload[0]) {
      const clickedPoint = data.activePayload[0].payload as DataPointWithComments;
      if (clickedPoint.sensor_data_id) {
        setSelectedDataPoint(clickedPoint);
        setIsCommentDialogOpen(true);
      }
    }
  };

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

  const CustomTooltip = ({ active, payload }: { active?: boolean; payload?: Array<{ color: string; name: string; value: number; payload: DataPointWithComments }>; label?: string }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      const hasComments = data.comments && data.comments.length > 0;
      
      if (chartMode === 'single') {
        return (
          <div className="bg-background border border-border rounded-lg p-3 shadow-lg max-w-sm">
            <p className="font-semibold">{format(data.timestamp, 'PPpp')}</p>
            {payload.map((entry, index: number) => (
              <p key={index} style={{ color: entry.color }}>
                {entry.name}: {entry.value.toFixed(1)}{entry.name === 'Gas Level' || entry.name === 'Connection Quality' || entry.name === 'Battery Level' ? '%' : entry.name === 'Tank Level' ? ' cm' : ''}
              </p>
            ))}
            
            {/* Comments Preview */}
            {hasComments && (
              <div className="mt-3 pt-2 border-t border-border/50">
                <div className="flex items-center gap-1 mb-2">
                  <MessageCircle className="h-3 w-3 text-blue-500" />
                  <span className="text-xs font-medium text-blue-600">
                    {data.comments.length} comment{data.comments.length !== 1 ? 's' : ''}
                  </span>
                </div>
                <div className="space-y-1 max-h-20 overflow-y-auto">
                  {data.comments.slice(0, 2).map((comment) => (
                    <div key={comment.id} className="text-xs bg-muted/50 p-1.5 rounded">
                      <div className="font-medium text-muted-foreground">{comment.user_name}</div>
                      <div className="text-foreground">{comment.comment_text.length > 50 ? comment.comment_text.substring(0, 50) + '...' : comment.comment_text}</div>
                    </div>
                  ))}
                  {data.comments.length > 2 && (
                    <div className="text-xs text-muted-foreground italic">
                      +{data.comments.length - 2} more comment{data.comments.length - 2 !== 1 ? 's' : ''}...
                    </div>
                  )}
                </div>
                <div className="text-xs text-blue-600 mt-1 font-medium">
                  💡 Click to view/add comments
                </div>
              </div>
            )}
            
            {/* Click to comment hint for points without comments */}
            {!hasComments && (
              <div className="mt-2 pt-2 border-t border-border/50">
                <div className="text-xs text-muted-foreground">
                  💬 Click to add a comment
                </div>
              </div>
            )}
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
                       <p>Gas: {typeof gasLevel === 'number' ? gasLevel.toFixed(1) : String(gasLevel)}%</p>
                       <p>Tank: {typeof tankLevel === 'number' ? tankLevel.toFixed(1) : String(tankLevel)} cm</p>
                       <p>Signal: {String(connection)}%</p>
                     </div>
                  </div>
                );
              }
              return null;
            })}
            
            {/* Comments Preview for Multi-device */}
            {hasComments && (
              <div className="mt-3 pt-2 border-t border-border/50">
                <div className="flex items-center gap-1 mb-1">
                  <MessageCircle className="h-3 w-3 text-blue-500" />
                  <span className="text-xs font-medium text-blue-600">
                    {data.comments.length} comment{data.comments.length !== 1 ? 's' : ''}
                  </span>
                </div>
                <div className="text-xs text-blue-600 font-medium">
                  💡 Click to view/add comments
                </div>
              </div>
            )}
          </div>
        );
      }
    }
    return null;
  };

  // Render comment indicators as dots on the chart
  const renderCommentIndicators = () => {
    const pointsWithComments = chartData.filter(point => point.comments && point.comments.length > 0);
    
    return pointsWithComments.map((point, index) => (
      <ReferenceDot
        key={`comment-${point.raw_timestamp}-${index}`}
        x={point.time}
        y={chartMode === 'single' ? (point.gasLevel || 50) : 50} // Position at gas level for single, middle for multi
        r={4}
        fill="#3b82f6"
        stroke="#ffffff"
        strokeWidth={2}
        className="animate-pulse cursor-pointer"
      />
    ));
  };

  const renderSingleDeviceLines = () => (
    <>
      <Line
        type="monotone"
        dataKey="gasLevel"
        stroke="#22c55e"
        strokeWidth={2}
        dot={{ fill: '#22c55e', r: 3 }}
        connectNulls={false}
        name="Gas Level"
      />
      <Line
        type="monotone"
        dataKey="tankLevel"
        stroke="#3b82f6"
        strokeWidth={2}
        dot={{ fill: '#3b82f6', r: 3 }}
        connectNulls={false}
        name="Tank Level"
      />
      <Line
        type="monotone"
        dataKey="connectionQuality"
        stroke="#f59e0b"
        strokeWidth={2}
        dot={{ fill: '#f59e0b', r: 3 }}
        connectNulls={false}
        name="Connection Quality"
      />
      <Line
        type="monotone"
        dataKey="batteryLevel"
        stroke="#ef4444"
        strokeWidth={2}
        dot={{ fill: '#ef4444', r: 3 }}
        connectNulls={false}
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
          connectNulls={false}
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
        
        {/* Live Status Indicator - Only show if there's been recent activity */}
        {lastDataUpdate && (
          <div className="flex items-center justify-center gap-2 mb-4">
            <div className={`w-3 h-3 rounded-full ${isLiveConnected ? 'bg-green-500' : 'bg-yellow-500'}`} />
            <span className="text-sm text-muted-foreground">
              {isLiveConnected ? (
                <span className="text-green-600 font-medium">
                  🟢 Live Updates Active
                  <span className="text-xs ml-2">
                    Last: {format(lastDataUpdate, 'HH:mm:ss')}
                  </span>
                </span>
              ) : (
                <span className="text-yellow-600">
                  ⏱️ Awaiting next update...
                </span>
              )}
            </span>
          </div>
        )}
        
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
                <div className="h-96 overflow-x-auto" ref={chartContainerRef}>
                  <div className="min-w-full" style={{ width: Math.max(800, chartData.length * 50) }}>
                    <ResponsiveContainer width="100%" height={400}>
                      <LineChart data={chartData} onClick={handleChartClick}>
                        <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                        <XAxis 
                          dataKey="time" 
                          tick={{ fontSize: 12 }}
                          tickLine={{ strokeWidth: 1 }}
                          interval={0}
                          angle={-45}
                          textAnchor="end"
                          height={60}
                        />
                        <YAxis 
                          tick={{ fontSize: 12 }}
                          label={{ value: 'Level/Quality (%)', angle: -90, position: 'insideLeft' }}
                        />
                        <Tooltip content={<CustomTooltip />} />
                        <Legend />
                        {renderSingleDeviceLines()}
                        {renderCommentIndicators()}
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>
                <div className="mt-4 text-sm text-muted-foreground text-center">
                  💡 Click on any data point to add comments • 🔵 Blue dots = comments available • Hover to preview
                  <br />
                  Chart scrolls horizontally for detailed view
                  {isLiveConnected && lastDataUpdate && (
                    <div className="mt-1 text-xs text-green-600">
                      ⚡ Auto-updating with live data (device sends ~1min intervals)
                    </div>
                  )}
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
                    <div className="h-96 overflow-x-auto">
                      <div className="min-w-full" style={{ width: Math.max(800, chartData.length * 50) }}>
                        <ResponsiveContainer width="100%" height={400}>
                          <LineChart data={chartData} onClick={handleChartClick}>
                            <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                            <XAxis 
                              dataKey="time" 
                              tick={{ fontSize: 12 }}
                              interval={0}
                              angle={-45}
                              textAnchor="end"
                              height={60}
                            />
                            <YAxis 
                              domain={[0, 100]}
                              tick={{ fontSize: 12 }}
                              label={{ value: 'Gas Level (%)', angle: -90, position: 'insideLeft' }}
                            />
                            <Tooltip content={<CustomTooltip />} />
                            <Legend />
                            {renderMultiDeviceLines('gasLevel', '%')}
                            {renderCommentIndicators()}
                          </LineChart>
                        </ResponsiveContainer>
                      </div>
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
                    <div className="h-96 overflow-x-auto">
                      <div className="min-w-full" style={{ width: Math.max(800, chartData.length * 50) }}>
                        <ResponsiveContainer width="100%" height={400}>
                          <LineChart data={chartData} onClick={handleChartClick}>
                            <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                            <XAxis 
                              dataKey="time" 
                              tick={{ fontSize: 12 }}
                              interval={0}
                              angle={-45}
                              textAnchor="end"
                              height={60}
                            />
                            <YAxis 
                              tick={{ fontSize: 12 }}
                              label={{ value: 'Tank Level (cm)', angle: -90, position: 'insideLeft' }}
                            />
                            <Tooltip content={<CustomTooltip />} />
                            <Legend />
                            {renderMultiDeviceLines('tankLevel', 'cm')}
                            {renderCommentIndicators()}
                          </LineChart>
                        </ResponsiveContainer>
                      </div>
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
                    <div className="h-96 overflow-x-auto">
                      <div className="min-w-full" style={{ width: Math.max(800, chartData.length * 50) }}>
                        <ResponsiveContainer width="100%" height={400}>
                          <LineChart data={chartData} onClick={handleChartClick}>
                            <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                            <XAxis 
                              dataKey="time" 
                              tick={{ fontSize: 12 }}
                              interval={0}
                              angle={-45}
                              textAnchor="end"
                              height={60}
                            />
                            <YAxis 
                              domain={[0, 100]}
                              tick={{ fontSize: 12 }}
                              label={{ value: 'Signal Strength (%)', angle: -90, position: 'insideLeft' }}
                            />
                            <Tooltip content={<CustomTooltip />} />
                            <Legend />
                            {renderMultiDeviceLines('connection', '%')}
                            {renderCommentIndicators()}
                          </LineChart>
                        </ResponsiveContainer>
                      </div>
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
                    <div className="h-96 overflow-x-auto">
                      <div className="min-w-full" style={{ width: Math.max(800, chartData.length * 50) }}>
                        <ResponsiveContainer width="100%" height={400}>
                          <LineChart data={chartData} onClick={handleChartClick}>
                            <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                            <XAxis 
                              dataKey="time" 
                              tick={{ fontSize: 12 }}
                              interval={0}
                              angle={-45}
                              textAnchor="end"
                              height={60}
                            />
                            <YAxis 
                              domain={[0, 100]}
                              tick={{ fontSize: 12 }}
                              label={{ value: 'Battery Level (%)', angle: -90, position: 'insideLeft' }}
                            />
                            <Tooltip content={<CustomTooltip />} />
                            <Legend />
                            {renderMultiDeviceLines('battery', '%')}
                            {renderCommentIndicators()}
                          </LineChart>
                        </ResponsiveContainer>
                      </div>
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

      {/* Comment Dialog */}
      <Dialog open={isCommentDialogOpen} onOpenChange={setIsCommentDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <MessageCircle className="h-5 w-5" />
              Data Point Comments
            </DialogTitle>
          </DialogHeader>
          
          {selectedDataPoint && (
            <div className="space-y-4">
              <div className="bg-muted/50 p-3 rounded-lg">
                <div className="text-sm font-medium">
                  {format(selectedDataPoint.timestamp, 'PPpp')}
                </div>
                 <div className="text-xs text-muted-foreground mt-1">
                   {chartMode === 'single' ? (
                      <div>
                        Gas: {typeof selectedDataPoint.gasLevel === 'number' ? selectedDataPoint.gasLevel.toFixed(1) : 'N/A'}% | 
                        Tank: {typeof selectedDataPoint.tankLevel === 'number' ? selectedDataPoint.tankLevel.toFixed(1) : 'N/A'} cm |
                        Signal: {selectedDataPoint.connectionQuality || 'N/A'}%
                      </div>
                   ) : (
                     <div>Multi-device data point</div>
                   )}
                 </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4" />
                  <Input
                    placeholder="Your name (optional)"
                    value={userName}
                    onChange={(e) => setUserName(e.target.value)}
                    className="flex-1"
                  />
                </div>

                <div className="space-y-2">
                  <Textarea
                    placeholder="Add your comment about this data point..."
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    className="min-h-[80px]"
                  />
                  <Button 
                    onClick={handleAddComment} 
                    disabled={!newComment.trim()}
                    className="w-full"
                  >
                    <Send className="h-4 w-4 mr-2" />
                    Add Comment
                  </Button>
                </div>
              </div>

              <div className="space-y-3">
                <h4 className="text-sm font-medium">Existing Comments ({selectedDataPoint.comments?.length || 0})</h4>
                <ScrollArea className="max-h-40">
                  {selectedDataPoint.comments && selectedDataPoint.comments.length > 0 ? (
                    <div className="space-y-2">
                      {selectedDataPoint.comments.map((comment) => (
                        <div key={comment.id} className="bg-muted/30 p-2 rounded text-sm">
                          <div className="font-medium text-xs text-muted-foreground mb-1">
                            {comment.user_name} • {format(new Date(comment.created_at), 'MMM dd, HH:mm')}
                          </div>
                          <div>{comment.comment_text}</div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-sm text-muted-foreground text-center py-4">
                      No comments yet. Be the first to comment!
                    </div>
                  )}
                </ScrollArea>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Charts;