'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';

export default function PlatformPage() {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getPlatformStats()
      .then((res) => setStats(res.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return <div className="animate-pulse"><div className="h-32 bg-gray-200 rounded-xl"></div></div>;
  }

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">لوحة تحكم المنصة</h1>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="stat-card">
          <span className="stat-value">{stats?.companies || 0}</span>
          <span className="stat-label">الشركات</span>
        </div>
        <div className="stat-card">
          <span className="stat-value">{stats?.users || 0}</span>
          <span className="stat-label">المستخدمين</span>
        </div>
        <div className="stat-card">
          <span className="stat-value">{stats?.products || 0}</span>
          <span className="stat-label">المنتجات</span>
        </div>
        <div className="stat-card">
          <span className="stat-value">{stats?.sessions || 0}</span>
          <span className="stat-label">الجلسات</span>
        </div>
      </div>
    </div>
  );
}
