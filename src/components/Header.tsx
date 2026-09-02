"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useSession } from "@/hooks/useSession";

export default function Header() {
  const { user, loading, refresh } = useSession();
  const router = useRouter();

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    await refresh();
    router.push("/");
    router.refresh();
  }

  return (
    <header className="sticky top-0 z-20 border-b border-rose-200 bg-rose-50/90 backdrop-blur">
      <div className="mx-auto flex max-w-3xl items-center justify-between px-4 py-3">
        <Link href="/" className="text-lg font-semibold text-rose-700">
          🏡 Chá da Brenda
        </Link>

        <nav className="flex items-center gap-3 text-sm">
          {loading ? null : user ? (
            <>
              <Link href="/minhas-compras" className="text-stone-600 hover:text-rose-700">
                Minhas compras
              </Link>
              {user.isAdmin && (
                <Link href="/admin" className="text-stone-600 hover:text-rose-700">
                  Admin
                </Link>
              )}
              <span className="hidden text-stone-500 sm:inline">Olá, {user.name.split(" ")[0]}</span>
              <button
                onClick={handleLogout}
                className="rounded-full border border-rose-300 px-3 py-1 text-rose-700 hover:bg-rose-100"
              >
                Sair
              </button>
            </>
          ) : (
            <>
              <Link
                href="/login"
                className="rounded-full border border-rose-300 px-3 py-1 text-rose-700 hover:bg-rose-100"
              >
                Entrar
              </Link>
              <Link
                href="/cadastro"
                className="rounded-full bg-rose-600 px-3 py-1 text-white hover:bg-rose-700"
              >
                Cadastrar
              </Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
