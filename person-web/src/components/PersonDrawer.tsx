import { usePersonStore } from '@/store/personStore';
import { X, Mail, Phone, Calendar, Briefcase, Building, User } from 'lucide-react';

const statusMap = {
  active: { label: '在职', color: 'bg-sage/10 text-sage border-sage/20' },
  probation: { label: '试用期', color: 'bg-terracotta/10 text-terracotta border-terracotta/20' },
  resigned: { label: '已离职', color: 'bg-stone/10 text-stone border-stone/20' },
};

const gradients = [
  'from-rose-200 to-orange-200',
  'from-sky-200 to-indigo-200',
  'from-emerald-200 to-teal-200',
  'from-violet-200 to-purple-200',
  'from-amber-200 to-yellow-200',
  'from-cyan-200 to-blue-200',
  'from-fuchsia-200 to-pink-200',
  'from-lime-200 to-green-200',
];

export default function PersonDrawer() {
  const isDrawerOpen = usePersonStore((s) => s.isDrawerOpen);
  const selectedPerson = usePersonStore((s) => s.selectedPerson);
  const closeDrawer = usePersonStore((s) => s.closeDrawer);

  if (!isDrawerOpen || !selectedPerson) return null;

  const status = statusMap[selectedPerson.status];
  const gradient = gradients[selectedPerson.name.charCodeAt(0) % gradients.length];
  const initial = selectedPerson.name.charAt(0);

  const infoItems = [
    { icon: User, label: '性别', value: selectedPerson.gender === 'male' ? '男' : '女' },
    { icon: Briefcase, label: '职位', value: selectedPerson.position },
    { icon: Building, label: '部门', value: selectedPerson.department },
    { icon: Phone, label: '手机号', value: selectedPerson.phone },
    { icon: Mail, label: '邮箱', value: selectedPerson.email },
    { icon: Calendar, label: '入职日期', value: selectedPerson.joinDate },
  ];

  return (
    <div className="fixed inset-0 z-50">
      <div
        className="absolute inset-0 bg-ink/20 backdrop-blur-sm"
        onClick={closeDrawer}
      />
      <div className="absolute right-0 top-0 h-full w-full max-w-[400px] bg-white shadow-2xl animate-slide-in-right overflow-y-auto">
        <div className="sticky top-0 bg-white/80 backdrop-blur-md z-10 flex items-center justify-between px-6 py-4 border-b border-mist">
          <h2 className="font-display text-lg font-semibold text-ink">人员详情</h2>
          <button
            onClick={closeDrawer}
            className="p-2 rounded-full hover:bg-sand text-stone hover:text-ink transition-colors"
          >
            <X size={18} strokeWidth={1.5} />
          </button>
        </div>

        <div className="px-6 py-8">
          <div className="flex flex-col items-center mb-8">
            <div
              className={`w-24 h-24 rounded-2xl bg-gradient-to-br ${gradient} flex items-center justify-center text-ink font-display text-3xl font-bold mb-4 select-none`}
            >
              {initial}
            </div>
            <h3 className="font-display text-2xl font-semibold text-ink mb-2">
              {selectedPerson.name}
            </h3>
            <span className={`px-3 py-1 rounded-full text-xs font-medium border ${status.color}`}>
              {status.label}
            </span>
          </div>

          <div className="space-y-4">
            {infoItems.map((item) => (
              <div
                key={item.label}
                className="flex items-center gap-4 p-4 rounded-xl bg-cream/60 border border-mist/40"
              >
                <div className="p-2 rounded-lg bg-white text-ink">
                  <item.icon size={18} strokeWidth={1.5} />
                </div>
                <div>
                  <p className="text-xs text-stone mb-0.5">{item.label}</p>
                  <p className="text-sm font-medium text-ink">{item.value}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
