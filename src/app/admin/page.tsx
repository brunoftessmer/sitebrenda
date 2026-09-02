"use client";

import { useEffect, useState } from "react";

type Reservation = {
  id: string;
  status: "PENDING" | "PAID" | "CANCELED";
  totalCents: number;
  createdAt: string;
  user: { name: string; phone: string };
  numbers: { number: number }[];
};

function formatBRL(cents: number) {
  return (cents / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

const statusLabel: Record<Reservation["status"], string> = {
  PENDING: "Pendente",
  PAID: "Pago",
  CANCELED: "Cancelado",
};

const statusColor: Record<Reservation["status"], string> = {
  PENDING: "text-amber-600",
  PAID: "text-emerald-600",
  CANCELED: "text-stone-400",
};

export default function AdminPage() {
  const [reservations, setReservations] = useState<Reservation[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  async function load() {
    const res = await fetch("/api/admin/reservas", { cache: "no-store" });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error ?? "Acesso negado.");
      return;
    }
    setReservations(data.reservations);
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load();
  }, []);

  async function handleAction(id: string, action: "confirmar" | "liberar") {
    setBusyId(id);
    try {
      const res = await fetch(`/api/admin/reservas/${id}/${action}`, { method: "POST" });
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

  const totalConfirmed = (reservations ?? [])
    .filter((r) => r.status === "PAID")
    .reduce((acc, r) => acc + r.totalCents, 0);

  return (
    <div className="mx-auto w-full max-w-2xl px-4 py-8">
      <h1 className="mb-1 text-xl font-semibold text-rose-800">Painel admin</h1>
      <p className="mb-6 text-sm text-stone-500">
        Total confirmado: <span className="font-medium">{formatBRL(totalConfirmed)}</span>
      </p>

      {error && <p className="mb-4 text-sm text-red-600">{error}</p>}

      <ul className="flex flex-col gap-3">
        {reservations?.map((r) => (
          <li key={r.id} className="rounded-xl border border-rose-200 bg-white p-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="font-medium text-stone-800">{r.user.name}</p>
                <p className="text-sm text-stone-500">{r.user.phone}</p>
              </div>
              <span className={`text-sm font-medium ${statusColor[r.status]}`}>
                {statusLabel[r.status]}
              </span>
            </div>

            <p className="mt-2 text-sm text-stone-500">Números</p>
            <p className="font-medium text-stone-800">
              {r.numbers.map((n) => n.number).join(", ")}
            </p>
            <p className="mt-1 text-sm text-stone-500">{formatBRL(r.totalCents)}</p>

            {r.status === "PENDING" && (
              <div className="mt-3 flex gap-2">
                <button
                  onClick={() => handleAction(r.id, "confirmar")}
                  disabled={busyId === r.id}
                  className="rounded-full bg-emerald-600 px-4 py-1.5 text-sm text-white hover:bg-emerald-700 disabled:opacity-60"
                >
                  Confirmar pagamento
                </button>
                <button
                  onClick={() => handleAction(r.id, "liberar")}
                  disabled={busyId === r.id}
                  className="rounded-full border border-stone-300 px-4 py-1.5 text-sm text-stone-600 hover:bg-stone-50 disabled:opacity-60"
                >
                  Liberar número
                </button>
              </div>
            )}

            {r.status === "PAID" && (
              <button
                onClick={() => handleAction(r.id, "liberar")}
                disabled={busyId === r.id}
                className="mt-3 rounded-full border border-stone-300 px-4 py-1.5 text-sm text-stone-600 hover:bg-stone-50 disabled:opacity-60"
              >
                Reverter / liberar número
              </button>
            )}
          </li>
        ))}
      </ul>

      {reservations && reservations.length === 0 && (
        <p className="text-stone-500">Nenhuma reserva ainda.</p>
      )}
    </div>
  );
}
