import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { createSessionCookie, verifyPassword } from "@/lib/auth";
import { jsonError } from "@/lib/api";

const schema = z.object({
  phone: z.string().trim().min(1, "Informe o telefone."),
  password: z.string().min(1, "Informe a senha."),
});

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return jsonError(400, parsed.error.issues[0]?.message ?? "Dados inválidos.");
  }

  const { phone, password } = parsed.data;

  const user = await prisma.user.findUnique({ where: { phone } });
  if (!user) {
    return jsonError(401, "Telefone ou senha incorretos.");
  }

  const valid = await verifyPassword(password, user.passwordHash);
  if (!valid) {
    return jsonError(401, "Telefone ou senha incorretos.");
  }

  if (!user.isActive) {
    return jsonError(403, "Sua conta foi desativada. Fale com a Brenda.");
  }

  await createSessionCookie({ sub: user.id, isAdmin: user.isAdmin });

  return NextResponse.json({
    user: { id: user.id, name: user.name, phone: user.phone, isAdmin: user.isAdmin },
  });
}
