'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth';

export default function SettingsPage() {
  const { user, refresh } = useAuth();
  const [company, setCompany] = useState<any>(null);
  const [name, setName] = useState('');
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    api.getCompany()
      .then((res) => {
        setCompany(res.data);
        setName(res.data.name);
      })
      .catch(() => {});
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage('');
    try {
      await api.updateCompany({ name });
      setMessage('تم حفظ التغييرات');
      refresh();
    } catch (err: any) {
      setMessage(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">الإعدادات</h1>

      <div className="card mb-6">
        <h3 className="font-medium mb-4">معلومات الشركة</h3>
        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <label className="label">اسم الشركة</label>
            <input className="input" value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div>
            <label className="label">الرابط (Slug)</label>
            <input className="input bg-gray-50" value={company?.slug || ''} disabled />
          </div>
          <div>
            <label className="label">الخطة الحالية</label>
            <input className="input bg-gray-50" value={company?.plan?.nameAr || ''} disabled />
          </div>
          <div>
            <label className="label">الحالة</label>
            <input className="input bg-gray-50" value={company?.status === 'active' ? 'نشط' : company?.status || ''} disabled />
          </div>

          {message && (
            <p className={`text-sm ${message.includes('تم') ? 'text-green-600' : 'text-red-600'}`}>{message}</p>
          )}

          <button type="submit" className="btn-primary" disabled={saving}>
            {saving ? 'جاري الحفظ...' : 'حفظ التغييرات'}
          </button>
        </form>
      </div>

      <div className="card">
        <h3 className="font-medium mb-4">معلومات الحساب</h3>
        <div className="space-y-3 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-500">الاسم</span>
            <span>{user?.name}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">البريد الإلكتروني</span>
            <span>{user?.email}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">الدور</span>
            <span>{user?.role === 'company_owner' ? 'مالك الشركة' : user?.role === 'company_admin' ? 'مدير' : 'موظف'}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
