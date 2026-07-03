import { DeviceStatus, DeviceType, deviceTypeLabels, deviceStatusLabels } from '@/types/device';

export function formatDate(iso: string): string {
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function getTypeLabel(type: DeviceType): string {
  return deviceTypeLabels[type] ?? type;
}

export function getStatusLabel(status: DeviceStatus): string {
  return deviceStatusLabels[status] ?? status;
}

export function getStatusColor(status: DeviceStatus): string {
  switch (status) {
    case 'online':
      return 'bg-emerald-100 text-emerald-700 border-emerald-200';
    case 'offline':
      return 'bg-red-100 text-red-700 border-red-200';
    case 'maintenance':
      return 'bg-amber-100 text-amber-700 border-amber-200';
  }
}

export function getStatusDot(status: DeviceStatus): string {
  switch (status) {
    case 'online':
      return 'bg-emerald-500';
    case 'offline':
      return 'bg-red-500';
    case 'maintenance':
      return 'bg-amber-500';
  }
}

export function getTypeIcon(type: DeviceType): string {
  switch (type) {
    case 'sensor':
      return '🌡';
    case 'gateway':
      return '📡';
    case 'controller':
      return '⚙';
    case 'camera':
      return '📷';
  }
}
