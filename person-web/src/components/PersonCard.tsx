import { Person } from '@/types/person';
import { usePersonStore } from '@/store/personStore';
import { Eye, Pencil, Trash2 } from 'lucide-react';

interface Props {
  person: Person;
  index: number;
}

const statusMap = {
  active: { label: '在职', color: 'bg-sage/10 text-sage' },
  probation: { label: '试用期', color: 'bg-terracotta/10 text-terracotta' },
  resigned: { label: '已离职', color: 'bg-stone/10 text-stone' },
};

const gradients = [
  'from-rose-100 to-orange-100',
  'from-sky-100 to-indigo-100',
  'from-emerald-100 to-teal-100',
  'from-violet-100 to-purple-100',
  'from-amber-100 to-yellow-100',
  'from-cyan-100 to-blue-100',
  'from-fuchsia-100 to-pink-100',
  'from-lime-100 to-green-100',
];

export default function PersonCard({ person, index }: Props) {
  const openEditModal = usePersonStore((s) => s.openEditModal);
  const openDrawer = usePersonStore((s) => s.openDrawer);
  const confirmDelete = usePersonStore((s) => s.confirmDelete);

  const status = statusMap[person.status];
  const gradient = gradients[index % gradients.length];
  const initial = person.name.charAt(0);

  return (
    <div
      className="bg-white rounded-2xl p-6 shadow-sm border border-mist/50 hover:-translate-y-1 hover:shadow-lg transition-all duration-200 ease-out animate-fade-in-up flex flex-col"
      style={{ animationDelay: `${index * 50}ms` }}
    >
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-4">
          <div
            className={`w-12 h-12 rounded-xl bg-gradient-to-br ${gradient} flex items-center justify-center text-ink font-display text-lg font-semibold select-none`}
          >
            {initial}
          </div>
          <div>
            <h3 className="font-semibold text-ink text-base">{person.name}</h3>
            <span className={`inline-block mt-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${status.color}`}>
              {status.label}
            </span>
          </div>
        </div>
      </div>

      <div className="space-y-2 mb-5 flex-1">
        <div className="flex items-center text-sm text-stone">
          <span className="w-14 shrink-0 text-stone/60">职位</span>
          <span className="text-ink font-medium">{person.position}</span>
        </div>
        <div className="flex items-center text-sm text-stone">
          <span className="w-14 shrink-0 text-stone/60">部门</span>
          <span className="text-ink font-medium">{person.department}</span>
        </div>
        <div className="flex items-center text-sm text-stone">
          <span className="w-14 shrink-0 text-stone/60">手机号</span>
          <span className="text-ink font-medium">{person.phone}</span>
        </div>
        <div className="flex items-center text-sm text-stone">
          <span className="w-14 shrink-0 text-stone/60">入职</span>
          <span className="text-ink font-medium">{person.joinDate}</span>
        </div>
      </div>

      <div className="flex items-center gap-2 pt-4 border-t border-mist/60">
        <button
          onClick={() => openDrawer(person)}
          className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-sm text-ink hover:bg-sand transition-colors"
          title="查看详情"
        >
          <Eye size={16} strokeWidth={1.5} />
          查看
        </button>
        <button
          onClick={() => openEditModal(person)}
          className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-sm text-ink hover:bg-sand transition-colors"
          title="编辑"
        >
          <Pencil size={16} strokeWidth={1.5} />
          编辑
        </button>
        <button
          onClick={() => confirmDelete(person.id)}
          className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-sm text-terracotta hover:bg-terracotta/10 transition-colors"
          title="删除"
        >
          <Trash2 size={16} strokeWidth={1.5} />
          删除
        </button>
      </div>
    </div>
  );
}
