import { Search, RotateCw } from 'lucide-react';
import { useDeviceStore } from '@/store/deviceStore';

interface SearchBarProps {
  onRefresh: () => void;
  onAdd: () => void;
}

export default function SearchBar({ onRefresh, onAdd }: SearchBarProps) {
  const searchQuery = useDeviceStore((s) => s.searchQuery);
  const setSearchQuery = useDeviceStore((s) => s.setSearchQuery);

  return (
    <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
      <div className="relative flex-1 max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="搜索设备名称、编号或IP地址..."
          className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-slate-200 bg-white text-sm text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500/30 focus:border-sky-400 transition-all"
        />
      </div>
      <div className="flex gap-2">
        <button
          onClick={onRefresh}
          className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-lg border border-slate-200 bg-white text-sm font-medium text-slate-600 hover:bg-slate-50 hover:border-slate-300 transition-all"
        >
          <RotateCw className="w-4 h-4" />
          刷新
        </button>
        <button
          onClick={onAdd}
          className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-lg bg-gradient-to-r from-sky-500 to-blue-600 text-white text-sm font-semibold shadow-sm shadow-sky-500/25 hover:shadow-md hover:shadow-sky-500/30 hover:-translate-y-px active:translate-y-0 transition-all"
        >
          + 新增设备
        </button>
      </div>
    </div>
  );
}
