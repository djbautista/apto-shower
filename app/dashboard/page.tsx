"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Attendee, GiftSuggestion } from "@/lib/types";
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
        body: JSON.stringify({ budget }),
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
    handleSuggest();
  }

  function handleChangeGift() {
    setAttendee((prev) => (prev ? { ...prev, gift_description: null } : null));
    setSuggestion(null);
    setShowBudget(true);
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
              <p className="text-sm text-charcoal/50">
                Presupuesto: {formatCOP(attendee.budget!)}
              </p>
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
            {showBudget && (
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
              </div>
            )}

            {suggestion && !showBudget && (
              <div className="space-y-3">
                <p className="text-sm text-charcoal/60 text-center">
                  Sugerencia para tu presupuesto de {formatCOP(budget)}
                </p>
                <GiftCard
                  suggestion={suggestion}
                  onAccept={handleAccept}
                  onReject={handleReject}
                  loading={saving || loading}
                />
              </div>
            )}
          </div>
        )}
      </div>
    </main>
  );
}
