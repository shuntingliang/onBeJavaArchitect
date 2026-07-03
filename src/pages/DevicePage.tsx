import { useState, useMemo, useCallback } from 'react';
import { Cpu } from 'lucide-react';
import { useDeviceStore } from '@/store/deviceStore';
import { Device } from '@/types/device';
import StatCards from '@/components/StatCards';
import SearchBar from '@/components/SearchBar';
import DeviceTable from '@/components/DeviceTable';
import Pagination from '@/components/Pagination';
import DeviceForm from '@/components/DeviceForm';
import DeleteConfirm from '@/components/DeleteConfirm';

export default function DevicePage() {
  const devices = useDeviceStore((s) => s.devices);
  const searchQuery = useDeviceStore((s) => s.searchQuery);
  const currentPage = useDeviceStore((s) => s.currentPage);
  const pageSize = useDeviceStore((s) => s.pageSize);
  const deleteDevice = useDeviceStore((s) => s.deleteDevice);
  const setCurrentPage = useDeviceStore((s) => s.setCurrentPage);

  const [formOpen, setFormOpen] = useState(false);
  const [editDevice, setEditDevice] = useState<Device | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Device | null>(null);
  const [sortField, setSortField] = useState('id');
  const [sortAsc, setSortAsc] = useState(true);

  const filtered = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return devices;
    return devices.filter(
      (d) =>
        d.name.toLowerCase().includes(q) ||
        d.id.toLowerCase().includes(q) ||
        d.ipAddress.includes(q)
    );
  }, [devices, searchQuery]);

  const sorted = useMemo(() => {
    return [...filtered].sort((a, b) => {
      const av = String((a as unknown as Record<string, unknown>)[sortField] ?? '');
      const bv = String((b as unknown as Record<string, unknown>)[sortField] ?? '');
      const cmp = av.localeCompare(bv, 'zh-CN');
      return sortAsc ? cmp : -cmp;
    });
  }, [filtered, sortField, sortAsc]);

  const totalPages = Math.ceil(sorted.length / pageSize);
  const paged = sorted.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const handleSort = useCallback((field: string) => {
    if (field === sortField) {
      setSortAsc((v) => !v);
    } else {
      setSortField(field);
      setSortAsc(true);
    }
  }, [sortField]);

  const handleAdd = () => {
    setEditDevice(null);
    setFormOpen(true);
  };

  const handleEdit = (device: Device) => {
    setEditDevice(device);
    setFormOpen(true);
  };

  const handleDelete = (device: Device) => {
    setDeleteTarget(device);
  };

  const confirmDelete = () => {
    if (deleteTarget) {
      deleteDevice(deleteTarget.id);
      setDeleteTarget(null);
    }
  };

  const handleRefresh = () => {
    setCurrentPage(1);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-sky-50/30">
      {/* Top Nav */}
      <header className="sticky top-0 z-30 border-b border-slate-200/60 bg-white/80 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-gradient-to-br from-sky-500 to-blue-600 shadow-sm shadow-sky-500/25">
              <Cpu className="w-5 h-5 text-white" />
            </div>
            <h1 className="text-lg font-bold text-slate-800 tracking-tight">设备管理系统</h1>
          </div>
          <div className="text-xs text-slate-400">IoT Device Management</div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {/* Title */}
        <div>
          <h2 className="text-2xl font-bold text-slate-800">设备管理</h2>
          <p className="mt-1 text-sm text-slate-500">管理所有物联网设备的注册、状态和配置信息</p>
        </div>

        {/* Stat Cards */}
        <StatCards />

        {/* Toolbar */}
        <SearchBar onRefresh={handleRefresh} onAdd={handleAdd} />

        {/* Table */}
        <DeviceTable
          devices={paged}
          onEdit={handleEdit}
          onDelete={handleDelete}
          sortField={sortField}
          sortAsc={sortAsc}
          onSort={handleSort}
        />

        {/* Pagination */}
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          total={sorted.length}
          onPageChange={setCurrentPage}
        />
      </main>

      {/* Modals */}
      <DeviceForm open={formOpen} device={editDevice} onClose={() => setFormOpen(false)} />
      <DeleteConfirm open={!!deleteTarget} device={deleteTarget} onConfirm={confirmDelete} onCancel={() => setDeleteTarget(null)} />
    </div>
  );
}
