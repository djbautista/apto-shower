"use client";

import { useState, useEffect } from "react";

interface Gift {
  gift_description: string;
  budget: number;
}

const STORAGE_KEY = "gifts_passcode";

const formatCOP = (value: number) =>
  new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    maximumFractionDigits: 0,
  }).format(value);

async function fetchGifts(code: string): Promise<Gift[]> {
  const res = await fetch("/api/gifts", {
    headers: { Authorization: code },
  });
  if (!res.ok) {
    throw new Error("Contraseña incorrecta");
  }
  const data = await res.json();
  return data.gifts;
}

export default function GiftsPage() {
  const [passcode, setPasscode] = useState("");
  const [gifts, setGifts] = useState<Gift[] | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      fetchGifts(saved)
        .then((g) => setGifts(g))
        .catch(() => localStorage.removeItem(STORAGE_KEY))
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const g = await fetchGifts(passcode);
      localStorage.setItem(STORAGE_KEY, passcode);
      setGifts(g);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error inesperado");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen p-4 flex items-start justify-center pt-12">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-charcoal">Apto Shower</h1>
        </div>

        {loading && gifts === null ? (
          <div className="text-center text-charcoal/60">Cargando...</div>
        ) : gifts === null ? (
          <div className="bg-white rounded-2xl shadow-lg border border-warm-200 p-6">
            <h2 className="text-lg font-semibold text-charcoal mb-4 text-center">
              Ingresa la contraseña
            </h2>
            <form onSubmit={handleSubmit} className="space-y-5">
              <input
                type="text"
                value={passcode}
                onChange={(e) => setPasscode(e.target.value)}
                placeholder="Contraseña"
                className="w-full px-4 py-3 rounded-xl border border-warm-200 bg-white focus:outline-none focus:ring-2 focus:ring-coral-400 focus:border-transparent transition"
                disabled={loading}
              />
              {error && (
                <p className="text-red-500 text-sm text-center">{error}</p>
              )}
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 px-4 bg-coral-500 hover:bg-coral-600 text-white font-semibold rounded-xl transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? "Verificando..." : "Ver regalos"}
              </button>
            </form>
          </div>
        ) : (
          <div className="space-y-4">
            <h2 className="text-xl font-semibold text-charcoal text-center">
              Regalos Seleccionados
            </h2>
            {gifts.length === 0 ? (
              <div className="bg-white rounded-2xl shadow-lg border border-warm-200 p-6 text-center text-charcoal/60">
                Aún no hay regalos seleccionados.
              </div>
            ) : (
              gifts.map((gift, i) => (
                <div
                  key={i}
                  className="bg-white rounded-2xl shadow-lg border border-warm-200 p-5"
                >
                  <p className="font-semibold text-charcoal">
                    {gift.gift_description}
                  </p>
                  <p className="text-sm text-coral-500 font-medium mt-2">
                    {formatCOP(gift.budget)}
                  </p>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </main>
  );
}
