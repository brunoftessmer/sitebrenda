import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET() {
  const numbers = await prisma.numberSlot.findMany({
    orderBy: { number: "asc" },
    select: { number: true, status: true },
  });
  return NextResponse.json({ numbers });
}
