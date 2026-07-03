import { useMemo } from 'react';
import { usePersonStore } from '@/store/personStore';
import StatsBar from '@/components/StatsBar';
import SearchBar from '@/components/SearchBar';
import PersonCard from '@/components/PersonCard';
import PersonModal from '@/components/PersonModal';
import PersonDrawer from '@/components/PersonDrawer';
import DeleteConfirm from '@/components/DeleteConfirm';
import { Users } from 'lucide-react';

export default function Home() {
  const persons = usePersonStore((s) => s.persons);
  const searchQuery = usePersonStore((s) => s.searchQuery);
  const sortBy = usePersonStore((s) => s.sortBy);

  const filteredPersons = useMemo(() => {
    let result = [...persons];

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.position.toLowerCase().includes(q) ||
          p.department.toLowerCase().includes(q) ||
          p.phone.includes(q)
      );
    }

    result.sort((a, b) => {
      if (sortBy === 'name') {
        return a.name.localeCompare(b.name, 'zh-CN');
      }
      return new Date(b.joinDate).getTime() - new Date(a.joinDate).getTime();
    });

    return result;
  }, [persons, searchQuery, sortBy]);

  return (
    <div className="min-h-screen bg-cream">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        <header className="flex items-center justify-between mb-10">
          <div>
            <h1 className="font-display text-3xl sm:text-4xl font-bold text-ink mb-2">
              人员管理
            </h1>
            <p className="text-stone text-sm">
              管理团队人员信息，支持增删改查操作
            </p>
          </div>
          <div className="hidden sm:flex items-center gap-2 px-4 py-2 rounded-full bg-white border border-mist text-sm text-stone">
            <Users size={16} strokeWidth={1.5} />
            <span>{persons.length} 人</span>
          </div>
        </header>

        <StatsBar />
        <SearchBar />

        {filteredPersons.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-stone">
            <Users size={48} strokeWidth={1} className="mb-4 opacity-40" />
            <p className="text-base font-medium">暂无人员数据</p>
            <p className="text-sm mt-1 opacity-60">
              {searchQuery ? '没有找到匹配的结果' : '点击右上角新增人员按钮添加第一位成员'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredPersons.map((person, index) => (
              <PersonCard key={person.id} person={person} index={index} />
            ))}
          </div>
        )}
      </div>

      <PersonModal />
      <PersonDrawer />
      <DeleteConfirm />
    </div>
  );
}
