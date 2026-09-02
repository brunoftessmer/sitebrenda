"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function CadastroPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await fetch("/api/auth/cadastro", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, phone: phone.replace(/\D/g, ""), password }),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? "Não foi possível cadastrar.");
        return;
      }

      router.push("/");
      router.refresh();
    } catch {
      setError("Erro de conexão. Tente novamente.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto w-full max-w-sm px-4 py-10">
      <h1 className="mb-6 text-xl font-semibold text-rose-800">Criar conta</h1>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <label className="flex flex-col gap-1 text-sm text-stone-600">
          Nome completo
          <input
            className="rounded-lg border border-stone-300 px-3 py-2"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
        </label>

        <label className="flex flex-col gap-1 text-sm text-stone-600">
          Telefone (DDD + número)
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
            minLength={6}
            required
          />
        </label>

        {error && <p className="text-sm text-red-600">{error}</p>}

        <button
          type="submit"
          disabled={loading}
          className="mt-2 rounded-full bg-rose-600 px-5 py-2 font-medium text-white hover:bg-rose-700 disabled:opacity-60"
        >
          {loading ? "Criando conta…" : "Criar conta"}
        </button>
      </form>

      <p className="mt-4 text-sm text-stone-600">
        Já tem conta?{" "}
        <Link href="/login" className="font-medium text-rose-700">
          Entrar
        </Link>
      </p>
    </div>
  );
}
