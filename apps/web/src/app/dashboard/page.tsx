'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth';

export default function DashboardPage() {
  const { user } = useAuth();
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getDashboardStats()
      .then((res) => setStats(res.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return <div className="animate-pulse space-y-4"><div className="h-32 bg-gray-200 rounded-xl"></div></div>;
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold">مرحباً، {user?.name}</h1>
        <p className="text-gray-500 mt-1">
          {user?.company?.name} — خطة {user?.company?.plan?.nameAr}
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="stat-card">
          <span className="stat-value">{stats?.totalProducts || 0}</span>
          <span className="stat-label">المنتجات</span>
        </div>
        <div className="stat-card">
          <span className="stat-value">{stats?.monthlySessions || 0}</span>
          <span className="stat-label">جلسات هذا الشهر</span>
        </div>
        <div className="stat-card">
          <span className="stat-value">{stats?.totalSessions || 0}</span>
          <span className="stat-label">إجمالي الجلسات</span>
        </div>
        <div className="stat-card">
          <span className="stat-value">{stats?.usagePercent || 0}%</span>
          <span className="stat-label">نسبة الاستخدام</span>
        </div>
      </div>

      {stats?.monthlyLimit > 0 && (
        <div className="card mb-8">
          <h3 className="font-medium mb-3">استخدام الجلسات الشهرية</h3>
          <div className="w-full bg-gray-200 rounded-full h-3">
            <div
              className={`h-3 rounded-full transition-all ${
                stats.usagePercent > 80 ? 'bg-red-500' : stats.usagePercent > 50 ? 'bg-yellow-500' : 'bg-green-500'
              }`}
              style={{ width: `${Math.min(stats.usagePercent, 100)}%` }}
            ></div>
          </div>
          <p className="text-sm text-gray-500 mt-2">
            {stats.monthlySessions} من {stats.monthlyLimit} جلسة
          </p>
        </div>
      )}

      <div className="card">
        <h3 className="font-medium mb-4">بدء سريع</h3>
        <div className="space-y-3 text-sm">
          <div className="p-3 bg-gray-50 rounded-lg">
            <p className="font-medium mb-1">رابط المشاهد:</p>
            <code className="text-primary-600 text-xs break-all">
              {process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'}/v/{user?.company?.slug}/SKU
            </code>
          </div>
          <div className="p-3 bg-gray-50 rounded-lg">
            <p className="font-medium mb-1">كود التضمين:</p>
            <code className="text-primary-600 text-xs break-all" dir="ltr">
              {`<script src="${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'}/embed.js" data-company="${user?.company?.slug}"></script>`}
              <br />
              {`<div data-ar-sku="YOUR_SKU"></div>`}
            </code>
          </div>
        </div>
      </div>
    </div>
  );
}
