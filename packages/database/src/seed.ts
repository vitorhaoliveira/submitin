import { prisma } from "./client";

async function main() {
  console.log("🌱 Seeding database...");

  // Clean up existing data
  await prisma.fieldValue.deleteMany();
  await prisma.response.deleteMany();
  await prisma.formSettings.deleteMany();
  await prisma.field.deleteMany();
  await prisma.form.deleteMany();

  console.log("✅ Database seeded successfully!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

