"use client";

const PRESETS = [50_000, 100_000, 150_000, 200_000, 300_000];

const formatCOP = (value: number) =>
  new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    maximumFractionDigits: 0,
  }).format(value);

interface BudgetInputProps {
  budget: number;
  onChange: (value: number) => void;
  onSubmit: () => void;
  loading?: boolean;
  submitLabel?: string;
}

export default function BudgetInput({
  budget,
  onChange,
  onSubmit,
  loading,
  submitLabel,
}: BudgetInputProps) {
  function handleInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    const raw = e.target.value.replace(/\D/g, "");
    onChange(raw ? parseInt(raw, 10) : 0);
  }

  const displayValue = budget > 0
    ? budget.toLocaleString("es-CO")
    : "";

  return (
    <div className="space-y-4">
      <div>
        <label htmlFor="budget" className="block text-sm font-medium mb-1.5">
          Presupuesto en COP
        </label>
        <div className="relative">
          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-charcoal/50 font-medium">
            $
          </span>
          <input
            id="budget"
            type="text"
            inputMode="numeric"
            value={displayValue}
            onChange={handleInputChange}
            placeholder="100.000"
            className="w-full pl-8 pr-4 py-3 rounded-xl border border-warm-200 bg-white focus:outline-none focus:ring-2 focus:ring-coral-400 focus:border-transparent transition text-lg"
            disabled={loading}
          />
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        {PRESETS.map((preset) => (
          <button
            key={preset}
            type="button"
            onClick={() => onChange(preset)}
            disabled={loading}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition ${
              budget === preset
                ? "bg-coral-500 text-white"
                : "bg-warm-100 hover:bg-warm-200 text-charcoal"
            } disabled:opacity-50`}
          >
            {formatCOP(preset)}
          </button>
        ))}
      </div>

      <button
        onClick={onSubmit}
        disabled={loading || budget <= 0}
        className="w-full py-3 bg-coral-500 hover:bg-coral-600 text-white font-semibold rounded-xl transition disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {loading ? (submitLabel ? "Actualizando..." : "Buscando regalo...") : (submitLabel || "Sugerir regalo")}
      </button>
    </div>
  );
}
