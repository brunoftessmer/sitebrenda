"use client";

import { use, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

type ReservationData = {
  id: string;
  status: "PENDING" | "PAID" | "CANCELED";
  totalCents: number;
  numbers: number[];
};

type PixData = { payload: string; qrCodeDataUrl: string } | null;

function formatBRL(cents: number) {
  return (cents / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

export default function ReservaPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();

  const [reservation, setReservation] = useState<ReservationData | null>(null);
  const [pix, setPix] = useState<PixData>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [canceling, setCanceling] = useState(false);
  const [copied, setCopied] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [confirmingPayment, setConfirmingPayment] = useState(false);

  async function load() {
    setLoading(true);
    try {
      const res = await fetch(`/api/reservas/${id}`, { cache: "no-store" });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Não foi possível carregar a reserva.");
        return;
      }
      setReservation(data.reservation);
      setPix(data.pix);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  async function handleCopy() {
    if (!pix) return;
    await navigator.clipboard.writeText(pix.payload);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  function handleConfirmPayment() {
    // Só um aviso visual pro comprador — quem confirma o pagamento de fato é
    // a Brenda no painel admin, depois de checar o Pix na conta dela.
    setConfirmingPayment(true);
  }

  async function handleCancel() {
    setCanceling(true);
    try {
      const res = await fetch(`/api/reservas/${id}/cancelar`, { method: "POST" });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Não foi possível cancelar.");
        setShowCancelModal(false);
        return;
      }
      router.push("/");
      router.refresh();
    } finally {
      setCanceling(false);
    }
  }

  if (loading) {
    return <p className="px-4 py-10 text-center text-stone-500">Carregando…</p>;
  }

  if (error && !reservation) {
    return (
      <div className="mx-auto max-w-sm px-4 py-10 text-center">
        <p className="text-red-600">{error}</p>
        <Link href="/" className="mt-4 inline-block text-rose-700 underline">
          Voltar para a página inicial
        </Link>
      </div>
    );
  }

  if (!reservation) return null;

  return (
    <div className="mx-auto w-full max-w-sm px-4 py-8">
      <h1 className="text-xl font-semibold text-rose-800">Sua reserva</h1>

      <div className="mt-4 rounded-xl border border-rose-200 bg-white p-4">
        <p className="text-sm text-stone-500">Números escolhidos</p>
        <p className="text-lg font-medium text-stone-800">
          {reservation.numbers.join(", ")}
        </p>
        <p className="mt-2 text-sm text-stone-500">Total</p>
        <p className="text-lg font-medium text-stone-800">
          {formatBRL(reservation.totalCents)}
        </p>
        <p className="mt-2 text-sm text-stone-500">Status</p>
        <p className="text-lg font-medium text-stone-800">
          {reservation.status === "PENDING" && "Aguardando pagamento"}
          {reservation.status === "PAID" && "Pagamento confirmado 🎉"}
          {reservation.status === "CANCELED" && "Cancelada"}
        </p>
      </div>

      {reservation.status === "PENDING" && pix && (
        <div className="mt-6 flex flex-col items-center gap-3 rounded-xl border border-rose-200 bg-white p-4 text-center">
          <p className="text-sm text-stone-600">
            Escaneie o QR code abaixo no app do seu banco para pagar via Pix:
          </p>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={pix.qrCodeDataUrl} alt="QR code Pix" className="h-56 w-56" />
          <button
            onClick={handleCopy}
            className="w-full rounded-full border border-rose-300 px-4 py-2 text-sm text-rose-700 hover:bg-rose-50"
          >
            {copied ? "Copiado!" : "Copiar código Pix"}
          </button>

          {confirmingPayment ? (
            <>
              <p className="text-sm font-medium text-emerald-700">
                Obrigada! Assim que a Brenda confirmar o pagamento, seu número
                fica garantido. 🎉
              </p>
              <button
                onClick={() => router.push("/")}
                className="w-full rounded-full border border-rose-300 px-4 py-2 text-sm text-rose-700 hover:bg-rose-50"
              >
                Voltar para os números
              </button>
            </>
          ) : (
            <button
              onClick={handleConfirmPayment}
              className="w-full rounded-full bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700"
            >
              Já paguei
            </button>
          )}

          <p className="text-xs text-stone-400">
            Depois de pagar, aguarde a confirmação da Brenda. Não é necessário
            enviar comprovante pelo site.
          </p>
        </div>
      )}

      {reservation.status === "PENDING" && (
        <button
          onClick={() => setShowCancelModal(true)}
          disabled={canceling || confirmingPayment}
          className="mt-4 w-full rounded-full border border-stone-300 px-4 py-2 text-sm text-stone-600 hover:bg-stone-50 disabled:opacity-60"
        >
          {canceling ? "Cancelando…" : "Cancelar reserva"}
        </button>
      )}

      {error && <p className="mt-3 text-sm text-red-600">{error}</p>}

      <Link href="/" className="mt-6 block text-center text-sm text-rose-700 underline">
        Voltar para a página inicial
      </Link>

      {showCancelModal && (
        <div className="fixed inset-0 z-30 flex items-center justify-center bg-stone-900/40 px-4">
          <div className="w-full max-w-sm rounded-xl border border-rose-200 bg-white p-5 shadow-lg">
            <h2 className="text-lg font-semibold text-rose-800">Cancelar reserva?</h2>
            <p className="mt-2 text-sm text-stone-600">
              Os números {reservation.numbers.join(", ")} vão voltar a ficar
              disponíveis para outras pessoas. Essa ação não pode ser desfeita.
            </p>
            <div className="mt-5 flex gap-2">
              <button
                onClick={() => setShowCancelModal(false)}
                disabled={canceling}
                className="flex-1 rounded-full border border-stone-300 px-4 py-2 text-sm text-stone-600 hover:bg-stone-50 disabled:opacity-60"
              >
                Manter reserva
              </button>
              <button
                onClick={handleCancel}
                disabled={canceling}
                className="flex-1 rounded-full bg-rose-600 px-4 py-2 text-sm text-white hover:bg-rose-700 disabled:opacity-60"
              >
                {canceling ? "Cancelando…" : "Sim, cancelar"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
