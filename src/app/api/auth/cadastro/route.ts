import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { createSessionCookie, hashPassword } from "@/lib/auth";
import { jsonError } from "@/lib/api";

const schema = z.object({
  name: z.string().trim().min(2, "Informe seu nome completo.").max(80),
  phone: z
    .string()
    .trim()
    .regex(/^\d{10,11}$/, "Telefone deve ter 10 ou 11 dígitos (DDD + número)."),
  password: z.string().min(6, "Senha deve ter ao menos 6 caracteres."),
});

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return jsonError(400, parsed.error.issues[0]?.message ?? "Dados inválidos.");
  }

  const { name, phone, password } = parsed.data;

  const existing = await prisma.user.findUnique({ where: { phone } });
  if (existing) {
    return jsonError(409, "Já existe uma conta com esse telefone.");
  }

  const passwordHash = await hashPassword(password);
  const user = await prisma.user.create({
    data: { name, phone, passwordHash },
  });

  await createSessionCookie({ sub: user.id, isAdmin: user.isAdmin });

  return NextResponse.json({
    user: { id: user.id, name: user.name, phone: user.phone, isAdmin: user.isAdmin },
  });
}
