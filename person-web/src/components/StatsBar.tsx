import { usePersonStore } from '@/store/personStore';
import { Users, UserCheck, Clock, UserX } from 'lucide-react';

export default function StatsBar() {
  const persons = usePersonStore((s) => s.persons);

  const total = persons.length;
  const active = persons.filter((p) => p.status === 'active').length;
  const probation = persons.filter((p) => p.status === 'probation').length;
  const resigned = persons.filter((p) => p.status === 'resigned').length;

  const stats = [
    { label: '总人数', value: total, icon: Users, color: 'text-ink', bg: 'bg-sand' },
    { label: '在职', value: active, icon: UserCheck, color: 'text-sage', bg: 'bg-sage/10' },
    { label: '试用期', value: probation, icon: Clock, color: 'text-terracotta', bg: 'bg-terracotta/10' },
    { label: '已离职', value: resigned, icon: UserX, color: 'text-stone', bg: 'bg-stone/10' },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
      {stats.map((stat) => (
        <div
          key={stat.label}
          className={`${stat.bg} rounded-2xl p-5 flex items-center gap-4 transition-shadow hover:shadow-md`}
        >
          <div className={`p-3 rounded-xl bg-white/60 ${stat.color}`}>
            <stat.icon size={22} strokeWidth={1.5} />
          </div>
          <div>
            <div className={`font-display text-2xl font-semibold ${stat.color}`}>
              {stat.value}
            </div>
            <div className="text-sm text-stone font-medium">{stat.label}</div>
          </div>
        </div>
      ))}
    </div>
  );
}
