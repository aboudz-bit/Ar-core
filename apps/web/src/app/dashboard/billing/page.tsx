'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';

export default function BillingPage() {
  const [invoices, setInvoices] = useState<any[]>([]);
  const [usage, setUsage] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([api.getInvoices(), api.getCurrentUsage()])
      .then(([inv, usg]) => {
        setInvoices(inv.data);
        setUsage(usg.data);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return <div className="animate-pulse"><div className="h-48 bg-gray-200 rounded-xl"></div></div>;
  }

  const statusMap: Record<string, { label: string; class: string }> = {
    draft: { label: 'مسودة', class: 'badge-yellow' },
    issued: { label: 'صادرة', class: 'badge-blue' },
    paid: { label: 'مدفوعة', class: 'badge-green' },
    overdue: { label: 'متأخرة', class: 'badge-red' },
  };

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">الفواتير والاستخدام</h1>

      {/* Current Usage */}
      {usage && (
        <div className="card mb-6">
          <h3 className="font-medium mb-3">الاستخدام الحالي — {usage.month}/{usage.year}</h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <span className="stat-value">{usage.sessionsCount}</span>
              <span className="stat-label block">جلسة هذا الشهر</span>
            </div>
            <div>
              <span className="stat-value">{usage.limit > 0 ? usage.limit : '∞'}</span>
              <span className="stat-label block">الحد الأقصى</span>
            </div>
            <div>
              <span className="stat-value">{usage.estimatedAmount.toFixed(2)} ر.س</span>
              <span className="stat-label block">التكلفة التقديرية</span>
            </div>
          </div>
          {usage.limit > 0 && (
            <div className="mt-4">
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="h-2 rounded-full bg-primary-500"
                  style={{ width: `${Math.min((usage.sessionsCount / usage.limit) * 100, 100)}%` }}
                ></div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Invoices */}
      <div className="card">
        <h3 className="font-medium mb-4">الفواتير السابقة</h3>
        {invoices.length === 0 ? (
          <p className="text-gray-500 text-sm">لا توجد فواتير بعد</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="py-3 text-right font-medium text-gray-600">الفترة</th>
                  <th className="py-3 text-right font-medium text-gray-600">الجلسات</th>
                  <th className="py-3 text-right font-medium text-gray-600">المبلغ</th>
                  <th className="py-3 text-right font-medium text-gray-600">الحالة</th>
                </tr>
              </thead>
              <tbody>
                {invoices.map((inv: any) => (
                  <tr key={inv.id} className="border-b border-gray-100">
                    <td className="py-3">{inv.month}/{inv.year}</td>
                    <td className="py-3">{inv.sessionsCount}</td>
                    <td className="py-3">{inv.amountSar.toFixed(2)} ر.س</td>
                    <td className="py-3">
                      <span className={statusMap[inv.status]?.class || 'badge-yellow'}>
                        {statusMap[inv.status]?.label || inv.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
