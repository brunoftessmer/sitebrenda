"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

type SlotStatus = "AVAILABLE" | "RESERVED" | "PAID";
type Slot = { number: number; status: SlotStatus };

const PRICE_CENTS = 2500;
const BUYER_STORAGE_KEY = "brenda:comprador";
const MINHAS_RESERVAS_KEY = "brenda:minhas_reservas";

function addReservationToLocalHistory(id: string) {
  try {
    const raw = localStorage.getItem(MINHAS_RESERVAS_KEY);
    const ids: string[] = raw ? JSON.parse(raw) : [];
    localStorage.setItem(
      MINHAS_RESERVAS_KEY,
      JSON.stringify([id, ...ids.filter((existing) => existing !== id)].slice(0, 50))
    );
  } catch {
    // localStorage indisponível — segue sem guardar histórico
  }
}

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
  const [showBuyerModal, setShowBuyerModal] = useState(false);
  const [buyerName, setBuyerName] = useState("");
  const [buyerPhone, setBuyerPhone] = useState("");
  const [buyerError, setBuyerError] = useState<string | null>(null);

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

    try {
      const raw = localStorage.getItem(BUYER_STORAGE_KEY);
      if (raw) {
        const saved = JSON.parse(raw) as { name?: string; phone?: string };
        if (saved.name) setBuyerName(saved.name);
        if (saved.phone) setBuyerPhone(saved.phone);
      }
    } catch {
      // ignora dados salvos inválidos
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

  function handleContinue() {
    if (selected.length === 0) return;
    setError(null);
    setBuyerError(null);
    setShowBuyerModal(true);
  }

  async function handleConfirmReserva(e: React.FormEvent) {
    e.preventDefault();
    const name = buyerName.trim();
    const phone = buyerPhone.replace(/\D/g, "");

    if (name.length < 2) {
      setBuyerError("Informe seu nome completo.");
      return;
    }
    if (!/^\d{10,11}$/.test(phone)) {
      setBuyerError("Telefone deve ter 10 ou 11 dígitos (DDD + número).");
      return;
    }

    setBuyerError(null);
    setSubmitting(true);

    try {
      const res = await fetch("/api/reservas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, phone, numbers: selected }),
      });
      const data = await res.json();

      if (!res.ok) {
        setShowBuyerModal(false);
        setError(data.error ?? "Não foi possível concluir a reserva.");
        await loadSlots();
        setSelected([]);
        return;
      }

      try {
        localStorage.setItem(BUYER_STORAGE_KEY, JSON.stringify({ name, phone }));
      } catch {
        // localStorage indisponível — segue sem salvar
      }
      addReservationToLocalHistory(data.reservation.id);

      router.push(`/reserva/${data.reservation.id}`);
    } catch {
      setBuyerError("Erro de conexão. Tente novamente.");
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

      {showBuyerModal && (
        <div className="fixed inset-0 z-30 flex items-center justify-center bg-stone-900/40 px-4">
          <form
            onSubmit={handleConfirmReserva}
            className="w-full max-w-sm rounded-xl border border-rose-200 bg-white p-5 shadow-lg"
          >
            <h2 className="text-lg font-semibold text-rose-800">Quase lá!</h2>
            <p className="mt-1 text-sm text-stone-600">
              Informe seu nome e telefone para gerar o Pix d
              {selected.length > 1 ? "os números" : "o número"} {selected.join(", ")}.
              O número só fica reservado depois que você confirmar o pagamento
              na próxima tela.
            </p>

            <label className="mt-4 flex flex-col gap-1 text-sm text-stone-600">
              Nome completo
              <input
                className="rounded-lg border border-stone-300 px-3 py-2"
                value={buyerName}
                onChange={(e) => setBuyerName(e.target.value)}
                autoFocus
                required
              />
            </label>

            <label className="mt-3 flex flex-col gap-1 text-sm text-stone-600">
              Telefone (DDD + número)
              <input
                className="rounded-lg border border-stone-300 px-3 py-2"
                value={buyerPhone}
                onChange={(e) => setBuyerPhone(e.target.value)}
                inputMode="numeric"
                placeholder="11999999999"
                required
              />
            </label>

            {buyerError && <p className="mt-3 text-sm text-red-600">{buyerError}</p>}

            <div className="mt-5 flex gap-2">
              <button
                type="button"
                onClick={() => setShowBuyerModal(false)}
                disabled={submitting}
                className="flex-1 rounded-full border border-stone-300 px-4 py-2 text-sm text-stone-600 hover:bg-stone-50 disabled:opacity-60"
              >
                Voltar
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="flex-1 rounded-full bg-rose-600 px-4 py-2 text-sm text-white hover:bg-rose-700 disabled:opacity-60"
              >
                {submitting ? "Aguarde…" : "Gerar Pix"}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
