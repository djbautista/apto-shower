"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Attendee, GiftSuggestion, GiftValidationResult } from "@/lib/types";
import GiftCard from "@/components/GiftCard";
import BudgetInput from "@/components/BudgetInput";

const formatCOP = (value: number) =>
  new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    maximumFractionDigits: 0,
  }).format(value);

export default function Dashboard() {
  const router = useRouter();
  const [attendee, setAttendee] = useState<Attendee | null>(null);
  const [budget, setBudget] = useState(0);
  const [suggestion, setSuggestion] = useState<GiftSuggestion | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [showBudget, setShowBudget] = useState(true);
  const [editingBudget, setEditingBudget] = useState(false);
  const [updatingBudget, setUpdatingBudget] = useState(false);
  const [editingSuggestionBudget, setEditingSuggestionBudget] = useState(false);
  const [prevBudget, setPrevBudget] = useState(0);
  const [discardedGifts, setDiscardedGifts] = useState<string[]>([]);
  const [showCustomInput, setShowCustomInput] = useState(false);
  const [customIdea, setCustomIdea] = useState("");
  const [validationResult, setValidationResult] = useState<GiftValidationResult | null>(null);
  const [validating, setValidating] = useState(false);

  useEffect(() => {
    fetch("/api/auth", { method: "GET" })
      .then((res) => {
        if (!res.ok) {
          router.push("/");
          return null;
        }
        return res.json();
      })
      .then((data) => {
        if (data?.attendee) {
          setAttendee(data.attendee);
          if (data.attendee.budget) setBudget(data.attendee.budget);
          const stored = localStorage.getItem(`discarded-gifts-${data.attendee.id}`);
          if (stored) setDiscardedGifts(JSON.parse(stored));
        }
      })
      .catch(() => router.push("/"));
  }, [router]);

  async function handleSuggest() {
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/suggest-gift", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ budget, discardedGifts }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error);
      }
      const { suggestion: s } = await res.json();
      setSuggestion(s);
      setShowBudget(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al sugerir regalo");
    } finally {
      setLoading(false);
    }
  }

  async function handleAccept() {
    if (!suggestion) return;
    setSaving(true);
    setError("");
    try {
      const res = await fetch("/api/update-gift", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          gift: `${suggestion.regalo} - ${suggestion.descripcion}`,
          budget,
        }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error);
      }
      const { attendee: updated } = await res.json();
      setAttendee(updated);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al guardar");
    } finally {
      setSaving(false);
    }
  }

  function handleReject() {
    if (suggestion) {
      const updated = [...discardedGifts, suggestion.regalo];
      setDiscardedGifts(updated);
      if (attendee) localStorage.setItem(`discarded-gifts-${attendee.id}`, JSON.stringify(updated));
    }
    handleSuggest();
  }

  async function handleUpdateBudget() {
    setUpdatingBudget(true);
    setError("");
    let updatedDiscarded = discardedGifts;
    if (attendee?.gift_description) {
      updatedDiscarded = [...discardedGifts, attendee.gift_description.split(" - ")[0]];
      setDiscardedGifts(updatedDiscarded);
      localStorage.setItem(`discarded-gifts-${attendee.id}`, JSON.stringify(updatedDiscarded));
    }
    try {
      // 1. Get a new gift suggestion for the updated budget
      const suggestRes = await fetch("/api/suggest-gift", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ budget, discardedGifts: updatedDiscarded }),
      });
      if (!suggestRes.ok) {
        const data = await suggestRes.json();
        throw new Error(data.error);
      }
      const { suggestion: newSuggestion } = await suggestRes.json();

      // 2. Save the new gift + budget together
      const updateRes = await fetch("/api/update-gift", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          gift: `${newSuggestion.regalo} - ${newSuggestion.descripcion}`,
          budget,
        }),
      });
      if (!updateRes.ok) {
        const data = await updateRes.json();
        throw new Error(data.error);
      }
      const { attendee: updated } = await updateRes.json();
      setAttendee(updated);
      setEditingBudget(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al actualizar presupuesto");
    } finally {
      setUpdatingBudget(false);
    }
  }

  function handleChangeGift() {
    if (attendee?.gift_description) {
      const updated = [...discardedGifts, attendee.gift_description.split(" - ")[0]];
      setDiscardedGifts(updated);
      localStorage.setItem(`discarded-gifts-${attendee.id}`, JSON.stringify(updated));
    }
    setAttendee((prev) => (prev ? { ...prev, gift_description: null } : null));
    setSuggestion(null);
    setShowBudget(true);
  }

  async function handleValidateCustomIdea() {
    if (!customIdea.trim()) return;
    setError("");
    setValidating(true);
    setValidationResult(null);
    try {
      const res = await fetch("/api/validate-gift", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ giftIdea: customIdea, budget }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error);
      }
      const { result } = await res.json();
      setValidationResult(result);
      setShowBudget(false);
      setShowCustomInput(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al validar regalo");
    } finally {
      setValidating(false);
    }
  }

  function handleAcceptValidated(gift: GiftSuggestion) {
    setSuggestion(gift);
    setValidationResult(null);
    // Trigger accept with this gift
    setSaving(true);
    setError("");
    fetch("/api/update-gift", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        gift: `${gift.regalo} - ${gift.descripcion}`,
        budget,
      }),
    })
      .then(async (res) => {
        if (!res.ok) {
          const data = await res.json();
          throw new Error(data.error);
        }
        const { attendee: updated } = await res.json();
        setAttendee(updated);
      })
      .catch((err) => {
        setError(err instanceof Error ? err.message : "Error al guardar");
      })
      .finally(() => setSaving(false));
  }

  function handleRejectValidated() {
    setValidationResult(null);
    setShowCustomInput(true);
    setCustomIdea("");
  }

  const hasGift = attendee?.gift_description;

  return (
    <main className="min-h-screen p-4 flex items-start justify-center pt-12">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-charcoal">Apto Shower</h1>
          {attendee && (
            <p className="text-charcoal/60 mt-1">
              Hola, {attendee.name}
            </p>
          )}
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-xl text-sm text-center">
            {error}
          </div>
        )}

        {hasGift ? (
          <div className="space-y-4">
            <div className="text-center">
              <p className="text-sm text-charcoal/60 mb-1">Tu regalo seleccionado</p>
              {editingBudget ? (
                <div className="flex items-center justify-center gap-2 mt-2">
                  <BudgetInput
                    budget={budget}
                    onChange={setBudget}
                    onSubmit={handleUpdateBudget}
                    loading={updatingBudget}
                    submitLabel="Actualizar presupuesto"
                  />
                </div>
              ) : (
                <p
                  className="text-sm text-charcoal/50 cursor-pointer hover:text-charcoal/70 transition-colors"
                  onClick={() => setEditingBudget(true)}
                  title="Clic para editar presupuesto"
                >
                  Presupuesto: {formatCOP(attendee.budget!)} ✎
                </p>
              )}
            </div>
            <GiftCard
              suggestion={{
                regalo: attendee.gift_description!.split(" - ")[0],
                precioEstimado: attendee.budget!,
                descripcion: attendee.gift_description!.split(" - ").slice(1).join(" - "),
              }}
              accepted
              onChangeGift={handleChangeGift}
            />
          </div>
        ) : (
          <div className="space-y-6">
            {showBudget && !showCustomInput && (
              <div className="bg-white rounded-2xl shadow-lg border border-warm-200 p-6">
                <h2 className="text-lg font-semibold text-charcoal mb-4">
                  ¿Cuál es tu presupuesto?
                </h2>
                <BudgetInput
                  budget={budget}
                  onChange={setBudget}
                  onSubmit={handleSuggest}
                  loading={loading}
                />
                {budget > 0 && (
                  <button
                    type="button"
                    onClick={() => setShowCustomInput(true)}
                    className="w-full mt-3 py-2 text-sm text-charcoal/60 hover:text-charcoal transition-colors underline underline-offset-2"
                  >
                    Tengo una idea
                  </button>
                )}
              </div>
            )}

            {showBudget && showCustomInput && (
              <div className="bg-white rounded-2xl shadow-lg border border-warm-200 p-6 space-y-4">
                <h2 className="text-lg font-semibold text-charcoal">
                  ¿Cuál es tu idea?
                </h2>
                <p className="text-sm text-charcoal/60">
                  Presupuesto: {formatCOP(budget)}
                </p>
                <input
                  type="text"
                  value={customIdea}
                  onChange={(e) => setCustomIdea(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleValidateCustomIdea()}
                  placeholder="Ej: Licuadora, juego de sábanas..."
                  className="w-full border border-warm-200 rounded-xl px-4 py-3 text-charcoal focus:outline-none focus:ring-2 focus:ring-warm-400"
                />
                <div className="flex gap-2">
                  <button
                    onClick={handleValidateCustomIdea}
                    disabled={validating || !customIdea.trim()}
                    className="flex-1 bg-charcoal text-white py-3 rounded-xl font-medium hover:bg-charcoal/90 transition-colors disabled:opacity-50"
                  >
                    {validating ? "Validando..." : "Validar idea"}
                  </button>
                  <button
                    onClick={() => {
                      setShowCustomInput(false);
                      setCustomIdea("");
                    }}
                    className="px-4 py-3 text-charcoal/60 hover:text-charcoal transition-colors"
                  >
                    Volver
                  </button>
                </div>
              </div>
            )}

            {suggestion && !showBudget && !validationResult && (
              <div className="space-y-3">
                {editingSuggestionBudget ? (
                  <BudgetInput
                    budget={budget}
                    onChange={setBudget}
                    onSubmit={async () => {
                      if (suggestion) {
                        const updated = [...discardedGifts, suggestion.regalo];
                        setDiscardedGifts(updated);
                        if (attendee) localStorage.setItem(`discarded-gifts-${attendee.id}`, JSON.stringify(updated));
                      }
                      setEditingSuggestionBudget(false);
                      await handleSuggest();
                    }}
                    onCancel={() => {
                      setBudget(prevBudget);
                      setEditingSuggestionBudget(false);
                    }}
                    loading={loading}
                    submitLabel="Actualizar"
                  />
                ) : (
                  <p
                    className="text-sm text-charcoal/60 text-center cursor-pointer hover:text-charcoal/70 transition-colors"
                    onClick={() => {
                      setPrevBudget(budget);
                      setEditingSuggestionBudget(true);
                    }}
                    title="Clic para editar presupuesto"
                  >
                    Sugerencia para tu presupuesto de {formatCOP(budget)} ✎
                  </p>
                )}
                <GiftCard
                  suggestion={suggestion}
                  onAccept={handleAccept}
                  onReject={handleReject}
                  loading={saving || loading}
                />
              </div>
            )}

            {validationResult && !validationResult.conflict && validationResult.validatedGift && (
              <div className="space-y-3">
                <p className="text-sm text-charcoal/60 text-center">
                  Tu idea de regalo
                </p>
                <GiftCard
                  suggestion={validationResult.validatedGift}
                  onAccept={() => handleAcceptValidated(validationResult.validatedGift!)}
                  onReject={handleRejectValidated}
                  loading={saving}
                />
              </div>
            )}

            {validationResult && validationResult.conflict && (
              <div className="space-y-4">
                <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 text-sm text-amber-800 text-center">
                  Tu idea entra en conflicto con un regalo ya seleccionado: <strong>&quot;{validationResult.conflictingGift}&quot;</strong>
                </div>
                {validationResult.alternativeSuggestion && (
                  <div className="space-y-2">
                    <p className="text-sm text-charcoal/60 text-center">
                      Te sugerimos esta alternativa:
                    </p>
                    <GiftCard
                      suggestion={validationResult.alternativeSuggestion}
                      onAccept={() => handleAcceptValidated(validationResult.alternativeSuggestion!)}
                      onReject={handleRejectValidated}
                      loading={saving}
                    />
                  </div>
                )}
                <button
                  onClick={() => {
                    setValidationResult(null);
                    setShowCustomInput(true);
                    setShowBudget(true);
                  }}
                  className="w-full py-2 text-sm text-charcoal/60 hover:text-charcoal transition-colors underline underline-offset-2"
                >
                  Intentar con otra idea
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </main>
  );
}
