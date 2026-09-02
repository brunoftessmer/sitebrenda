import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { jsonError, handleAuthError } from "@/lib/api";

export async function GET() {
  try {
    await requireAdmin();

    const reservations = await prisma.reservation.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        user: { select: { name: true, phone: true } },
        numbers: { select: { number: true } },
      },
    });

    return NextResponse.json({ reservations });
  } catch (err) {
    return handleAuthError(err) ?? jsonError(500, "Erro inesperado.");
  }
}
