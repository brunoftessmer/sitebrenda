import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { releaseExpiredReservations } from "@/lib/reservas";

export async function GET() {
  await releaseExpiredReservations();

  const numbers = await prisma.numberSlot.findMany({
    orderBy: { number: "asc" },
    select: { number: true, status: true },
  });
  return NextResponse.json({ numbers });
}
