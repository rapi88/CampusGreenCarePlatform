// Seed file — populates the database with GTU campus sample data
import { PrismaClient, Role, Health } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // ── Create admin user ──────────────────────────────────
  const adminPassword = await bcrypt.hash('Admin123!', 12);
  const admin = await prisma.user.upsert({
    where: { email: 'admin@gtu.edu.tr' },
    update: {},
    create: {
      name: 'Admin Kullanıcı',
      email: 'admin@gtu.edu.tr',
      passwordHash: adminPassword,
      role: Role.ADMIN,
      points: 0,
    },
  });
  console.log(`  ✅ Admin user: ${admin.email}`);

  // ── Create test volunteer users ────────────────────────
  const userPassword = await bcrypt.hash('Test1234', 12);
  const users = await Promise.all([
    prisma.user.upsert({
      where: { email: 'mehmet.yilmaz@gtu.edu.tr' },
      update: {},
      create: {
        name: 'Mehmet Yılmaz',
        email: 'mehmet.yilmaz@gtu.edu.tr',
        passwordHash: userPassword,
        role: Role.USER,
        points: 320,
      },
    }),
    prisma.user.upsert({
      where: { email: 'zeynep.kaya@gtu.edu.tr' },
      update: {},
      create: {
        name: 'Zeynep Kaya',
        email: 'zeynep.kaya@gtu.edu.tr',
        passwordHash: userPassword,
        role: Role.USER,
        points: 280,
      },
    }),
    prisma.user.upsert({
      where: { email: 'ali.riza@gtu.edu.tr' },
      update: {},
      create: {
        name: 'Ali Rıza',
        email: 'ali.riza@gtu.edu.tr',
        passwordHash: userPassword,
        role: Role.USER,
        points: 245,
      },
    }),
  ]);
  console.log(`  ✅ Created ${users.length} test users`);

  // ── Create GTU campus trees ────────────────────────────
  // Coordinates around GTU Gebze campus (40.804, 29.361)
  const trees = await Promise.all([
    prisma.tree.create({
      data: {
        name: 'Ak Meşe',
        species: 'Quercus pubescens',
        latitude: 40.8040,
        longitude: 29.3610,
        location: 'Merkezi Avlu, Sektör A',
        estimatedAge: 15,
        height: 12,
        wateringPeriodDays: 3,
        isNaturalMonument: true,
        health: Health.HEALTHY,
        plantingDate: new Date('2009-04-22'),
      },
    }),
    prisma.tree.create({
      data: {
        name: 'Kestane #042',
        species: 'Castanea sativa',
        latitude: 40.8050,
        longitude: 29.3620,
        location: 'Kütüphane Önü',
        estimatedAge: 20,
        height: 15,
        wateringPeriodDays: 5,
        health: Health.HEALTHY,
        plantingDate: new Date('2004-03-15'),
      },
    }),
    prisma.tree.create({
      data: {
        name: 'Sedir #17',
        species: 'Cedrus libani',
        latitude: 40.8030,
        longitude: 29.3600,
        location: 'Mühendislik Binası',
        estimatedAge: 30,
        height: 18,
        wateringPeriodDays: 7,
        health: Health.HEALTHY,
        plantingDate: new Date('1994-05-10'),
      },
    }),
    prisma.tree.create({
      data: {
        name: 'Çınar #08',
        species: 'Platanus orientalis',
        latitude: 40.8045,
        longitude: 29.3595,
        location: 'Rektörlük Bahçesi',
        estimatedAge: 50,
        height: 25,
        wateringPeriodDays: 4,
        isNaturalMonument: true,
        health: Health.HEALTHY,
        plantingDate: new Date('1974-09-01'),
      },
    }),
    prisma.tree.create({
      data: {
        name: 'Lale Ağacı #03',
        species: 'Liriodendron tulipifera',
        latitude: 40.8055,
        longitude: 29.3615,
        location: 'Konferans Merkezi Yanı',
        estimatedAge: 8,
        height: 7,
        wateringPeriodDays: 2,
        health: Health.SICK,
        plantingDate: new Date('2016-11-20'),
      },
    }),
    prisma.tree.create({
      data: {
        name: 'Karaçam #21',
        species: 'Pinus nigra',
        latitude: 40.8035,
        longitude: 29.3625,
        location: 'Yurt Alanı',
        estimatedAge: 25,
        height: 20,
        wateringPeriodDays: 10,
        health: Health.HEALTHY,
        plantingDate: new Date('1999-04-15'),
      },
    }),
  ]);
  console.log(`  ✅ Created ${trees.length} trees`);

  // ── Create adoptions ───────────────────────────────────
  await prisma.adoption.createMany({
    data: [
      { userId: users[0].id, treeId: trees[0].id },
      { userId: users[1].id, treeId: trees[0].id },
      { userId: users[0].id, treeId: trees[1].id },
      { userId: users[2].id, treeId: trees[2].id },
    ],
    skipDuplicates: true,
  });
  console.log('  ✅ Created adoptions');

  // ── Create watering events ─────────────────────────────
  const now = new Date();
  await prisma.wateringEvent.createMany({
    data: [
      // Tree 0 (Ak Meşe) — watered 3 days ago → will be needs_water
      {
        userId: users[0].id,
        treeId: trees[0].id,
        latitude: 40.8040,
        longitude: 29.3610,
        gpsVerified: true,
        pointsAwarded: 10,
        createdAt: new Date(now.getTime() - 3 * 86_400_000),
      },
      // Tree 1 (Kestane) — watered today → will be watered
      {
        userId: users[0].id,
        treeId: trees[1].id,
        latitude: 40.8050,
        longitude: 29.3620,
        gpsVerified: true,
        pointsAwarded: 10,
        createdAt: new Date(now.getTime() - 2 * 3_600_000),
      },
      // Tree 2 (Sedir) — watered 6 days ago (period=7) → will be due_soon
      {
        userId: users[2].id,
        treeId: trees[2].id,
        latitude: 40.8030,
        longitude: 29.3600,
        gpsVerified: true,
        pointsAwarded: 10,
        createdAt: new Date(now.getTime() - 6 * 86_400_000),
      },
    ],
  });
  console.log('  ✅ Created watering events');

  // ── Create sample chat messages ────────────────────────
  await prisma.chatMessage.createMany({
    data: [
      { treeId: trees[0].id, userId: users[0].id, text: 'Bugün suladım, toprak çok kurumuştu.' },
      { treeId: trees[0].id, userId: users[1].id, text: 'Ben de yarın sabah gelirim 🌱' },
    ],
  });
  console.log('  ✅ Created chat messages');

  // ── Create sample notes ────────────────────────────────
  await prisma.treeNote.createMany({
    data: [
      { treeId: trees[0].id, userId: users[0].id, text: 'Alt dallarından biri kırılmış, kontrol edilmeli.' },
    ],
  });
  console.log('  ✅ Created notes');

  console.log('\n🎉 Seed completed successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
