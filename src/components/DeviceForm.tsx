import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { Device, DeviceFormData, deviceTypeOptions, deviceStatusOptions } from '@/types/device';
import { useDeviceStore } from '@/store/deviceStore';

interface DeviceFormProps {
  open: boolean;
  device?: Device | null;
  onClose: () => void;
}

const emptyForm: DeviceFormData = {
  name: '',
  type: 'sensor',
  status: 'online',
  ipAddress: '',
  location: '',
  description: '',
};

export default function DeviceForm({ open, device, onClose }: DeviceFormProps) {
  const addDevice = useDeviceStore((s) => s.addDevice);
  const updateDevice = useDeviceStore((s) => s.updateDevice);
  const [form, setForm] = useState<DeviceFormData>(emptyForm);
  const [errors, setErrors] = useState<Partial<Record<keyof DeviceFormData, string>>>({});

  const isEdit = !!device;

  useEffect(() => {
    if (open) {
      setForm(device ? { name: device.name, type: device.type, status: device.status, ipAddress: device.ipAddress, location: device.location || '', description: device.description || '' } : emptyForm);
      setErrors({});
    }
  }, [open, device]);

  const validate = (): boolean => {
    const e: Partial<Record<keyof DeviceFormData, string>> = {};
    if (!form.name.trim()) e.name = '请输入设备名称';
    if (!form.ipAddress.trim()) e.ipAddress = '请输入 IP 地址';
    else if (!/^(\d{1,3}\.){3}\d{1,3}$/.test(form.ipAddress.trim())) e.ipAddress = 'IP 地址格式不正确';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = () => {
    if (!validate()) return;
    const data = { ...form, location: form.location?.trim() || undefined, description: form.description?.trim() || undefined };
    if (isEdit && device) {
      updateDevice(device.id, data);
    } else {
      addDevice(data);
    }
    onClose();
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-gradient-to-r from-sky-50 to-blue-50">
          <h2 className="text-lg font-bold text-slate-800">{isEdit ? '编辑设备' : '新增设备'}</h2>
          <button onClick={onClose} className="p-1.5 rounded-md text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-5 space-y-4 max-h-[70vh] overflow-y-auto">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">设备名称 <span className="text-red-500">*</span></label>
            <input
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className={`w-full px-3 py-2 rounded-lg border text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-sky-500/30 focus:border-sky-400 transition-all ${errors.name ? 'border-red-300 bg-red-50' : 'border-slate-200 bg-white'}`}
              placeholder="请输入设备名称"
            />
            {errors.name && <p className="mt-1 text-xs text-red-500">{errors.name}</p>}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">设备类型 <span className="text-red-500">*</span></label>
              <select
                value={form.type}
                onChange={(e) => setForm({ ...form, type: e.target.value as DeviceFormData['type'] })}
                className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-white text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-sky-500/30 focus:border-sky-400 transition-all"
              >
                {deviceTypeOptions.map((o) => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">设备状态 <span className="text-red-500">*</span></label>
              <select
                value={form.status}
                onChange={(e) => setForm({ ...form, status: e.target.value as DeviceFormData['status'] })}
                className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-white text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-sky-500/30 focus:border-sky-400 transition-all"
              >
                {deviceStatusOptions.map((o) => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">IP 地址 <span className="text-red-500">*</span></label>
            <input
              value={form.ipAddress}
              onChange={(e) => setForm({ ...form, ipAddress: e.target.value })}
              className={`w-full px-3 py-2 rounded-lg border text-sm text-slate-700 font-mono focus:outline-none focus:ring-2 focus:ring-sky-500/30 focus:border-sky-400 transition-all ${errors.ipAddress ? 'border-red-300 bg-red-50' : 'border-slate-200 bg-white'}`}
              placeholder="192.168.1.100"
            />
            {errors.ipAddress && <p className="mt-1 text-xs text-red-500">{errors.ipAddress}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">安装位置</label>
            <input
              value={form.location}
              onChange={(e) => setForm({ ...form, location: e.target.value })}
              className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-white text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-sky-500/30 focus:border-sky-400 transition-all"
              placeholder="如：A区-1楼-车间"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">备注描述</label>
            <textarea
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              rows={3}
              className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-white text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-sky-500/30 focus:border-sky-400 transition-all resize-none"
              placeholder="设备用途、规格等备注信息"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-slate-100 bg-slate-50/50">
          <button onClick={onClose} className="px-4 py-2 rounded-lg border border-slate-200 bg-white text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors">取消</button>
          <button onClick={handleSubmit} className="px-6 py-2 rounded-lg bg-gradient-to-r from-sky-500 to-blue-600 text-white text-sm font-semibold shadow-sm shadow-sky-500/25 hover:shadow-md transition-all">
            {isEdit ? '保存修改' : '确认添加'}
          </button>
        </div>
      </div>
    </div>
  );
}
