'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { api } from '@/lib/api';

export default function ProductsPage() {
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ sku: '', nameAr: '', nameEn: '' });
  const [creating, setCreating] = useState(false);

  const load = () => {
    setLoading(true);
    api.getProducts()
      .then((res) => setProducts(res.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);
    try {
      await api.createProduct(form);
      setForm({ sku: '', nameAr: '', nameEn: '' });
      setShowCreate(false);
      load();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setCreating(false);
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">المنتجات</h1>
        <button onClick={() => setShowCreate(!showCreate)} className="btn-primary">
          + إضافة منتج
        </button>
      </div>

      {showCreate && (
        <div className="card mb-6">
          <form onSubmit={handleCreate} className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="label">SKU</label>
              <input className="input" value={form.sku} onChange={(e) => setForm({ ...form, sku: e.target.value })} required />
            </div>
            <div>
              <label className="label">الاسم بالعربية</label>
              <input className="input" value={form.nameAr} onChange={(e) => setForm({ ...form, nameAr: e.target.value })} required />
            </div>
            <div>
              <label className="label">الاسم بالإنجليزية</label>
              <input className="input" value={form.nameEn} onChange={(e) => setForm({ ...form, nameEn: e.target.value })} required />
            </div>
            <div className="sm:col-span-3 flex gap-2">
              <button type="submit" className="btn-primary" disabled={creating}>
                {creating ? 'جاري الإنشاء...' : 'إنشاء'}
              </button>
              <button type="button" onClick={() => setShowCreate(false)} className="btn-secondary">إلغاء</button>
            </div>
          </form>
        </div>
      )}

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => <div key={i} className="h-16 bg-gray-200 rounded-xl animate-pulse"></div>)}
        </div>
      ) : products.length === 0 ? (
        <div className="card text-center text-gray-500 py-12">
          لا توجد منتجات بعد. أضف منتجك الأول!
        </div>
      ) : (
        <div className="space-y-3">
          {products.map((p: any) => (
            <Link key={p.id} href={`/dashboard/products/${p.id}`} className="card flex items-center justify-between hover:border-primary-300 transition-colors">
              <div>
                <h3 className="font-medium">{p.nameAr}</h3>
                <p className="text-sm text-gray-500">{p.nameEn} — {p.sku}</p>
              </div>
              <div className="flex items-center gap-3">
                <span className={p.status === 'active' ? 'badge-green' : 'badge-yellow'}>
                  {p.status === 'active' ? 'نشط' : 'غير نشط'}
                </span>
                <span className="text-gray-400">←</span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
