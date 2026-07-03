export type DeviceType = 'sensor' | 'gateway' | 'controller' | 'camera';

export type DeviceStatus = 'online' | 'offline' | 'maintenance';

export interface Device {
  id: string;
  name: string;
  type: DeviceType;
  status: DeviceStatus;
  ipAddress: string;
  location?: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
}

export interface DeviceFormData {
  name: string;
  type: DeviceType;
  status: DeviceStatus;
  ipAddress: string;
  location?: string;
  description?: string;
}

export const deviceTypeLabels: Record<DeviceType, string> = {
  sensor: '传感器',
  gateway: '网关',
  controller: '控制器',
  camera: '摄像头',
};

export const deviceStatusLabels: Record<DeviceStatus, string> = {
  online: '在线',
  offline: '离线',
  maintenance: '维护中',
};

export const deviceTypeOptions = Object.entries(deviceTypeLabels).map(([value, label]) => ({
  value,
  label,
}));

export const deviceStatusOptions = Object.entries(deviceStatusLabels).map(([value, label]) => ({
  value,
  label,
}));
