import { Monitor, Wifi, WifiOff, Wrench } from 'lucide-react';
import { useDeviceStore } from '@/store/deviceStore';

const cards = [
  { key: 'total', label: '设备总数', icon: Monitor, iconColor: 'text-sky-600', barColor: 'from-sky-500 to-blue-600', bg: 'bg-sky-50' },
  { key: 'online', label: '在线设备', icon: Wifi, iconColor: 'text-emerald-600', barColor: 'from-emerald-500 to-green-600', bg: 'bg-emerald-50' },
  { key: 'offline', label: '离线设备', icon: WifiOff, iconColor: 'text-red-600', barColor: 'from-red-500 to-rose-600', bg: 'bg-red-50' },
  { key: 'maintenance', label: '维护中', icon: Wrench, iconColor: 'text-amber-600', barColor: 'from-amber-500 to-orange-600', bg: 'bg-amber-50' },
] as const;

export default function StatCards() {
  const devices = useDeviceStore((s) => s.devices);

  const counts = {
    total: devices.length,
    online: devices.filter((d) => d.status === 'online').length,
    offline: devices.filter((d) => d.status === 'offline').length,
    maintenance: devices.filter((d) => d.status === 'maintenance').length,
  };

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map(({ key, label, icon: Icon, iconColor, barColor, bg }) => (
        <div
          key={key}
          className="relative overflow-hidden rounded-xl border border-slate-200/60 bg-white p-5 shadow-sm transition-all duration-300 hover:shadow-md hover:-translate-y-0.5"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">{label}</p>
              <p className="mt-2 text-3xl font-bold text-slate-800 tracking-tight">{counts[key]}</p>
            </div>
            <div className={`${bg} p-3 rounded-xl`}>
              <Icon className={`w-6 h-6 ${iconColor}`} />
            </div>
          </div>
          <div className={`absolute bottom-0 left-0 h-1 w-full bg-gradient-to-r ${barColor}`} />
        </div>
      ))}
    </div>
  );
}
