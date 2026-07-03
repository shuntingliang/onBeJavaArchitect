import { create } from 'zustand';
import { Device, DeviceFormData } from '@/types/device';
import { mockDevices } from '@/data/mockData';

interface DeviceStore {
  devices: Device[];
  searchQuery: string;
  currentPage: number;
  pageSize: number;
  addDevice: (data: DeviceFormData) => void;
  updateDevice: (id: string, data: DeviceFormData) => void;
  deleteDevice: (id: string) => void;
  setSearchQuery: (query: string) => void;
  setCurrentPage: (page: number) => void;
}

const generateId = () => {
  const num = Math.floor(Math.random() * 900) + 100;
  return `DEV-${num}`;
};

const now = () => new Date().toISOString();

export const useDeviceStore = create<DeviceStore>((set) => ({
  devices: mockDevices,
  searchQuery: '',
  currentPage: 1,
  pageSize: 8,

  addDevice: (data) =>
    set((state) => ({
      devices: [
        ...state.devices,
        {
          ...data,
          id: generateId(),
          createdAt: now(),
          updatedAt: now(),
        },
      ],
      currentPage: 1,
    })),

  updateDevice: (id, data) =>
    set((state) => ({
      devices: state.devices.map((d) =>
        d.id === id ? { ...d, ...data, updatedAt: now() } : d
      ),
    })),

  deleteDevice: (id) =>
    set((state) => ({
      devices: state.devices.filter((d) => d.id !== id),
    })),

  setSearchQuery: (query) =>
    set({ searchQuery: query, currentPage: 1 }),

  setCurrentPage: (page) =>
    set({ currentPage: page }),
}));
