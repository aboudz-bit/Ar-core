'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth';

export default function ProductDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const [product, setProduct] = useState<any>(null);
  const [configs, setConfigs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);

  const productId = params.id as string;

  const load = async () => {
    try {
      const [pRes, cRes] = await Promise.all([
        api.getProduct(productId),
        api.getProductConfig(productId),
      ]);
      setProduct(pRes.data);
      setConfigs(cRes.data);
    } catch {
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [productId]);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>, type: string) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      await api.uploadAsset(productId, type, file);
      load();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('هل أنت متأكد من حذف هذا المنتج؟')) return;
    try {
      await api.deleteProduct(productId);
      router.push('/dashboard/products');
    } catch (err: any) {
      alert(err.message);
    }
  };

  if (loading) {
    return <div className="animate-pulse"><div className="h-48 bg-gray-200 rounded-xl"></div></div>;
  }

  if (!product) {
    return <div className="card text-center text-gray-500 py-12">المنتج غير موجود</div>;
  }

  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <button onClick={() => router.back()} className="text-sm text-gray-500 hover:text-gray-700 mb-2">→ الرجوع</button>
          <h1 className="text-2xl font-bold">{product.nameAr}</h1>
          <p className="text-gray-500">{product.nameEn} — SKU: {product.sku}</p>
        </div>
        <div className="flex gap-2">
          <span className={product.status === 'active' ? 'badge-green' : 'badge-yellow'}>
            {product.status === 'active' ? 'نشط' : 'غير نشط'}
          </span>
        </div>
      </div>

      {/* Viewer Link */}
      <div className="card mb-6">
        <h3 className="font-medium mb-3">رابط المشاهد</h3>
        <div className="p-3 bg-gray-50 rounded-lg">
          <code className="text-primary-600 text-sm break-all">
            {apiUrl}/v/{user?.company?.slug}/{product.sku}
          </code>
        </div>
        <div className="mt-3 p-3 bg-gray-50 rounded-lg">
          <p className="text-sm font-medium mb-1">كود التضمين:</p>
          <code className="text-xs text-gray-600 break-all" dir="ltr">
            {`<script src="${apiUrl}/embed.js" data-company="${user?.company?.slug}"></script>`}<br />
            {`<div data-ar-sku="${product.sku}"></div>`}
          </code>
        </div>
      </div>

      {/* Assets */}
      <div className="card mb-6">
        <h3 className="font-medium mb-4">ملفات 3D</h3>
        {product.assets?.length > 0 ? (
          <div className="space-y-2 mb-4">
            {product.assets.map((a: any) => (
              <div key={a.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div>
                  <span className="badge-blue">{a.type}</span>
                  <span className="text-sm text-gray-500 mr-2">{(a.sizeBytes / 1024 / 1024).toFixed(2)} MB</span>
                </div>
                <button
                  onClick={async () => { await api.deleteAsset(a.id); load(); }}
                  className="text-red-500 text-sm hover:text-red-700"
                >
                  حذف
                </button>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-500 text-sm mb-4">لا توجد ملفات مرفوعة</p>
        )}
        <div className="flex flex-wrap gap-3">
          <label className="btn-secondary cursor-pointer text-sm">
            {uploading ? 'جاري الرفع...' : '+ رفع GLB (وضع مكاني)'}
            <input type="file" accept=".glb" className="hidden" onChange={(e) => handleUpload(e, 'placement_glb')} disabled={uploading} />
          </label>
          <label className="btn-secondary cursor-pointer text-sm">
            {uploading ? 'جاري الرفع...' : '+ رفع GLB (تجربة)'}
            <input type="file" accept=".glb" className="hidden" onChange={(e) => handleUpload(e, 'tryon_glb')} disabled={uploading} />
          </label>
          <label className="btn-secondary cursor-pointer text-sm">
            {uploading ? 'جاري الرفع...' : '+ رفع USDZ'}
            <input type="file" accept=".usdz" className="hidden" onChange={(e) => handleUpload(e, 'usdz')} disabled={uploading} />
          </label>
        </div>
      </div>

      {/* Configs */}
      <div className="card mb-6">
        <h3 className="font-medium mb-4">إعدادات المشاهد</h3>
        {configs.length > 0 ? (
          <div className="space-y-3">
            {configs.map((c: any) => (
              <div key={c.id} className="p-3 bg-gray-50 rounded-lg">
                <span className="badge-blue">{c.viewerType === 'placement' ? 'وضع مكاني' : 'تجربة ارتداء'}</span>
                <p className="text-sm text-gray-600 mt-2">المقياس: {c.scale}</p>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-500 text-sm">لم يتم تكوين الإعدادات بعد</p>
        )}
      </div>

      <div className="flex justify-end">
        <button onClick={handleDelete} className="btn-danger text-sm">حذف المنتج</button>
      </div>
    </div>
  );
}
