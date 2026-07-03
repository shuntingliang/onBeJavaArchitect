import { Pencil, Trash2, ChevronUp, ChevronDown } from 'lucide-react';
import { Device } from '@/types/device';
import { formatDate, getStatusColor, getStatusDot, getTypeLabel, getTypeIcon } from '@/utils/helpers';

interface DeviceTableProps {
  devices: Device[];
  onEdit: (device: Device) => void;
  onDelete: (device: Device) => void;
  sortField: string;
  sortAsc: boolean;
  onSort: (field: string) => void;
}

function SortIcon({ field, currentField, asc }: { field: string; currentField: string; asc: boolean }) {
  if (field !== currentField) return <ChevronUp className="w-3 h-3 text-slate-300" />;
  return asc ? <ChevronUp className="w-3 h-3 text-sky-500" /> : <ChevronDown className="w-3 h-3 text-sky-500" />;
}

export default function DeviceTable({ devices, onEdit, onDelete, sortField, sortAsc, onSort }: DeviceTableProps) {
  const columns = [
    { key: 'id', label: '编号', sortable: true },
    { key: 'name', label: '设备名称', sortable: true },
    { key: 'type', label: '类型', sortable: true },
    { key: 'status', label: '状态', sortable: true },
    { key: 'ipAddress', label: 'IP 地址', sortable: true },
    { key: 'location', label: '位置', sortable: false },
    { key: 'updatedAt', label: '更新时间', sortable: true },
  ];

  return (
    <div className="overflow-x-auto rounded-xl border border-slate-200/60 bg-white shadow-sm">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-slate-100 bg-slate-50/80">
            {columns.map(({ key, label, sortable }) => (
              <th
                key={key}
                className={`px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider ${sortable ? 'cursor-pointer select-none hover:text-slate-700' : ''}`}
                onClick={() => sortable && onSort(key)}
              >
                <span className="inline-flex items-center gap-1">
                  {label}
                  {sortable && <SortIcon field={key} currentField={sortField} asc={sortAsc} />}
                </span>
              </th>
            ))}
            <th className="px-4 py-3 text-right text-xs font-semibold text-slate-500 uppercase tracking-wider">操作</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {devices.length === 0 ? (
            <tr>
              <td colSpan={8} className="px-4 py-16 text-center text-slate-400">
                <div className="flex flex-col items-center gap-2">
                  <span className="text-4xl opacity-30">📡</span>
                  <p>暂无设备数据</p>
                </div>
              </td>
            </tr>
          ) : (
            devices.map((device, idx) => (
              <tr
                key={device.id}
                className="group hover:bg-sky-50/40 transition-colors"
                style={{ animationDelay: `${idx * 30}ms` }}
              >
                <td className="px-4 py-3">
                  <span className="font-mono text-xs text-slate-500 bg-slate-100 px-2 py-0.5 rounded">{device.id}</span>
                </td>
                <td className="px-4 py-3 font-medium text-slate-800">
                  <span className="mr-1.5">{getTypeIcon(device.type)}</span>
                  {device.name}
                </td>
                <td className="px-4 py-3 text-slate-600">{getTypeLabel(device.type)}</td>
                <td className="px-4 py-3">
                  <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${getStatusColor(device.status)}`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${getStatusDot(device.status)}`} />
                    {device.status === 'online' ? '在线' : device.status === 'offline' ? '离线' : '维护中'}
                  </span>
                </td>
                <td className="px-4 py-3 font-mono text-xs text-slate-500">{device.ipAddress}</td>
                <td className="px-4 py-3 text-slate-500 text-xs">{device.location || '-'}</td>
                <td className="px-4 py-3 text-slate-500 text-xs">{formatDate(device.updatedAt)}</td>
                <td className="px-4 py-3 text-right">
                  <div className="flex items-center justify-end gap-1 opacity-60 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => onEdit(device)}
                      className="p-1.5 rounded-md text-slate-500 hover:text-sky-600 hover:bg-sky-50 transition-colors"
                      title="编辑"
                    >
                      <Pencil className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => onDelete(device)}
                      className="p-1.5 rounded-md text-slate-500 hover:text-red-600 hover:bg-red-50 transition-colors"
                      title="删除"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
