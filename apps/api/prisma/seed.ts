import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import * as fs from 'fs';
import * as path from 'path';
import { generateDemoGlb } from './demo-glb';

const prisma = new PrismaClient();

const UPLOADS_DIR = process.env.STORAGE_LOCAL_PATH || './uploads';

/** Write a demo GLB file to disk and return the relative path + size */
function writeDemoAsset(companyId: string, fileName: string, color: [number, number, number]): { path: string; sizeBytes: number } {
  const dir = path.join(UPLOADS_DIR, companyId, 'assets');
  fs.mkdirSync(dir, { recursive: true });
  const glb = generateDemoGlb(color);
  const filePath = path.join(dir, fileName);
  fs.writeFileSync(filePath, glb);
  return { path: `${companyId}/assets/${fileName}`, sizeBytes: glb.length };
}

async function main() {
  console.log('Seeding AR-Core database...');

  // Ensure uploads directory exists
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });

  // ---- Plans ----
  const starterPlan = await prisma.plan.upsert({
    where: { code: 'starter' },
    update: {},
    create: {
      code: 'starter',
      nameAr: 'المبتدئ',
      nameEn: 'Starter',
      monthlySessionLimit: 5000,
      productLimit: 20,
      featureFlagsJson: { placement: true, tryon: false },
    },
  });

  const growthPlan = await prisma.plan.upsert({
    where: { code: 'growth' },
    update: {},
    create: {
      code: 'growth',
      nameAr: 'النمو',
      nameEn: 'Growth',
      monthlySessionLimit: 30000,
      productLimit: 100,
      featureFlagsJson: { placement: true, tryon: true },
    },
  });

  await prisma.plan.upsert({
    where: { code: 'enterprise' },
    update: {},
    create: {
      code: 'enterprise',
      nameAr: 'المؤسسات',
      nameEn: 'Enterprise',
      monthlySessionLimit: 0,
      productLimit: 0,
      featureFlagsJson: { placement: true, tryon: true, customBranding: true, apiAccess: true },
    },
  });

  console.log('  Plans created');

  // ---- Platform Admin ----
  const adminHash = await bcrypt.hash('Admin@123456', 12);
  await prisma.user.upsert({
    where: { email: 'admin@arcore.io' },
    update: {},
    create: {
      email: 'admin@arcore.io',
      passwordHash: adminHash,
      name: 'مدير المنصة',
      role: 'platform_admin',
      companyId: null,
    },
  });
  console.log('  Platform admin created');

  // ---- Company 1: Furniture Store ----
  const company1 = await prisma.company.upsert({
    where: { slug: 'riyadh-furniture' },
    update: {},
    create: {
      name: 'أثاث الرياض',
      slug: 'riyadh-furniture',
      planId: growthPlan.id,
      status: 'active',
    },
  });

  const owner1Hash = await bcrypt.hash('Owner@123456', 12);
  await prisma.user.upsert({
    where: { email: 'owner@riyadhfurniture.com' },
    update: {},
    create: {
      email: 'owner@riyadhfurniture.com',
      passwordHash: owner1Hash,
      name: 'أحمد المالك',
      role: 'company_owner',
      companyId: company1.id,
    },
  });

  const c1Products: Array<{ sku: string; nameAr: string; nameEn: string; color: [number, number, number] }> = [
    { sku: 'SOFA-001', nameAr: 'أريكة كلاسيكية', nameEn: 'Classic Sofa', color: [0.55, 0.27, 0.07] },
    { sku: 'TABLE-001', nameAr: 'طاولة طعام خشبية', nameEn: 'Wooden Dining Table', color: [0.6, 0.4, 0.2] },
    { sku: 'CHAIR-001', nameAr: 'كرسي مكتب', nameEn: 'Office Chair', color: [0.2, 0.2, 0.2] },
    { sku: 'LAMP-001', nameAr: 'مصباح أرضي', nameEn: 'Floor Lamp', color: [0.9, 0.85, 0.6] },
    { sku: 'BED-001', nameAr: 'سرير ملكي', nameEn: 'King Bed', color: [0.8, 0.75, 0.7] },
  ];

  for (const p of c1Products) {
    const product = await prisma.product.upsert({
      where: { companyId_sku: { companyId: company1.id, sku: p.sku } },
      update: {},
      create: { sku: p.sku, nameAr: p.nameAr, nameEn: p.nameEn, companyId: company1.id, status: 'active' },
    });

    // Write a real GLB file to disk
    const asset = writeDemoAsset(company1.id, `${p.sku.toLowerCase()}.glb`, p.color);

    // Delete existing assets to allow re-seed
    await prisma.asset.deleteMany({ where: { companyId: company1.id, productId: product.id } });

    await prisma.asset.create({
      data: {
        companyId: company1.id,
        productId: product.id,
        type: 'placement_glb',
        path: asset.path,
        sizeBytes: asset.sizeBytes,
      },
    });

    await prisma.productConfig.upsert({
      where: { companyId_productId_viewerType: { companyId: company1.id, productId: product.id, viewerType: 'placement' } },
      update: {},
      create: {
        companyId: company1.id,
        productId: product.id,
        viewerType: 'placement',
        scale: 1.0,
        rotationOffsetJson: { x: 0, y: 0, z: 0 },
        positionOffsetJson: { x: 0, y: 0, z: 0 },
        placementSettingsJson: { groundPlane: true, shadowIntensity: 1 },
        tryonSettingsJson: {},
      },
    });
  }
  console.log('  Company 1 (riyadh-furniture) created with 5 products + GLB assets');

  // ---- Company 2: Eyewear Brand ----
  const company2 = await prisma.company.upsert({
    where: { slug: 'noor-eyewear' },
    update: {},
    create: {
      name: 'نور للنظارات',
      slug: 'noor-eyewear',
      planId: starterPlan.id,
      status: 'active',
    },
  });

  const owner2Hash = await bcrypt.hash('Owner@123456', 12);
  await prisma.user.upsert({
    where: { email: 'owner@nooreyewear.com' },
    update: {},
    create: {
      email: 'owner@nooreyewear.com',
      passwordHash: owner2Hash,
      name: 'سارة المديرة',
      role: 'company_owner',
      companyId: company2.id,
    },
  });

  const c2Products: Array<{ sku: string; nameAr: string; nameEn: string; color: [number, number, number] }> = [
    { sku: 'SUN-001', nameAr: 'نظارة شمسية كلاسيك', nameEn: 'Classic Sunglasses', color: [0.1, 0.1, 0.1] },
    { sku: 'SUN-002', nameAr: 'نظارة شمسية رياضية', nameEn: 'Sport Sunglasses', color: [0.9, 0.2, 0.2] },
    { sku: 'OPT-001', nameAr: 'نظارة طبية دائرية', nameEn: 'Round Optical Frame', color: [0.7, 0.5, 0.3] },
    { sku: 'OPT-002', nameAr: 'نظارة طبية مربعة', nameEn: 'Square Optical Frame', color: [0.3, 0.3, 0.5] },
    { sku: 'SUN-003', nameAr: 'نظارة أفياتور', nameEn: 'Aviator Sunglasses', color: [0.8, 0.7, 0.2] },
  ];

  for (const p of c2Products) {
    const product = await prisma.product.upsert({
      where: { companyId_sku: { companyId: company2.id, sku: p.sku } },
      update: {},
      create: { sku: p.sku, nameAr: p.nameAr, nameEn: p.nameEn, companyId: company2.id, status: 'active' },
    });

    const asset = writeDemoAsset(company2.id, `${p.sku.toLowerCase()}.glb`, p.color);

    await prisma.asset.deleteMany({ where: { companyId: company2.id, productId: product.id } });

    await prisma.asset.create({
      data: {
        companyId: company2.id,
        productId: product.id,
        type: 'tryon_glb',
        path: asset.path,
        sizeBytes: asset.sizeBytes,
      },
    });

    await prisma.productConfig.upsert({
      where: { companyId_productId_viewerType: { companyId: company2.id, productId: product.id, viewerType: 'tryon' } },
      update: {},
      create: {
        companyId: company2.id,
        productId: product.id,
        viewerType: 'tryon',
        scale: 0.8,
        rotationOffsetJson: { x: 0, y: 0, z: 0 },
        positionOffsetJson: { x: 0, y: 0.02, z: 0 },
        placementSettingsJson: {},
        tryonSettingsJson: { faceTracking: true, mirrorMode: true },
      },
    });
  }
  console.log('  Company 2 (noor-eyewear) created with 5 products + GLB assets');

  console.log('');
  console.log('====================================================');
  console.log('  AR-Core Database Seeded Successfully!');
  console.log('====================================================');
  console.log('');
  console.log('Demo Credentials:');
  console.log('  Platform Admin:  admin@arcore.io / Admin@123456');
  console.log('  Company Owner 1: owner@riyadhfurniture.com / Owner@123456');
  console.log('  Company Owner 2: owner@nooreyewear.com / Owner@123456');
  console.log('');
  console.log('Sample Viewer Link:');
  console.log('  http://localhost:4000/v/riyadh-furniture/SOFA-001');
  console.log('');
  console.log('Sample Embed Code:');
  console.log('  <script src="http://localhost:4000/embed.js" data-company="riyadh-furniture"></script>');
  console.log('  <div data-ar-sku="SOFA-001"></div>');
  console.log('');
}

main()
  .catch((e) => {
    console.error('Seed error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
