"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

type SlotStatus = "AVAILABLE" | "RESERVED" | "PAID";
type Slot = { number: number; status: SlotStatus };

const PRICE_CENTS = 2500;
const SELECTION_STORAGE_KEY = "brenda:selecao";

function formatBRL(cents: number) {
  return (cents / 100).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

export default function NumberGrid() {
  const router = useRouter();
  const [slots, setSlots] = useState<Slot[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<number[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function loadSlots() {
    setLoading(true);
    try {
      const res = await fetch("/api/numeros", { cache: "no-store" });
      const data = await res.json();
      setSlots(data.numbers as Slot[]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadSlots();

    const saved = sessionStorage.getItem(SELECTION_STORAGE_KEY);
    if (saved) {
      try {
        setSelected(JSON.parse(saved));
      } catch {
        // ignora seleção salva inválida
      }
      sessionStorage.removeItem(SELECTION_STORAGE_KEY);
    }
  }, []);

  function toggle(slot: Slot) {
    if (slot.status !== "AVAILABLE") return;
    setError(null);
    setSelected((prev) =>
      prev.includes(slot.number)
        ? prev.filter((n) => n !== slot.number)
        : [...prev, slot.number]
    );
  }

  const totalCents = selected.length * PRICE_CENTS;

  async function handleContinue() {
    if (selected.length === 0) return;
    setError(null);
    setSubmitting(true);

    try {
      const meRes = await fetch("/api/auth/me");
      const meData = await meRes.json();

      if (!meData.user) {
        sessionStorage.setItem(SELECTION_STORAGE_KEY, JSON.stringify(selected));
        router.push("/login?redirect=/");
        return;
      }

      const res = await fetch("/api/reservas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ numbers: selected }),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? "Não foi possível concluir a reserva.");
        await loadSlots();
        setSelected([]);
        return;
      }

      router.push(`/reserva/${data.reservation.id}`);
    } catch {
      setError("Erro de conexão. Tente novamente.");
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return <p className="px-4 py-8 text-center text-stone-500">Carregando números…</p>;
  }

  return (
    <div className="pb-28">
      <div className="grid grid-cols-5 gap-2 px-4 sm:grid-cols-10">
        {slots.map((slot) => {
          const isSelected = selected.includes(slot.number);
          const base =
            "aspect-square rounded-lg text-sm font-medium flex items-center justify-center transition-colors";

          let classes = "";
          if (slot.status === "PAID") {
            classes = `${base} bg-rose-600 text-white cursor-not-allowed`;
          } else if (slot.status === "RESERVED") {
            classes = `${base} bg-stone-200 text-stone-400 cursor-not-allowed`;
          } else if (isSelected) {
            classes = `${base} bg-rose-500 text-white ring-2 ring-rose-700 cursor-pointer`;
          } else {
            classes = `${base} bg-white text-stone-700 border border-rose-200 hover:border-rose-400 cursor-pointer`;
          }

          return (
            <button
              key={slot.number}
              type="button"
              disabled={slot.status !== "AVAILABLE"}
              onClick={() => toggle(slot)}
              className={classes}
              aria-pressed={isSelected}
              title={
                slot.status === "PAID"
                  ? "Já foi presenteado"
                  : slot.status === "RESERVED"
                  ? "Reservado por outra pessoa"
                  : `Selecionar número ${slot.number}`
              }
            >
              {slot.number}
            </button>
          );
        })}
      </div>

      <div className="mx-4 mt-4 flex flex-wrap gap-4 text-xs text-stone-500">
        <span className="flex items-center gap-1">
          <span className="inline-block h-3 w-3 rounded border border-rose-200 bg-white" /> Disponível
        </span>
        <span className="flex items-center gap-1">
          <span className="inline-block h-3 w-3 rounded bg-rose-500" /> Selecionado
        </span>
        <span className="flex items-center gap-1">
          <span className="inline-block h-3 w-3 rounded bg-stone-200" /> Reservado
        </span>
        <span className="flex items-center gap-1">
          <span className="inline-block h-3 w-3 rounded bg-rose-600" /> Presenteado
        </span>
      </div>

      {selected.length > 0 && (
        <div className="fixed inset-x-0 bottom-0 z-10 border-t border-rose-200 bg-white px-4 py-3 shadow-lg">
          <div className="mx-auto flex max-w-3xl items-center justify-between gap-4">
            <div className="text-sm">
              <p className="font-medium text-stone-800">
                {selected.length} número{selected.length > 1 ? "s" : ""} selecionado
                {selected.length > 1 ? "s" : ""}
              </p>
              <p className="text-stone-500">Total: {formatBRL(totalCents)}</p>
            </div>
            <button
              onClick={handleContinue}
              disabled={submitting}
              className="rounded-full bg-rose-600 px-5 py-2 font-medium text-white hover:bg-rose-700 disabled:opacity-60"
            >
              {submitting ? "Aguarde…" : "Continuar para pagamento"}
            </button>
          </div>
          {error && <p className="mx-auto mt-2 max-w-3xl text-sm text-red-600">{error}</p>}
        </div>
      )}
    </div>
  );
}
