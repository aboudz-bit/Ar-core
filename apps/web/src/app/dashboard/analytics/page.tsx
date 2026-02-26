'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';

export default function AnalyticsPage() {
  const [stats, setStats] = useState<any>(null);
  const [sessionsByDay, setSessionsByDay] = useState<any[]>([]);
  const [topProducts, setTopProducts] = useState<any[]>([]);
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.getDashboardStats(),
      api.getSessionsByDay(),
      api.getTopProducts(),
      api.getEventBreakdown(),
    ])
      .then(([s, sd, tp, ev]) => {
        setStats(s.data);
        setSessionsByDay(sd.data);
        setTopProducts(tp.data);
        setEvents(ev.data);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return <div className="animate-pulse space-y-4"><div className="h-32 bg-gray-200 rounded-xl"></div></div>;
  }

  const maxSessions = Math.max(...sessionsByDay.map((d: any) => d.count), 1);

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">التحليلات</h1>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="stat-card">
          <span className="stat-value">{stats?.totalSessions || 0}</span>
          <span className="stat-label">إجمالي الجلسات</span>
        </div>
        <div className="stat-card">
          <span className="stat-value">{stats?.monthlySessions || 0}</span>
          <span className="stat-label">جلسات هذا الشهر</span>
        </div>
        <div className="stat-card">
          <span className="stat-value">{stats?.totalProducts || 0}</span>
          <span className="stat-label">المنتجات</span>
        </div>
        <div className="stat-card">
          <span className="stat-value">{stats?.totalEvents || 0}</span>
          <span className="stat-label">الأحداث</span>
        </div>
      </div>

      {/* Sessions Chart (simple bar chart) */}
      <div className="card mb-6">
        <h3 className="font-medium mb-4">الجلسات اليومية (آخر 30 يوم)</h3>
        {sessionsByDay.length === 0 ? (
          <p className="text-gray-500 text-sm">لا توجد بيانات بعد</p>
        ) : (
          <div className="flex items-end gap-1 h-40">
            {sessionsByDay.map((d: any, i: number) => (
              <div key={i} className="flex-1 flex flex-col items-center gap-1">
                <div
                  className="w-full bg-primary-500 rounded-t min-h-[2px]"
                  style={{ height: `${(d.count / maxSessions) * 100}%` }}
                  title={`${d.date}: ${d.count}`}
                ></div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Products */}
        <div className="card">
          <h3 className="font-medium mb-4">أكثر المنتجات مشاهدة</h3>
          {topProducts.length === 0 ? (
            <p className="text-gray-500 text-sm">لا توجد بيانات</p>
          ) : (
            <div className="space-y-3">
              {topProducts.map((p: any, i: number) => (
                <div key={i} className="flex items-center justify-between">
                  <span className="text-sm">{p.sku}</span>
                  <span className="badge-blue">{p.sessions} جلسة</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Event Breakdown */}
        <div className="card">
          <h3 className="font-medium mb-4">تفصيل الأحداث</h3>
          {events.length === 0 ? (
            <p className="text-gray-500 text-sm">لا توجد أحداث</p>
          ) : (
            <div className="space-y-3">
              {events.map((e: any, i: number) => (
                <div key={i} className="flex items-center justify-between">
                  <span className="text-sm">{e.type}</span>
                  <span className="badge-blue">{e.count}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
