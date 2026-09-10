"use client";

import { useEffect, useState } from "react";

type Status = "PENDING" | "PAID" | "CANCELED";

type Reservation = {
  id: string;
  status: Status;
  totalCents: number;
  createdAt: string;
  buyerName: string;
  buyerPhone: string;
  buyerConfirmedAt: string | null;
  numbers: { number: number }[];
};

type Counts = Record<Status, number>;

function formatBRL(cents: number) {
  return (cents / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

const statusLabel: Record<Status, string> = {
  PENDING: "Pendente",
  PAID: "Pago",
  CANCELED: "Cancelado",
};

const statusColor: Record<Status, string> = {
  PENDING: "text-amber-600",
  PAID: "text-emerald-600",
  CANCELED: "text-stone-400",
};

const tabs: { status: Status; label: string }[] = [
  { status: "PENDING", label: "Pendentes de análise" },
  { status: "PAID", label: "Aprovados" },
  { status: "CANCELED", label: "Cancelados" },
];

export default function AdminPage() {
  const [activeStatus, setActiveStatus] = useState<Status>("PENDING");
  const [page, setPage] = useState(1);
  const [reservations, setReservations] = useState<Reservation[] | null>(null);
  const [total, setTotal] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const [counts, setCounts] = useState<Counts>({ PENDING: 0, PAID: 0, CANCELED: 0 });
  const [totalConfirmedCents, setTotalConfirmedCents] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [releaseTarget, setReleaseTarget] = useState<Reservation | null>(null);

  async function load(status: Status, pageToLoad: number) {
    const res = await fetch(
      `/api/admin/reservas?status=${status}&page=${pageToLoad}`,
      { cache: "no-store" }
    );
    const data = await res.json();
    if (!res.ok) {
      setError(data.error ?? "Acesso negado.");
      return;
    }
    setError(null);
    setReservations(data.reservations);
    setTotal(data.total);
    setPageSize(data.pageSize);
    setCounts(data.counts);
    setTotalConfirmedCents(data.totalConfirmedCents);

    // Se a ação de alguém esvaziou a última página, volta uma página.
    if (data.reservations.length === 0 && pageToLoad > 1) {
      setPage(pageToLoad - 1);
    }
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load(activeStatus, page);
  }, [activeStatus, page]);

  function selectTab(status: Status) {
    setActiveStatus(status);
    setPage(1);
  }

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
      await load(activeStatus, page);
    } finally {
      setBusyId(null);
    }
  }

  async function handleConfirmRelease() {
    if (!releaseTarget) return;
    await handleAction(releaseTarget.id, "liberar");
    setReleaseTarget(null);
  }

  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  return (
    <div className="mx-auto w-full max-w-2xl px-4 py-8">
      <h1 className="mb-1 text-xl font-semibold text-rose-800">Painel admin</h1>
      <p className="mb-6 text-sm text-stone-500">
        Total confirmado:{" "}
        <span className="font-medium">{formatBRL(totalConfirmedCents)}</span>
      </p>

      <div className="mb-6 flex flex-wrap gap-2">
        {tabs.map((tab) => (
          <button
            key={tab.status}
            onClick={() => selectTab(tab.status)}
            className={`rounded-full px-4 py-1.5 text-sm font-medium ${
              activeStatus === tab.status
                ? "bg-rose-600 text-white"
                : "border border-rose-200 text-stone-600 hover:bg-rose-50"
            }`}
          >
            {tab.label} ({counts[tab.status]})
          </button>
        ))}
      </div>

      {error && <p className="mb-4 text-sm text-red-600">{error}</p>}

      <ul className="flex flex-col gap-3">
        {reservations?.map((r) => (
          <li key={r.id} className="rounded-xl border border-rose-200 bg-white p-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="font-medium text-stone-800">{r.buyerName}</p>
                <p className="text-sm text-stone-500">{r.buyerPhone}</p>
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
            {r.status === "PENDING" && r.buyerConfirmedAt && (
              <p className="mt-1 text-sm font-medium text-emerald-600">
                ✓ Comprador avisou que já pagou
              </p>
            )}

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
                  onClick={() => setReleaseTarget(r)}
                  disabled={busyId === r.id}
                  className="rounded-full border border-stone-300 px-4 py-1.5 text-sm text-stone-600 hover:bg-stone-50 disabled:opacity-60"
                >
                  Liberar número
                </button>
              </div>
            )}

            {r.status === "PAID" && (
              <button
                onClick={() => setReleaseTarget(r)}
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
        <p className="text-stone-500">Nenhuma reserva nessa categoria.</p>
      )}

      {total > pageSize && (
        <div className="mt-6 flex items-center justify-center gap-3 text-sm">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page <= 1}
            className="rounded-full border border-stone-300 px-3 py-1.5 text-stone-600 hover:bg-stone-50 disabled:opacity-40"
          >
            Anterior
          </button>
          <span className="text-stone-500">
            Página {page} de {totalPages}
          </span>
          <button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page >= totalPages}
            className="rounded-full border border-stone-300 px-3 py-1.5 text-stone-600 hover:bg-stone-50 disabled:opacity-40"
          >
            Próxima
          </button>
        </div>
      )}

      {releaseTarget && (
        <div className="fixed inset-0 z-30 flex items-center justify-center bg-stone-900/40 px-4">
          <div className="w-full max-w-sm rounded-xl border border-rose-200 bg-white p-5 shadow-lg">
            <h2 className="text-lg font-semibold text-rose-800">
              Liberar número{releaseTarget.numbers.length > 1 ? "s" : ""}?
            </h2>
            <p className="mt-2 text-sm text-stone-600">
              Número{releaseTarget.numbers.length > 1 ? "s" : ""}{" "}
              {releaseTarget.numbers.map((n) => n.number).join(", ")} (de{" "}
              {releaseTarget.buyerName}) vai voltar a ficar disponível para
              outras pessoas. Essa ação não pode ser desfeita.
            </p>
            <div className="mt-5 flex gap-2">
              <button
                onClick={() => setReleaseTarget(null)}
                disabled={busyId === releaseTarget.id}
                className="flex-1 rounded-full border border-stone-300 px-4 py-2 text-sm text-stone-600 hover:bg-stone-50 disabled:opacity-60"
              >
                Manter
              </button>
              <button
                onClick={handleConfirmRelease}
                disabled={busyId === releaseTarget.id}
                className="flex-1 rounded-full bg-rose-600 px-4 py-2 text-sm text-white hover:bg-rose-700 disabled:opacity-60"
              >
                {busyId === releaseTarget.id ? "Liberando…" : "Sim, liberar"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
