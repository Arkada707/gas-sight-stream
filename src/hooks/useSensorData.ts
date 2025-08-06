import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

export interface SensorData {
  id: string;
  titlename: string;
  tanklevel: string;
  updatedrefresh: string;
  battery: "Full" | "Ok" | "Low";
  connection: string;
  measurement: string;
}

export interface TechnicalData {
  _technical: {
    timestamp: string;
    source: string;
    raw_data: {
      hex: string;
      int: number[];
      bytes: number;
    };
    parsed_data: {
      gas_level: number;
      tank_level: number;
      battery_level: number;
    };
    packet_number: number;
  };
}

type SensorDataRow = Database['public']['Tables']['sensor_data']['Row'];

// Transform Supabase data to component format
const transformSupabaseData = (data: SensorDataRow): SensorData => {
  return {
    id: data.device_id,
    titlename: data.title_name,
    tanklevel: `${data.tank_level} ${data.tank_level_unit}`,
    updatedrefresh: data.updated_refresh,
    battery: data.battery,
    connection: `${data.connection_strength}%`,
    measurement: `${data.measurement}${data.measurement_unit}`
  };
};

// Fallback mock data for when no real data is available
const generateMockData = (deviceId?: string): SensorData => {
  const gasLevel = Math.random() * 100;
  const tankLevel = 60 - (gasLevel * 0.4);
  const batteryLevels: ("Full" | "Ok" | "Low")[] = ["Full", "Ok", "Low"];
  const battery = batteryLevels[Math.floor(Math.random() * batteryLevels.length)];
  const connection = Math.floor(70 + Math.random() * 30);

  return {
    id: deviceId || "C5BAA016-CF65-B806-4E06-0F13B8592C7A",
    titlename: "Gas LPG 15kg Production Tank (Mock Data)",
    tanklevel: `${tankLevel.toFixed(1)} cm`,
    updatedrefresh: "just now",
    battery,
    connection: `${connection}%`,
    measurement: `${gasLevel.toFixed(1)}%`
  };
};

export function useSensorData(deviceId?: string) {
  const [sensorData, setSensorData] = useState<SensorData>(generateMockData(deviceId));
  const [isConnected, setIsConnected] = useState(false);
  const [lastUpdate, setLastUpdate] = useState(new Date());
  const [isUsingRealData, setIsUsingRealData] = useState(false);

  useEffect(() => {
    // Function to fetch latest sensor data for specific device or latest overall
    const fetchLatestData = async () => {
      try {
        let query = supabase
          .from('sensor_data')
          .select('*')
          .order('created_at', { ascending: false });

        // Filter by device ID if specified
        if (deviceId) {
          query = query.eq('device_id', deviceId);
        }

        const { data, error } = await query.limit(1).single();

        if (error) {
          console.error('Error fetching sensor data:', error);
          if (!isUsingRealData) {
            // Fall back to mock data if we haven't received real data yet
            setSensorData(generateMockData(deviceId));
          }
          setIsConnected(false);
          return;
        }

        if (data) {
          const transformedData = transformSupabaseData(data);
          setSensorData(transformedData);
          setLastUpdate(new Date(data.updated_at));
          setIsConnected(true);
          setIsUsingRealData(true);
        }
      } catch (err) {
        console.error('Error in fetchLatestData:', err);
        setIsConnected(false);
      }
    };

    // Initial fetch
    fetchLatestData();

    // Set up real-time subscription
    const subscription = supabase
      .channel(`sensor_data_changes_${deviceId || 'all'}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'sensor_data',
          ...(deviceId && { filter: `device_id=eq.${deviceId}` })
        },
        (payload) => {
          console.log('New sensor data received:', payload);
          if (payload.new) {
            const transformedData = transformSupabaseData(payload.new as SensorDataRow);
            setSensorData(transformedData);
            setLastUpdate(new Date(payload.new.updated_at as string));
            setIsConnected(true);
            setIsUsingRealData(true);
          }
        }
      )
      .subscribe();

    // Fallback polling for cases where real-time doesn't work
    const pollInterval = setInterval(fetchLatestData, 5000);

    // Cleanup function
    return () => {
      subscription.unsubscribe();
      clearInterval(pollInterval);
    };
  }, [isUsingRealData, deviceId]);

  const parsedData = {
    gasLevel: parseFloat(sensorData.measurement.replace('%', '')),
    tankLevel: parseFloat(sensorData.tanklevel.replace(/[^\d.]/g, '')),
    connectionQuality: parseInt(sensorData.connection.replace('%', '')),
    batteryStatus: sensorData.battery,
    deviceName: sensorData.titlename,
    lastUpdated: lastUpdate
  };

  return {
    sensorData,
    parsedData,
    isConnected,
    lastUpdate,
    isUsingRealData
  };
}