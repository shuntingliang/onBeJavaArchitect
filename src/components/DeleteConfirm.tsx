import { AlertTriangle, X } from 'lucide-react';
import { Device } from '@/types/device';

interface DeleteConfirmProps {
  open: boolean;
  device?: Device | null;
  onConfirm: () => void;
  onCancel: () => void;
}

export default function DeleteConfirm({ open, device, onConfirm, onCancel }: DeleteConfirmProps) {
  if (!open || !device) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm" onClick={onCancel} />
      <div className="relative w-full max-w-sm bg-white rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95">
        <div className="flex items-center justify-between px-5 pt-5">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-10 h-10 rounded-full bg-red-100">
              <AlertTriangle className="w-5 h-5 text-red-500" />
            </div>
            <h3 className="text-base font-bold text-slate-800">确认删除</h3>
          </div>
          <button onClick={onCancel} className="p-1 rounded-md text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="px-5 py-4">
          <p className="text-sm text-slate-600 leading-relaxed">
            确定要删除设备 <span className="font-semibold text-slate-800">「{device.name}」</span> 吗？
          </p>
          <p className="mt-1.5 text-xs text-slate-400">此操作不可撤销，设备数据将被永久移除。</p>
        </div>

        <div className="flex items-center justify-end gap-2 px-5 py-4 border-t border-slate-100 bg-slate-50/50">
          <button onClick={onCancel} className="px-4 py-2 rounded-lg border border-slate-200 bg-white text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors">取消</button>
          <button onClick={onConfirm} className="px-4 py-2 rounded-lg bg-gradient-to-r from-red-500 to-rose-600 text-white text-sm font-semibold shadow-sm shadow-red-500/25 hover:shadow-md transition-all">确认删除</button>
        </div>
      </div>
    </div>
  );
}
