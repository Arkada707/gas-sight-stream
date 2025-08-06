import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

// Types from database
type DeviceRow = Database['public']['Tables']['devices']['Row'];
type DeviceStatsRow = Database['public']['Views']['device_stats']['Row'];
type SensorDataRow = Database['public']['Tables']['sensor_data']['Row'];

export interface Device {
  id: string;
  name: string;
  title: string;
  location: string;
  color: string;
  enabled: boolean;
  isConnected: boolean;
  lastConnected?: string;
  macAddress: string;
  serviceUuid: string;
  dataCharacteristicUuid: string;
  // Discovery metadata
  rssi?: number;
  confidenceScore?: number;
  lastDiscovered?: string;
  // Connection stats
  connectionAttempts: number;
  totalPacketsReceived: number;
  // Latest sensor data
  latestData?: {
    tankLevel: number;
    tankLevelUnit: string;
    measurement: number;
    measurementUnit: string;
    battery: "Full" | "Ok" | "Low";
    connectionStrength: number;
    lastUpdated: string;
  };
  // Statistics
  totalReadings?: number;
  readingsLast24h?: number;
  avgMeasurement24h?: number;
}

export interface DeviceManagementHook {
  devices: Device[];
  selectedDeviceId: string | null;
  selectedDevice: Device | null;
  isLoading: boolean;
  error: string | null;
  // Device management
  selectDevice: (deviceId: string) => void;
  addDevice: (deviceData: Partial<DeviceRow>) => Promise<boolean>;
  updateDevice: (deviceId: string, updates: Partial<DeviceRow>) => Promise<boolean>;
  deleteDevice: (deviceId: string) => Promise<boolean>;
  toggleDeviceEnabled: (deviceId: string) => Promise<boolean>;
  // Device statistics
  getDeviceStats: (deviceId: string) => Device | null;
  getConnectedDevices: () => Device[];
  getEnabledDevices: () => Device[];
  refreshDevices: () => Promise<void>;
}

// Transform device stats view to Device interface
const transformDeviceStats = (stats: DeviceStatsRow): Device => ({
  id: stats.id,
  name: stats.name,
  title: stats.title,
  location: stats.location,
  color: stats.color,
  enabled: stats.enabled,
  isConnected: stats.is_connected,
  lastConnected: stats.last_connected || undefined,
  macAddress: '', // Will be filled from devices table
  serviceUuid: '', // Will be filled from devices table  
  dataCharacteristicUuid: '', // Will be filled from devices table
  connectionAttempts: 0, // Will be filled from devices table
  totalPacketsReceived: stats.total_packets_received,
  latestData: stats.latest_tank_level !== null ? {
    tankLevel: stats.latest_tank_level,
    tankLevelUnit: stats.tank_level_unit || 'cm',
    measurement: stats.latest_measurement || 0,
    measurementUnit: stats.measurement_unit || '%',
    battery: stats.latest_battery || 'Ok',
    connectionStrength: stats.latest_connection_strength || 0,
    lastUpdated: stats.latest_reading_at || new Date().toISOString(),
  } : undefined,
  totalReadings: stats.total_readings || 0,
  readingsLast24h: stats.readings_last_24h || 0,
  avgMeasurement24h: stats.avg_measurement_24h || 0,
});

// Transform device row to Device interface
const transformDevice = (device: DeviceRow): Partial<Device> => ({
  id: device.id,
  name: device.name,
  title: device.title,
  location: device.location,
  color: device.color,
  enabled: device.enabled,
  isConnected: device.is_connected,
  lastConnected: device.last_connected || undefined,
  macAddress: device.mac_address,
  serviceUuid: device.service_uuid,
  dataCharacteristicUuid: device.data_characteristic_uuid,
  rssi: device.rssi || undefined,
  confidenceScore: device.confidence_score || undefined,
  lastDiscovered: device.last_discovered || undefined,
  connectionAttempts: device.connection_attempts,
  totalPacketsReceived: device.total_packets_received,
});

export function useDeviceData(): DeviceManagementHook {
  const [devices, setDevices] = useState<Device[]>([]);
  const [selectedDeviceId, setSelectedDeviceId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch devices with their statistics
  const fetchDevices = async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Fetch devices from device_stats view for comprehensive data
      const { data: deviceStats, error: statsError } = await supabase
        .from('device_stats')
        .select('*')
        .order('device_created_at', { ascending: false });

      if (statsError) {
        throw new Error(`Error fetching device stats: ${statsError.message}`);
      }

      // Fetch detailed device info to fill in missing fields
      const { data: deviceDetails, error: detailsError } = await supabase
        .from('devices')
        .select('*');

      if (detailsError) {
        throw new Error(`Error fetching device details: ${detailsError.message}`);
      }

      // Combine stats with detailed device info
      const combinedDevices: Device[] = (deviceStats || []).map(stats => {
        const device = transformDeviceStats(stats);
        const details = deviceDetails?.find(d => d.id === stats.id);
        
        if (details) {
          const deviceInfo = transformDevice(details);
          return { ...device, ...deviceInfo };
        }
        
        return device;
      });

      setDevices(combinedDevices);

      // Auto-select first device if none selected
      if (!selectedDeviceId && combinedDevices.length > 0) {
        setSelectedDeviceId(combinedDevices[0].id);
      }

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      setError(errorMessage);
      console.error('Error fetching devices:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // Initial load
  useEffect(() => {
    fetchDevices();
  }, []);

  // Set up real-time subscriptions
  useEffect(() => {
    // Subscribe to device changes
    const deviceSubscription = supabase
      .channel('device_changes')
      .on(
        'postgres_changes',
        {
          event: '*', // All events (INSERT, UPDATE, DELETE)
          schema: 'public',
          table: 'devices'
        },
        () => {
          // Refresh devices when any device changes
          fetchDevices();
        }
      )
      .subscribe();

    // Subscribe to sensor data changes to update latest readings
    const sensorSubscription = supabase
      .channel('sensor_data_changes')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'sensor_data'
        },
        () => {
          // Refresh devices to get updated latest readings
          fetchDevices();
        }
      )
      .subscribe();

    return () => {
      deviceSubscription.unsubscribe();
      sensorSubscription.unsubscribe();
    };
  }, []);

  // Device management functions
  const selectDevice = (deviceId: string) => {
    setSelectedDeviceId(deviceId);
  };

  const addDevice = async (deviceData: Partial<DeviceRow>): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('devices')
        .insert([deviceData as DeviceRow]);

      if (error) {
        throw new Error(`Error adding device: ${error.message}`);
      }

      await fetchDevices(); // Refresh the list
      return true;
    } catch (err) {
      console.error('Error adding device:', err);
      setError(err instanceof Error ? err.message : 'Failed to add device');
      return false;
    }
  };

  const updateDevice = async (deviceId: string, updates: Partial<DeviceRow>): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('devices')
        .update(updates)
        .eq('id', deviceId);

      if (error) {
        throw new Error(`Error updating device: ${error.message}`);
      }

      await fetchDevices(); // Refresh the list
      return true;
    } catch (err) {
      console.error('Error updating device:', err);
      setError(err instanceof Error ? err.message : 'Failed to update device');
      return false;
    }
  };

  const deleteDevice = async (deviceId: string): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('devices')
        .delete()
        .eq('id', deviceId);

      if (error) {
        throw new Error(`Error deleting device: ${error.message}`);
      }

      // Clear selection if deleted device was selected
      if (selectedDeviceId === deviceId) {
        setSelectedDeviceId(null);
      }

      await fetchDevices(); // Refresh the list
      return true;
    } catch (err) {
      console.error('Error deleting device:', err);
      setError(err instanceof Error ? err.message : 'Failed to delete device');
      return false;
    }
  };

  const toggleDeviceEnabled = async (deviceId: string): Promise<boolean> => {
    const device = devices.find(d => d.id === deviceId);
    if (!device) return false;

    return await updateDevice(deviceId, { enabled: !device.enabled });
  };

  // Utility functions
  const getDeviceStats = (deviceId: string): Device | null => {
    return devices.find(d => d.id === deviceId) || null;
  };

  const getConnectedDevices = (): Device[] => {
    return devices.filter(d => d.isConnected);
  };

  const getEnabledDevices = (): Device[] => {
    return devices.filter(d => d.enabled);
  };

  const refreshDevices = async (): Promise<void> => {
    await fetchDevices();
  };

  // Get selected device
  const selectedDevice = selectedDeviceId ? 
    devices.find(d => d.id === selectedDeviceId) || null : null;

  return {
    devices,
    selectedDeviceId,
    selectedDevice,
    isLoading,
    error,
    selectDevice,
    addDevice,
    updateDevice,
    deleteDevice,
    toggleDeviceEnabled,
    getDeviceStats,
    getConnectedDevices,
    getEnabledDevices,
    refreshDevices,
  };
}