import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding AR-Core database...');

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

  const enterprisePlan = await prisma.plan.upsert({
    where: { code: 'enterprise' },
    update: {},
    create: {
      code: 'enterprise',
      nameAr: 'المؤسسات',
      nameEn: 'Enterprise',
      monthlySessionLimit: 0, // 0 = unlimited
      productLimit: 0,
      featureFlagsJson: { placement: true, tryon: true, customBranding: true, apiAccess: true },
    },
  });

  console.log('✅ Plans created');

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
  console.log('✅ Platform admin created');

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

  // Products for Company 1
  const c1Products = [
    { sku: 'SOFA-001', nameAr: 'أريكة كلاسيكية', nameEn: 'Classic Sofa' },
    { sku: 'TABLE-001', nameAr: 'طاولة طعام خشبية', nameEn: 'Wooden Dining Table' },
    { sku: 'CHAIR-001', nameAr: 'كرسي مكتب', nameEn: 'Office Chair' },
    { sku: 'LAMP-001', nameAr: 'مصباح أرضي', nameEn: 'Floor Lamp' },
    { sku: 'BED-001', nameAr: 'سرير ملكي', nameEn: 'King Bed' },
  ];

  for (const p of c1Products) {
    const product = await prisma.product.upsert({
      where: { companyId_sku: { companyId: company1.id, sku: p.sku } },
      update: {},
      create: { ...p, companyId: company1.id, status: 'active' },
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
  console.log('✅ Company 1 (أثاث الرياض) created with 5 products');

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

  const c2Products = [
    { sku: 'SUN-001', nameAr: 'نظارة شمسية كلاسيك', nameEn: 'Classic Sunglasses' },
    { sku: 'SUN-002', nameAr: 'نظارة شمسية رياضية', nameEn: 'Sport Sunglasses' },
    { sku: 'OPT-001', nameAr: 'نظارة طبية دائرية', nameEn: 'Round Optical Frame' },
    { sku: 'OPT-002', nameAr: 'نظارة طبية مربعة', nameEn: 'Square Optical Frame' },
    { sku: 'SUN-003', nameAr: 'نظارة أفياتور', nameEn: 'Aviator Sunglasses' },
  ];

  for (const p of c2Products) {
    const product = await prisma.product.upsert({
      where: { companyId_sku: { companyId: company2.id, sku: p.sku } },
      update: {},
      create: { ...p, companyId: company2.id, status: 'active' },
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
  console.log('✅ Company 2 (نور للنظارات) created with 5 products');

  console.log('');
  console.log('====================================================');
  console.log('🎉 AR-Core Database Seeded Successfully!');
  console.log('====================================================');
  console.log('');
  console.log('📧 Demo Credentials:');
  console.log('  Platform Admin:  admin@arcore.io / Admin@123456');
  console.log('  Company Owner 1: owner@riyadhfurniture.com / Owner@123456');
  console.log('  Company Owner 2: owner@nooreyewear.com / Owner@123456');
  console.log('');
  console.log('🔗 Sample Viewer Link:');
  console.log('  http://localhost:4000/v/riyadh-furniture/SOFA-001');
  console.log('');
  console.log('📦 Sample Embed Code:');
  console.log('  <script src="http://localhost:4000/embed.js" data-company="riyadh-furniture"></script>');
  console.log('  <div data-ar-sku="SOFA-001"></div>');
  console.log('');
}

main()
  .catch((e) => {
    console.error('❌ Seed error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
