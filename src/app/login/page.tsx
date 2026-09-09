"use client";

import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";

function LoginForm() {
  const searchParams = useSearchParams();
  const redirect = searchParams.get("redirect") ?? "/";

  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: phone.replace(/\D/g, ""), password }),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? "Não foi possível entrar.");
        return;
      }

      // Full reload (not router.push) so Header's useSession refetches /api/auth/me.
      window.location.href = redirect;
    } catch {
      setError("Erro de conexão. Tente novamente.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto w-full max-w-sm px-4 py-10">
      <h1 className="mb-1 text-xl font-semibold text-rose-800">
        Área da administração
      </h1>
      <p className="mb-6 text-sm text-stone-500">
        Login restrito à Brenda. Para reservar um número não é necessário
        entrar.
      </p>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <label className="flex flex-col gap-1 text-sm text-stone-600">
          Telefone
          <input
            className="rounded-lg border border-stone-300 px-3 py-2"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            inputMode="numeric"
            placeholder="11999999999"
            required
          />
        </label>

        <label className="flex flex-col gap-1 text-sm text-stone-600">
          Senha
          <input
            className="rounded-lg border border-stone-300 px-3 py-2"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </label>

        {error && <p className="text-sm text-red-600">{error}</p>}

        <button
          type="submit"
          disabled={loading}
          className="mt-2 rounded-full bg-rose-600 px-5 py-2 font-medium text-white hover:bg-rose-700 disabled:opacity-60"
        >
          {loading ? "Entrando…" : "Entrar"}
        </button>
      </form>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginForm />
    </Suspense>
  );
}
