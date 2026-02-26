'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/lib/auth';

const menuItems = [
  { href: '/dashboard', label: 'لوحة التحكم', icon: '📊' },
  { href: '/dashboard/products', label: 'المنتجات', icon: '📦' },
  { href: '/dashboard/tokens', label: 'مفاتيح API', icon: '🔑' },
  { href: '/dashboard/analytics', label: 'التحليلات', icon: '📈' },
  { href: '/dashboard/billing', label: 'الفواتير', icon: '💳' },
  { href: '/dashboard/settings', label: 'الإعدادات', icon: '⚙️' },
];

const platformItems = [
  { href: '/platform', label: 'نظرة عامة', icon: '📊' },
  { href: '/platform/companies', label: 'الشركات', icon: '🏢' },
];

export default function Sidebar() {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const isPlatformAdmin = user?.role === 'platform_admin';
  const items = isPlatformAdmin ? platformItems : menuItems;

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex flex-col w-64 bg-white border-l border-gray-200 min-h-screen">
        <div className="p-6 border-b border-gray-200">
          <h1 className="text-xl font-bold text-primary-600">AR-Core</h1>
          <p className="text-xs text-gray-500 mt-1">منصة الواقع المعزز</p>
        </div>

        <nav className="flex-1 p-4">
          <ul className="space-y-1">
            {items.map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors text-sm ${
                    pathname === item.href
                      ? 'bg-primary-50 text-primary-700 font-medium'
                      : 'text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  <span>{item.icon}</span>
                  <span>{item.label}</span>
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <div className="p-4 border-t border-gray-200">
          <div className="mb-3">
            <p className="text-sm font-medium truncate">{user?.name}</p>
            <p className="text-xs text-gray-500 truncate">{user?.email}</p>
            {user?.company && (
              <p className="text-xs text-primary-600 mt-1">{user.company.name}</p>
            )}
          </div>
          <button onClick={logout} className="w-full btn-secondary text-sm">
            تسجيل الخروج
          </button>
        </div>
      </aside>

      {/* Mobile Bottom Nav */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-50">
        <div className="flex justify-around py-2">
          {items.slice(0, 5).map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center gap-0.5 px-2 py-1 text-xs ${
                pathname === item.href ? 'text-primary-600' : 'text-gray-500'
              }`}
            >
              <span className="text-lg">{item.icon}</span>
              <span>{item.label}</span>
            </Link>
          ))}
        </div>
      </nav>
    </>
  );
}
