"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

const MINHAS_RESERVAS_KEY = "brenda:minhas_reservas";

type Reservation = {
  id: string;
  status: "PENDING" | "PAID" | "CANCELED";
  totalCents: number;
  createdAt: string;
  numbers: { number: number }[];
};

function formatBRL(cents: number) {
  return (cents / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

const statusLabel: Record<Reservation["status"], string> = {
  PENDING: "Aguardando pagamento",
  PAID: "Pago",
  CANCELED: "Cancelado",
};

export default function MinhasComprasPage() {
  const [reservations, setReservations] = useState<Reservation[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let ids: string[] = [];
    try {
      const raw = localStorage.getItem(MINHAS_RESERVAS_KEY);
      ids = raw ? JSON.parse(raw) : [];
    } catch {
      ids = [];
    }

    if (ids.length === 0) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setReservations([]);
      return;
    }

    fetch(`/api/reservas?ids=${ids.join(",")}`)
      .then(async (res) => {
        const data = await res.json();
        if (!res.ok) {
          setError(data.error ?? "Não foi possível carregar suas reservas.");
          return;
        }
        setReservations(data.reservations);
      })
      .catch(() => setError("Erro de conexão."));
  }, []);

  return (
    <div className="mx-auto w-full max-w-sm px-4 py-8">
      <h1 className="mb-1 text-xl font-semibold text-rose-800">Minhas compras</h1>
      <p className="mb-4 text-sm text-stone-500">
        Reservas feitas neste navegador.
      </p>

      {error && <p className="text-sm text-red-600">{error}</p>}

      {reservations && reservations.length === 0 && (
        <p className="text-stone-500">Você ainda não escolheu nenhum número.</p>
      )}

      <ul className="flex flex-col gap-3">
        {reservations?.map((r) => (
          <li key={r.id} className="rounded-xl border border-rose-200 bg-white p-4">
            <p className="text-sm text-stone-500">Números</p>
            <p className="font-medium text-stone-800">
              {r.numbers.map((n) => n.number).join(", ")}
            </p>
            <p className="mt-1 text-sm text-stone-500">
              {formatBRL(r.totalCents)} · {statusLabel[r.status]}
            </p>
            <Link
              href={`/reserva/${r.id}`}
              className="mt-2 inline-block text-sm font-medium text-rose-700 underline"
            >
              {r.status === "PENDING" ? "Ver Pix / cancelar" : "Ver detalhes"}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
