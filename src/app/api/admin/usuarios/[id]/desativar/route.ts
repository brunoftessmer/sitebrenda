import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { jsonError, handleAuthError } from "@/lib/api";

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const admin = await requireAdmin();
    const { id } = await params;

    if (id === admin.id) {
      return jsonError(400, "Você não pode desativar sua própria conta.");
    }

    const existing = await prisma.user.findUnique({ where: { id } });
    if (!existing) {
      return jsonError(404, "Usuário não encontrado.");
    }
    if (existing.isAdmin) {
      return jsonError(400, "Não é possível desativar uma conta de admin.");
    }

    const user = await prisma.user.update({
      where: { id },
      data: { isActive: false },
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
