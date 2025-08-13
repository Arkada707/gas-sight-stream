import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

export interface SensorData {
  id: string;
  titlename: string;
  tanklevel: string;
  updatedrefresh: string;
  battery: string;
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

// Default empty data structure
const getEmptyData = (deviceId?: string): SensorData => {
  return {
    id: deviceId || "",
    titlename: "No data available",
    tanklevel: "0 cm",
    updatedrefresh: "never",
    battery: "Unknown",
    connection: "0%",
    measurement: "0%"
  };
};

export function useSensorData(deviceId?: string) {
  const [sensorData, setSensorData] = useState<SensorData>(getEmptyData(deviceId));
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
            // Keep empty data structure if no real data available
            setSensorData(getEmptyData(deviceId));
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