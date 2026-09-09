"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

type User = {
  id: string;
  name: string;
  phone: string;
  isAdmin: boolean;
  isActive: boolean;
  createdAt: string;
};

export default function AdminUsuariosPage() {
  const [users, setUsers] = useState<User[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingPhone, setEditingPhone] = useState("");

  async function load() {
    const res = await fetch("/api/admin/usuarios", { cache: "no-store" });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error ?? "Acesso negado.");
      return;
    }
    setUsers(data.users);
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load();
  }, []);

  function startEdit(user: User) {
    setError(null);
    setEditingId(user.id);
    setEditingPhone(user.phone);
  }

  function cancelEdit() {
    setEditingId(null);
    setEditingPhone("");
  }

  async function saveEdit(id: string) {
    setBusyId(id);
    try {
      const res = await fetch(`/api/admin/usuarios/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: editingPhone.replace(/\D/g, "") }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Não foi possível salvar.");
        return;
      }
      setError(null);
      cancelEdit();
      await load();
    } finally {
      setBusyId(null);
    }
  }

  async function toggleActive(user: User) {
    setBusyId(user.id);
    try {
      const action = user.isActive ? "desativar" : "ativar";
      const res = await fetch(`/api/admin/usuarios/${user.id}/${action}`, {
        method: "POST",
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Ação falhou.");
        return;
      }
      setError(null);
      await load();
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="mx-auto w-full max-w-2xl px-4 py-8">
      <Link href="/admin" className="text-sm text-rose-700 underline">
        ← Painel admin
      </Link>

      <h1 className="mb-1 mt-2 text-xl font-semibold text-rose-800">
        Usuários
      </h1>
      <p className="mb-6 text-sm text-stone-500">
        Edite o telefone de cadastro ou desative uma conta.
      </p>

      {error && <p className="mb-4 text-sm text-red-600">{error}</p>}

      <ul className="flex flex-col gap-3">
        {users?.map((u) => (
          <li
            key={u.id}
            className={`rounded-xl border p-4 ${
              u.isActive
                ? "border-rose-200 bg-white"
                : "border-stone-200 bg-stone-50"
            }`}
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="font-medium text-stone-800">
                  {u.name}
                  {u.isAdmin && (
                    <span className="ml-2 rounded-full bg-rose-100 px-2 py-0.5 text-xs font-medium text-rose-700">
                      Admin
                    </span>
                  )}
                </p>

                {editingId === u.id ? (
                  <div className="mt-1 flex items-center gap-2">
                    <input
                      value={editingPhone}
                      onChange={(e) => setEditingPhone(e.target.value)}
                      inputMode="numeric"
                      className="rounded-lg border border-stone-300 px-2 py-1 text-sm"
                    />
                  </div>
                ) : (
                  <p className="text-sm text-stone-500">{u.phone}</p>
                )}
              </div>

              <span
                className={`text-sm font-medium ${
                  u.isActive ? "text-emerald-600" : "text-stone-400"
                }`}
              >
                {u.isActive ? "Ativo" : "Desativado"}
              </span>
            </div>

            <div className="mt-3 flex gap-2">
              {editingId === u.id ? (
                <>
                  <button
                    onClick={() => saveEdit(u.id)}
                    disabled={busyId === u.id}
                    className="rounded-full bg-rose-600 px-4 py-1.5 text-sm text-white hover:bg-rose-700 disabled:opacity-60"
                  >
                    {busyId === u.id ? "Salvando…" : "Salvar"}
                  </button>
                  <button
                    onClick={cancelEdit}
                    disabled={busyId === u.id}
                    className="rounded-full border border-stone-300 px-4 py-1.5 text-sm text-stone-600 hover:bg-stone-50 disabled:opacity-60"
                  >
                    Cancelar
                  </button>
                </>
              ) : (
                <>
                  <button
                    onClick={() => startEdit(u)}
                    className="rounded-full border border-stone-300 px-4 py-1.5 text-sm text-stone-600 hover:bg-stone-50"
                  >
                    Editar cadastro
                  </button>
                  {!u.isAdmin && (
                    <button
                      onClick={() => toggleActive(u)}
                      disabled={busyId === u.id}
                      className={`rounded-full px-4 py-1.5 text-sm disabled:opacity-60 ${
                        u.isActive
                          ? "border border-red-300 text-red-600 hover:bg-red-50"
                          : "bg-emerald-600 text-white hover:bg-emerald-700"
                      }`}
                    >
                      {busyId === u.id
                        ? "Aguarde…"
                        : u.isActive
                        ? "Desativar"
                        : "Reativar"}
                    </button>
                  )}
                </>
              )}
            </div>
          </li>
        ))}
      </ul>

      {users && users.length === 0 && (
        <p className="text-stone-500">Nenhum usuário ainda.</p>
      )}
    </div>
  );
}
