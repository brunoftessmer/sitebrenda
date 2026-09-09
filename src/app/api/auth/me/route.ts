import { NextResponse } from "next/server";
import { clearSessionCookie, getCurrentUser } from "@/lib/auth";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ user: null });
  }
  if (!user.isActive) {
    await clearSessionCookie();
    return NextResponse.json({ user: null });
  }
  return NextResponse.json({
    user: { id: user.id, name: user.name, phone: user.phone, isAdmin: user.isAdmin },
  });
}
