import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { jsonError, handleAuthError } from "@/lib/api";

const schema = z.object({
  phone: z
    .string()
    .trim()
    .regex(/^\d{10,11}$/, "Telefone deve ter 10 ou 11 dígitos (DDD + número)."),
});

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin();
    const { id } = await params;

    const body = await req.json().catch(() => null);
    const parsed = schema.safeParse(body);
    if (!parsed.success) {
      return jsonError(400, parsed.error.issues[0]?.message ?? "Dados inválidos.");
    }
    const { phone } = parsed.data;

    const existing = await prisma.user.findUnique({ where: { id } });
    if (!existing) {
      return jsonError(404, "Usuário não encontrado.");
    }

    const phoneInUse = await prisma.user.findUnique({ where: { phone } });
    if (phoneInUse && phoneInUse.id !== id) {
      return jsonError(409, "Já existe uma conta com esse telefone.");
    }

    const user = await prisma.user.update({
      where: { id },
      data: { phone },
      select: {
        id: true,
        name: true,
        phone: true,
        isAdmin: true,
        isActive: true,
        createdAt: true,
      },
    });

    return NextResponse.json({ user });
  } catch (err) {
    return handleAuthError(err) ?? jsonError(500, "Erro inesperado.");
  }
}
