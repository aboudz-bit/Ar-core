'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';

export default function TokensPage() {
  const [tokens, setTokens] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [name, setName] = useState('');
  const [newToken, setNewToken] = useState('');
  const [creating, setCreating] = useState(false);

  const load = () => {
    setLoading(true);
    api.getTokens()
      .then((res) => setTokens(res.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);
    try {
      const res = await api.createToken({ name, scopesJson: ['viewer', 'analytics'] });
      setNewToken(res.data.rawToken);
      setName('');
      load();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setCreating(false);
    }
  };

  const handleRevoke = async (id: string) => {
    if (!confirm('هل أنت متأكد من إلغاء هذا التوكن؟')) return;
    await api.revokeToken(id);
    load();
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">مفاتيح API</h1>
        <button onClick={() => { setShowCreate(!showCreate); setNewToken(''); }} className="btn-primary">
          + إنشاء مفتاح
        </button>
      </div>

      {newToken && (
        <div className="card mb-6 border-green-300 bg-green-50">
          <p className="font-medium text-green-800 mb-2">تم إنشاء المفتاح بنجاح! انسخه الآن — لن يظهر مرة أخرى.</p>
          <div className="p-3 bg-white rounded-lg border">
            <code className="text-sm break-all select-all" dir="ltr">{newToken}</code>
          </div>
          <button onClick={() => { navigator.clipboard.writeText(newToken); }} className="btn-secondary text-sm mt-2">
            نسخ المفتاح
          </button>
        </div>
      )}

      {showCreate && !newToken && (
        <div className="card mb-6">
          <form onSubmit={handleCreate} className="flex gap-4 items-end">
            <div className="flex-1">
              <label className="label">اسم المفتاح</label>
              <input className="input" value={name} onChange={(e) => setName(e.target.value)} placeholder="مثال: موقع الشركة" required />
            </div>
            <button type="submit" className="btn-primary" disabled={creating}>
              {creating ? 'جاري الإنشاء...' : 'إنشاء'}
            </button>
          </form>
        </div>
      )}

      {loading ? (
        <div className="space-y-3">
          {[1, 2].map((i) => <div key={i} className="h-16 bg-gray-200 rounded-xl animate-pulse"></div>)}
        </div>
      ) : tokens.length === 0 ? (
        <div className="card text-center text-gray-500 py-12">
          لا توجد مفاتيح API بعد
        </div>
      ) : (
        <div className="space-y-3">
          {tokens.map((t: any) => (
            <div key={t.id} className="card flex items-center justify-between">
              <div>
                <h3 className="font-medium">{t.name}</h3>
                <p className="text-sm text-gray-500">
                  أُنشئ في {new Date(t.createdAt).toLocaleDateString('ar-SA')}
                  {t.lastUsedAt && ` — آخر استخدام: ${new Date(t.lastUsedAt).toLocaleDateString('ar-SA')}`}
                </p>
              </div>
              <button onClick={() => handleRevoke(t.id)} className="text-red-500 text-sm hover:text-red-700">
                إلغاء
              </button>
            </div>
          ))}
        </div>
      )}

      <div className="card mt-6">
        <h3 className="font-medium mb-3">استخدام مفتاح API</h3>
        <div className="p-3 bg-gray-50 rounded-lg">
          <code className="text-sm text-gray-600 break-all" dir="ltr">
            {`curl -H "X-Api-Key: arc_YOUR_TOKEN" \\`}<br />
            {`  ${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'}/api/viewer/token \\`}<br />
            {`  -d '{"companySlug":"YOUR_SLUG","sku":"SKU123"}'`}
          </code>
        </div>
      </div>
    </div>
  );
}
