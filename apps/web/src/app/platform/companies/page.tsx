'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';

export default function CompaniesPage() {
  const [companies, setCompanies] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const load = () => {
    setLoading(true);
    api.getPlatformCompanies()
      .then((res) => setCompanies(res.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const handleStatusToggle = async (id: string, currentStatus: string) => {
    const newStatus = currentStatus === 'active' ? 'suspended' : 'active';
    await api.updateCompanyStatus(id, newStatus);
    load();
  };

  if (loading) {
    return <div className="animate-pulse space-y-4"><div className="h-20 bg-gray-200 rounded-xl"></div></div>;
  }

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">إدارة الشركات</h1>

      {companies.length === 0 ? (
        <div className="card text-center text-gray-500 py-12">لا توجد شركات</div>
      ) : (
        <div className="space-y-4">
          {companies.map((c: any) => (
            <div key={c.id} className="card">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <h3 className="font-semibold text-lg">{c.name}</h3>
                  <p className="text-sm text-gray-500">{c.slug} — خطة: {c.plan.nameAr}</p>
                </div>
                <div className="flex items-center gap-3">
                  <span className={c.status === 'active' ? 'badge-green' : 'badge-red'}>
                    {c.status === 'active' ? 'نشط' : 'معلّق'}
                  </span>
                  <button
                    onClick={() => handleStatusToggle(c.id, c.status)}
                    className={c.status === 'active' ? 'btn-danger text-xs' : 'btn-primary text-xs'}
                  >
                    {c.status === 'active' ? 'تعليق' : 'تفعيل'}
                  </button>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4 text-sm text-center">
                <div className="p-2 bg-gray-50 rounded-lg">
                  <span className="font-semibold">{c._count.users}</span>
                  <span className="text-gray-500 block">مستخدمين</span>
                </div>
                <div className="p-2 bg-gray-50 rounded-lg">
                  <span className="font-semibold">{c._count.products}</span>
                  <span className="text-gray-500 block">منتجات</span>
                </div>
                <div className="p-2 bg-gray-50 rounded-lg">
                  <span className="font-semibold">{c._count.sessions}</span>
                  <span className="text-gray-500 block">جلسات</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
