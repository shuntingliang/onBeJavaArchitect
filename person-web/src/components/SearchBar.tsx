import { Search, ArrowUpDown, Plus } from 'lucide-react';
import { usePersonStore } from '@/store/personStore';

export default function SearchBar() {
  const searchQuery = usePersonStore((s) => s.searchQuery);
  const sortBy = usePersonStore((s) => s.sortBy);
  const setSearchQuery = usePersonStore((s) => s.setSearchQuery);
  const setSortBy = usePersonStore((s) => s.setSortBy);
  const openCreateModal = usePersonStore((s) => s.openCreateModal);

  return (
    <div className="flex flex-col sm:flex-row gap-4 mb-8">
      <div className="relative flex-1">
        <Search
          size={18}
          className="absolute left-4 top-1/2 -translate-y-1/2 text-stone"
          strokeWidth={1.5}
        />
        <input
          type="text"
          placeholder="搜索姓名、职位、部门或手机号..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-11 pr-4 py-3 rounded-full bg-white border border-mist text-ink placeholder:text-stone/60 focus:border-terracotta focus:ring-2 focus:ring-terracotta/20 transition-all text-sm"
        />
      </div>
      <div className="flex gap-3">
        <button
          onClick={() => setSortBy(sortBy === 'joinDate' ? 'name' : 'joinDate')}
          className="flex items-center gap-2 px-5 py-3 rounded-full bg-white border border-mist text-ink hover:border-terracotta hover:text-terracotta transition-colors text-sm font-medium"
        >
          <ArrowUpDown size={16} strokeWidth={1.5} />
          <span className="hidden sm:inline">
            {sortBy === 'joinDate' ? '按入职日期' : '按姓名'}
          </span>
        </button>
        <button
          onClick={openCreateModal}
          className="flex items-center gap-2 px-6 py-3 rounded-full bg-terracotta text-white hover:bg-terracotta/90 hover:shadow-lg hover:shadow-terracotta/20 transition-all text-sm font-medium"
        >
          <Plus size={18} strokeWidth={1.5} />
          新增人员
        </button>
      </div>
    </div>
  );
}
