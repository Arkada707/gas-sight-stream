import { useState, useEffect } from "react";

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

// Simulated real-time data for demonstration
const generateMockData = (): SensorData => {
  const gasLevel = Math.random() * 100;
  const tankLevel = 60 - (gasLevel * 0.4); // Inverse relationship
  const batteryLevels: ("Full" | "Ok" | "Low")[] = ["Full", "Ok", "Low"];
  const battery = batteryLevels[Math.floor(Math.random() * batteryLevels.length)];
  const connection = Math.floor(70 + Math.random() * 30);

  return {
    id: "C5BAA016-CF65-B806-4E06-0F13B8592C7A",
    titlename: "Gas LPG 15kg Production Tank",
    tanklevel: `${tankLevel.toFixed(1)} cm`,
    updatedrefresh: "just now",
    battery,
    connection: `${connection}%`,
    measurement: `${gasLevel.toFixed(1)}%`
  };
};

export function useSensorData() {
  const [sensorData, setSensorData] = useState<SensorData>(generateMockData());
  const [isConnected, setIsConnected] = useState(true);
  const [lastUpdate, setLastUpdate] = useState(new Date());

  useEffect(() => {
    // Simulate real-time updates every 3 seconds
    const interval = setInterval(() => {
      setSensorData(generateMockData());
      setLastUpdate(new Date());
      
      // Simulate occasional connection issues
      setIsConnected(Math.random() > 0.1);
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  const parsedData = {
    gasLevel: parseFloat(sensorData.measurement.replace('%', '')),
    tankLevel: parseFloat(sensorData.tanklevel.replace(' cm', '')),
    connectionQuality: parseInt(sensorData.connection.replace('%', '')),
    batteryStatus: sensorData.battery,
    deviceName: sensorData.titlename,
    lastUpdated: lastUpdate
  };

  return {
    sensorData,
    parsedData,
    isConnected,
    lastUpdate
  };
}