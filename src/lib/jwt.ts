// Funções puras (compatíveis com o runtime Edge do middleware) para assinar e
// verificar o token de sessão. Não importa nada do Node (Prisma, next/headers).
import { SignJWT, jwtVerify } from "jose";

export const SESSION_COOKIE = "brenda_session";
export const SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 30; // 30 dias

function getSecretKey() {
  const secret = process.env.AUTH_SECRET;
  if (!secret) {
    throw new Error("AUTH_SECRET não configurado (.env)");
  }
  return new TextEncoder().encode(secret);
}

export type SessionPayload = {
  sub: string; // userId
  isAdmin: boolean;
};

export async function signSessionToken(payload: SessionPayload) {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${SESSION_MAX_AGE_SECONDS}s`)
    .sign(getSecretKey());
}

export async function verifySessionToken(
  token: string
): Promise<SessionPayload | null> {
  try {
    const { payload } = await jwtVerify(token, getSecretKey());
    if (typeof payload.sub !== "string" || typeof payload.isAdmin !== "boolean") {
      return null;
    }
    return { sub: payload.sub, isAdmin: payload.isAdmin };
  } catch {
    return null;
  }
}
