import { useEffect, useState } from 'react';
import { Person, Gender, Status } from '@/types/person';
import { usePersonStore } from '@/store/personStore';
import { X, AlertCircle } from 'lucide-react';

const emptyForm: Omit<Person, 'id'> = {
  name: '',
  gender: 'male',
  position: '',
  department: '',
  phone: '',
  email: '',
  joinDate: '',
  status: 'active',
};

export default function PersonModal() {
  const isModalOpen = usePersonStore((s) => s.isModalOpen);
  const modalMode = usePersonStore((s) => s.modalMode);
  const selectedPerson = usePersonStore((s) => s.selectedPerson);
  const closeModal = usePersonStore((s) => s.closeModal);
  const addPerson = usePersonStore((s) => s.addPerson);
  const updatePerson = usePersonStore((s) => s.updatePerson);

  const [form, setForm] = useState<Omit<Person, 'id'>>(emptyForm);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (isModalOpen) {
      if (modalMode === 'edit' && selectedPerson) {
        setForm({
          name: selectedPerson.name,
          gender: selectedPerson.gender,
          position: selectedPerson.position,
          department: selectedPerson.department,
          phone: selectedPerson.phone,
          email: selectedPerson.email,
          joinDate: selectedPerson.joinDate,
          status: selectedPerson.status,
        });
      } else {
        setForm(emptyForm);
      }
      setErrors({});
    }
  }, [isModalOpen, modalMode, selectedPerson]);

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};
    if (!form.name.trim()) newErrors.name = '请输入姓名';
    if (!form.position.trim()) newErrors.position = '请输入职位';
    if (!form.department.trim()) newErrors.department = '请输入部门';
    if (!form.phone.trim()) {
      newErrors.phone = '请输入手机号';
    } else if (!/^1[3-9]\d{9}$/.test(form.phone)) {
      newErrors.phone = '手机号格式不正确';
    }
    if (!form.email.trim()) {
      newErrors.email = '请输入邮箱';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      newErrors.email = '邮箱格式不正确';
    }
    if (!form.joinDate) newErrors.joinDate = '请选择入职日期';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    if (modalMode === 'edit' && selectedPerson) {
      updatePerson(selectedPerson.id, form);
    } else {
      addPerson(form);
    }
    closeModal();
  };

  const handleChange = (field: keyof Omit<Person, 'id'>, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[field];
        return next;
      });
    }
  };

  if (!isModalOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-ink/30 backdrop-blur-sm"
        onClick={closeModal}
      />
      <div className="relative bg-white rounded-[20px] shadow-2xl w-full max-w-[480px] max-h-[90vh] overflow-y-auto animate-scale-in">
        <div className="flex items-center justify-between px-6 py-5 border-b border-mist">
          <h2 className="font-display text-xl font-semibold text-ink">
            {modalMode === 'create' ? '新增人员' : '编辑人员'}
          </h2>
          <button
            onClick={closeModal}
            className="p-2 rounded-full hover:bg-sand text-stone hover:text-ink transition-colors"
          >
            <X size={18} strokeWidth={1.5} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
          <div>
            <label className="block text-sm font-medium text-ink mb-1.5">
              姓名 <span className="text-terracotta">*</span>
            </label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => handleChange('name', e.target.value)}
              className={`w-full px-4 py-2.5 rounded-xl border bg-cream/50 text-sm transition-all ${
                errors.name ? 'border-terracotta' : 'border-mist'
              }`}
              placeholder="请输入姓名"
            />
            {errors.name && (
              <p className="mt-1 text-xs text-terracotta flex items-center gap-1">
                <AlertCircle size={12} />
                {errors.name}
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-ink mb-1.5">性别</label>
            <div className="flex gap-3">
              {(['male', 'female'] as Gender[]).map((g) => (
                <button
                  key={g}
                  type="button"
                  onClick={() => handleChange('gender', g)}
                  className={`flex-1 py-2.5 rounded-xl text-sm font-medium border transition-all ${
                    form.gender === g
                      ? 'bg-ink text-white border-ink'
                      : 'bg-white text-stone border-mist hover:border-ink'
                  }`}
                >
                  {g === 'male' ? '男' : '女'}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-ink mb-1.5">
                职位 <span className="text-terracotta">*</span>
              </label>
              <input
                type="text"
                value={form.position}
                onChange={(e) => handleChange('position', e.target.value)}
                className={`w-full px-4 py-2.5 rounded-xl border bg-cream/50 text-sm transition-all ${
                  errors.position ? 'border-terracotta' : 'border-mist'
                }`}
                placeholder="请输入职位"
              />
              {errors.position && (
                <p className="mt-1 text-xs text-terracotta flex items-center gap-1">
                  <AlertCircle size={12} />
                  {errors.position}
                </p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-ink mb-1.5">
                部门 <span className="text-terracotta">*</span>
              </label>
              <input
                type="text"
                value={form.department}
                onChange={(e) => handleChange('department', e.target.value)}
                className={`w-full px-4 py-2.5 rounded-xl border bg-cream/50 text-sm transition-all ${
                  errors.department ? 'border-terracotta' : 'border-mist'
                }`}
                placeholder="请输入部门"
              />
              {errors.department && (
                <p className="mt-1 text-xs text-terracotta flex items-center gap-1">
                  <AlertCircle size={12} />
                  {errors.department}
                </p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-ink mb-1.5">
                手机号 <span className="text-terracotta">*</span>
              </label>
              <input
                type="tel"
                value={form.phone}
                onChange={(e) => handleChange('phone', e.target.value)}
                className={`w-full px-4 py-2.5 rounded-xl border bg-cream/50 text-sm transition-all ${
                  errors.phone ? 'border-terracotta' : 'border-mist'
                }`}
                placeholder="11位手机号"
              />
              {errors.phone && (
                <p className="mt-1 text-xs text-terracotta flex items-center gap-1">
                  <AlertCircle size={12} />
                  {errors.phone}
                </p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-ink mb-1.5">
                邮箱 <span className="text-terracotta">*</span>
              </label>
              <input
                type="email"
                value={form.email}
                onChange={(e) => handleChange('email', e.target.value)}
                className={`w-full px-4 py-2.5 rounded-xl border bg-cream/50 text-sm transition-all ${
                  errors.email ? 'border-terracotta' : 'border-mist'
                }`}
                placeholder="example@mail.com"
              />
              {errors.email && (
                <p className="mt-1 text-xs text-terracotta flex items-center gap-1">
                  <AlertCircle size={12} />
                  {errors.email}
                </p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-ink mb-1.5">
                入职日期 <span className="text-terracotta">*</span>
              </label>
              <input
                type="date"
                value={form.joinDate}
                onChange={(e) => handleChange('joinDate', e.target.value)}
                className={`w-full px-4 py-2.5 rounded-xl border bg-cream/50 text-sm transition-all ${
                  errors.joinDate ? 'border-terracotta' : 'border-mist'
                }`}
              />
              {errors.joinDate && (
                <p className="mt-1 text-xs text-terracotta flex items-center gap-1">
                  <AlertCircle size={12} />
                  {errors.joinDate}
                </p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-ink mb-1.5">状态</label>
              <select
                value={form.status}
                onChange={(e) => handleChange('status', e.target.value as Status)}
                className="w-full px-4 py-2.5 rounded-xl border border-mist bg-cream/50 text-sm transition-all"
              >
                <option value="active">在职</option>
                <option value="probation">试用期</option>
                <option value="resigned">已离职</option>
              </select>
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={closeModal}
              className="flex-1 py-2.5 rounded-full border border-mist text-ink hover:bg-sand transition-colors text-sm font-medium"
            >
              取消
            </button>
            <button
              type="submit"
              className="flex-1 py-2.5 rounded-full bg-terracotta text-white hover:bg-terracotta/90 hover:shadow-lg hover:shadow-terracotta/20 transition-all text-sm font-medium"
            >
              {modalMode === 'create' ? '保存' : '更新'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
