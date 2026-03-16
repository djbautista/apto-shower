"use client";

import { GiftSuggestion } from "@/lib/types";

const formatCOP = (value: number) =>
  new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    maximumFractionDigits: 0,
  }).format(value);

interface GiftCardProps {
  suggestion: GiftSuggestion;
  onAccept?: () => void;
  onReject?: () => void;
  onChangeGift?: () => void;
  accepted?: boolean;
  loading?: boolean;
}

export default function GiftCard({
  suggestion,
  onAccept,
  onReject,
  onChangeGift,
  accepted,
  loading,
}: GiftCardProps) {
  return (
    <div className="bg-white rounded-2xl border border-warm-200 p-6 space-y-4 shadow-sm">
      <div>
        <h3 className="text-xl font-bold text-charcoal">{suggestion.regalo}</h3>
        <p className="text-coral-500 font-semibold text-lg mt-1">
          {formatCOP(suggestion.precioEstimado)}
        </p>
      </div>
      <p className="text-charcoal/70 leading-relaxed">{suggestion.descripcion}</p>

      {!accepted && onAccept && onReject && (
        <div className="flex gap-3 pt-2">
          <button
            onClick={onAccept}
            disabled={loading}
            className="flex-1 py-2.5 bg-coral-500 hover:bg-coral-600 text-white font-semibold rounded-xl transition disabled:opacity-50"
          >
            {loading ? "Guardando..." : "Aceptar"}
          </button>
          <button
            onClick={onReject}
            disabled={loading}
            className="flex-1 py-2.5 bg-warm-100 hover:bg-warm-200 text-charcoal font-semibold rounded-xl transition disabled:opacity-50"
          >
            Sugerir otro
          </button>
        </div>
      )}

      {accepted && onChangeGift && (
        <button
          onClick={onChangeGift}
          className="w-full py-2.5 bg-warm-100 hover:bg-warm-200 text-charcoal font-semibold rounded-xl transition"
        >
          Cambiar regalo
        </button>
      )}
    </div>
  );
}
