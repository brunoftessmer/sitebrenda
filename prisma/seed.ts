import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function seedNumbers() {
  const existing = await prisma.numberSlot.count();
  if (existing > 0) {
    console.log(`Números já existem (${existing}), pulando criação.`);
    return;
  }

  const numbers = Array.from({ length: 100 }, (_, i) => ({ number: i + 1 }));
  await prisma.numberSlot.createMany({ data: numbers });
  console.log("Criados 100 números (1 a 100).");
}

async function seedAdmin() {
  const name = process.env.ADMIN_NAME ?? "Brenda";
  const phone = process.env.ADMIN_PHONE;
  const password = process.env.ADMIN_PASSWORD;

  if (!phone || !password) {
    console.warn(
      "ADMIN_PHONE / ADMIN_PASSWORD não definidos no .env — nenhum admin foi criado."
    );
    return;
  }

  const existing = await prisma.user.findUnique({ where: { phone } });
  if (existing) {
    console.log(`Admin com telefone ${phone} já existe, pulando criação.`);
    return;
  }

  const passwordHash = await bcrypt.hash(password, 10);
  await prisma.user.create({
    data: { name, phone, passwordHash, isAdmin: true },
  });
  console.log(`Admin "${name}" (${phone}) criado.`);
}

async function main() {
  await seedNumbers();
  await seedAdmin();
}

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
