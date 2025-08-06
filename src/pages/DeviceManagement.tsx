import React, { useState } from "react";
import { useDeviceData } from "@/hooks/useDeviceData";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Plus, Settings, Trash2, Wifi, WifiOff, Battery, Signal, MapPin, Palette, Edit3 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface AddDeviceFormData {
  id: string;
  name: string;
  title: string;
  location: string;
  macAddress: string;
  color: string;
  enabled: boolean;
}

interface EditDeviceFormData {
  title: string;
  location: string;
  color: string;
  enabled: boolean;
}

export default function DeviceManagement() {
  const {
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
    getConnectedDevices,
    getEnabledDevices,
    refreshDevices,
  } = useDeviceData();

  const { toast } = useToast();
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingDevice, setEditingDevice] = useState<string | null>(null);

  const [addFormData, setAddFormData] = useState<AddDeviceFormData>({
    id: '',
    name: '',
    title: '',
    location: '',
    macAddress: '',
    color: '#22c55e',
    enabled: true
  });

  const [editFormData, setEditFormData] = useState<EditDeviceFormData>({
    title: '',
    location: '',
    color: '#22c55e',
    enabled: true
  });

  const connectedDevices = getConnectedDevices();
  const enabledDevices = getEnabledDevices();

  const handleAddDevice = async () => {
    try {
      const success = await addDevice({
        id: addFormData.id,
        name: addFormData.name,
        mac_address: addFormData.macAddress,
        title: addFormData.title,
        location: addFormData.location,
        color: addFormData.color,
        enabled: addFormData.enabled,
        service_uuid: '0000fff0-0000-1000-8000-00805f9b34fb',
        data_characteristic_uuid: '0000fff1-0000-1000-8000-00805f9b34fb'
      });

      if (success) {
        toast({
          title: "Device Added",
          description: `${addFormData.title} has been added successfully.`,
        });
        setIsAddDialogOpen(false);
        setAddFormData({
          id: '',
          name: '',
          title: '',
          location: '',
          macAddress: '',
          color: '#22c55e',
          enabled: true
        });
      } else {
        throw new Error('Failed to add device');
      }
    } catch (err) {
      toast({
        title: "Error",
        description: "Failed to add device. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleEditDevice = async () => {
    if (!editingDevice) return;

    try {
      const success = await updateDevice(editingDevice, {
        title: editFormData.title,
        location: editFormData.location,
        color: editFormData.color,
        enabled: editFormData.enabled
      });

      if (success) {
        toast({
          title: "Device Updated",
          description: "Device settings have been updated successfully.",
        });
        setIsEditDialogOpen(false);
        setEditingDevice(null);
      } else {
        throw new Error('Failed to update device');
      }
    } catch (err) {
      toast({
        title: "Error",
        description: "Failed to update device. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleDeleteDevice = async (deviceId: string) => {
    try {
      const success = await deleteDevice(deviceId);
      
      if (success) {
        toast({
          title: "Device Deleted",
          description: "Device has been removed successfully.",
        });
      } else {
        throw new Error('Failed to delete device');
      }
    } catch (err) {
      toast({
        title: "Error",
        description: "Failed to delete device. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleToggleEnabled = async (deviceId: string) => {
    try {
      const success = await toggleDeviceEnabled(deviceId);
      
      if (success) {
        const device = devices.find(d => d.id === deviceId);
        toast({
          title: device?.enabled ? "Device Disabled" : "Device Enabled",
          description: `${device?.title} has been ${device?.enabled ? 'disabled' : 'enabled'}.`,
        });
      }
    } catch (err) {
      toast({
        title: "Error",
        description: "Failed to update device status.",
        variant: "destructive",
      });
    }
  };

  const openEditDialog = (deviceId: string) => {
    const device = devices.find(d => d.id === deviceId);
    if (device) {
      setEditingDevice(deviceId);
      setEditFormData({
        title: device.title,
        location: device.location,
        color: device.color,
        enabled: device.enabled
      });
      setIsEditDialogOpen(true);
    }
  };

  const generateDeviceId = () => {
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).substring(2, 8);
    return `device_${timestamp}_${random}`;
  };

  if (isLoading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-lg">Loading devices...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Device Management</h1>
          <p className="text-muted-foreground">
            Manage your Thincke gas sensor devices
          </p>
        </div>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Add Device
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add New Device</DialogTitle>
              <DialogDescription>
                Add a new Thincke gas sensor device to your monitoring system.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="deviceId" className="text-right">ID</Label>
                <Input
                  id="deviceId"
                  placeholder="device_001"
                  className="col-span-3"
                  value={addFormData.id}
                  onChange={(e) => setAddFormData(prev => ({ ...prev, id: e.target.value }))}
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="deviceName" className="text-right">Name</Label>
                <Input
                  id="deviceName"
                  placeholder="@TNK21B3A6"
                  className="col-span-3"
                  value={addFormData.name}
                  onChange={(e) => setAddFormData(prev => ({ ...prev, name: e.target.value }))}
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="deviceTitle" className="text-right">Title</Label>
                <Input
                  id="deviceTitle"
                  placeholder="Gas Tank #1"
                  className="col-span-3"
                  value={addFormData.title}
                  onChange={(e) => setAddFormData(prev => ({ ...prev, title: e.target.value }))}
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="deviceLocation" className="text-right">Location</Label>
                <Input
                  id="deviceLocation"
                  placeholder="Warehouse A"
                  className="col-span-3"
                  value={addFormData.location}
                  onChange={(e) => setAddFormData(prev => ({ ...prev, location: e.target.value }))}
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="macAddress" className="text-right">MAC Address</Label>
                <Input
                  id="macAddress"
                  placeholder="C5:BA:A0:16:CF:65"
                  className="col-span-3"
                  value={addFormData.macAddress}
                  onChange={(e) => setAddFormData(prev => ({ ...prev, macAddress: e.target.value }))}
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="deviceColor" className="text-right">Color</Label>
                <div className="col-span-3 flex items-center gap-2">
                  <Input
                    id="deviceColor"
                    type="color"
                    className="w-12 h-8 p-1 border rounded"
                    value={addFormData.color}
                    onChange={(e) => setAddFormData(prev => ({ ...prev, color: e.target.value }))}
                  />
                  <Input
                    placeholder="#22c55e"
                    className="flex-1"
                    value={addFormData.color}
                    onChange={(e) => setAddFormData(prev => ({ ...prev, color: e.target.value }))}
                  />
                </div>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="deviceEnabled" className="text-right">Enabled</Label>
                <Switch
                  id="deviceEnabled"
                  checked={addFormData.enabled}
                  onCheckedChange={(checked) => setAddFormData(prev => ({ ...prev, enabled: checked }))}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleAddDevice}>Add Device</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Devices</CardTitle>
            <Settings className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{devices.length}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Connected</CardTitle>
            <Wifi className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{connectedDevices.length}</div>
            <p className="text-xs text-muted-foreground">
              of {enabledDevices.length} enabled
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Monitoring</CardTitle>
            <Signal className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{enabledDevices.length}</div>
            <p className="text-xs text-muted-foreground">devices enabled</p>
          </CardContent>
        </Card>
      </div>

      {error && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="pt-6">
            <div className="text-red-800">
              <strong>Error:</strong> {error}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Device List */}
      <Card>
        <CardHeader>
          <CardTitle>Devices</CardTitle>
          <CardDescription>
            Manage your connected Thincke gas sensor devices
          </CardDescription>
        </CardHeader>
        <CardContent>
          {devices.length === 0 ? (
            <div className="text-center py-8">
              <Settings className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">No devices configured</h3>
              <p className="text-muted-foreground mb-4">
                Add your first Thincke gas sensor device to get started
              </p>
              <Button onClick={() => setIsAddDialogOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Add Device
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {devices.map((device) => (
                <Card key={device.id} className={`${selectedDeviceId === device.id ? 'ring-2 ring-blue-500' : ''}`}>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <div 
                          className="w-4 h-4 rounded-full border-2 border-white shadow-md"
                          style={{ backgroundColor: device.color }}
                        />
                        <div>
                          <h3 className="text-lg font-medium">{device.title}</h3>
                          <p className="text-sm text-muted-foreground">
                            {device.name} • {device.macAddress}
                          </p>
                          <div className="flex items-center space-x-4 mt-2">
                            <div className="flex items-center space-x-1 text-sm text-muted-foreground">
                              <MapPin className="h-3 w-3" />
                              <span>{device.location}</span>
                            </div>
                            {device.rssi && (
                              <div className="flex items-center space-x-1 text-sm text-muted-foreground">
                                <Signal className="h-3 w-3" />
                                <span>{device.rssi} dBm</span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center space-x-4">
                        {/* Device Status */}
                        <div className="flex items-center space-x-2">
                          <Badge variant={device.isConnected ? "default" : "secondary"}>
                            {device.isConnected ? (
                              <>
                                <Wifi className="h-3 w-3 mr-1" />
                                Connected
                              </>
                            ) : (
                              <>
                                <WifiOff className="h-3 w-3 mr-1" />
                                Disconnected
                              </>
                            )}
                          </Badge>
                          
                          {device.latestData && (
                            <Badge variant="outline">
                              <Battery className="h-3 w-3 mr-1" />
                              {device.latestData.battery}
                            </Badge>
                          )}
                        </div>

                        {/* Device Controls */}
                        <div className="flex items-center space-x-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => selectDevice(device.id)}
                          >
                            {selectedDeviceId === device.id ? 'Selected' : 'Select'}
                          </Button>
                          
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => openEditDialog(device.id)}
                          >
                            <Edit3 className="h-3 w-3" />
                          </Button>

                          <Switch
                            checked={device.enabled}
                            onCheckedChange={() => handleToggleEnabled(device.id)}
                          />

                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button variant="outline" size="sm" className="text-red-600 hover:text-red-700">
                                <Trash2 className="h-3 w-3" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Delete Device</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Are you sure you want to delete "{device.title}"? 
                                  This action cannot be undone and will also remove all associated sensor data.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction
                                  className="bg-red-600 hover:bg-red-700"
                                  onClick={() => handleDeleteDevice(device.id)}
                                >
                                  Delete
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </div>
                    </div>

                    {/* Latest Data */}
                    {device.latestData && (
                      <>
                        <Separator className="my-4" />
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                          <div>
                            <div className="text-muted-foreground">Gas Level</div>
                            <div className="font-medium">{device.latestData.measurement}{device.latestData.measurementUnit}</div>
                          </div>
                          <div>
                            <div className="text-muted-foreground">Tank Level</div>
                            <div className="font-medium">{device.latestData.tankLevel} {device.latestData.tankLevelUnit}</div>
                          </div>
                          <div>
                            <div className="text-muted-foreground">Connection</div>
                            <div className="font-medium">{device.latestData.connectionStrength}%</div>
                          </div>
                          <div>
                            <div className="text-muted-foreground">Last Reading</div>
                            <div className="font-medium">
                              {new Date(device.latestData.lastUpdated).toLocaleTimeString()}
                            </div>
                          </div>
                        </div>
                      </>
                    )}

                    {/* Statistics */}
                    {(device.totalReadings || 0) > 0 && (
                      <>
                        <Separator className="my-4" />
                        <div className="grid grid-cols-3 gap-4 text-sm">
                          <div>
                            <div className="text-muted-foreground">Total Readings</div>
                            <div className="font-medium">{device.totalReadings?.toLocaleString()}</div>
                          </div>
                          <div>
                            <div className="text-muted-foreground">Last 24h</div>
                            <div className="font-medium">{device.readingsLast24h}</div>
                          </div>
                          <div>
                            <div className="text-muted-foreground">Avg (24h)</div>
                            <div className="font-medium">{device.avgMeasurement24h?.toFixed(1)}%</div>
                          </div>
                        </div>
                      </>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Edit Device Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Device</DialogTitle>
            <DialogDescription>
              Update device settings and configuration.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="editTitle" className="text-right">Title</Label>
              <Input
                id="editTitle"
                className="col-span-3"
                value={editFormData.title}
                onChange={(e) => setEditFormData(prev => ({ ...prev, title: e.target.value }))}
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="editLocation" className="text-right">Location</Label>
              <Input
                id="editLocation"
                className="col-span-3"
                value={editFormData.location}
                onChange={(e) => setEditFormData(prev => ({ ...prev, location: e.target.value }))}
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="editColor" className="text-right">Color</Label>
              <div className="col-span-3 flex items-center gap-2">
                <Input
                  id="editColor"
                  type="color"
                  className="w-12 h-8 p-1 border rounded"
                  value={editFormData.color}
                  onChange={(e) => setEditFormData(prev => ({ ...prev, color: e.target.value }))}
                />
                <Input
                  className="flex-1"
                  value={editFormData.color}
                  onChange={(e) => setEditFormData(prev => ({ ...prev, color: e.target.value }))}
                />
              </div>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="editEnabled" className="text-right">Enabled</Label>
              <Switch
                id="editEnabled"
                checked={editFormData.enabled}
                onCheckedChange={(checked) => setEditFormData(prev => ({ ...prev, enabled: checked }))}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleEditDevice}>Save Changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}