import { usePersonStore } from '@/store/personStore';
import { AlertTriangle } from 'lucide-react';

export default function DeleteConfirm() {
  const deleteId = usePersonStore((s) => s.deleteId);
  const persons = usePersonStore((s) => s.persons);
  const cancelDelete = usePersonStore((s) => s.cancelDelete);
  const deletePerson = usePersonStore((s) => s.deletePerson);

  if (!deleteId) return null;

  const person = persons.find((p) => p.id === deleteId);

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-ink/30 backdrop-blur-sm"
        onClick={cancelDelete}
      />
      <div className="relative bg-white rounded-[20px] shadow-2xl w-full max-w-[360px] p-6 animate-scale-in">
        <div className="flex flex-col items-center text-center">
          <div className="w-14 h-14 rounded-full bg-terracotta/10 flex items-center justify-center mb-4">
            <AlertTriangle size={28} className="text-terracotta" strokeWidth={1.5} />
          </div>
          <h3 className="font-display text-lg font-semibold text-ink mb-2">
            确认删除
          </h3>
          <p className="text-sm text-stone mb-6">
            确定要删除 <span className="font-semibold text-ink">{person?.name}</span> 的人员信息吗？
            <br />
            此操作无法撤销。
          </p>
          <div className="flex gap-3 w-full">
            <button
              onClick={cancelDelete}
              className="flex-1 py-2.5 rounded-full border border-mist text-ink hover:bg-sand transition-colors text-sm font-medium"
            >
              取消
            </button>
            <button
              onClick={() => deletePerson(deleteId)}
              className="flex-1 py-2.5 rounded-full bg-terracotta text-white hover:bg-terracotta/90 hover:shadow-lg hover:shadow-terracotta/20 transition-all text-sm font-medium animate-shake"
            >
              确认删除
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
