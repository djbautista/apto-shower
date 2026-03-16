"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function LoginForm() {
  const [name, setName] = useState("");
  const [pin, setPin] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (!name.trim()) {
      setError("Por favor ingresa tu nombre");
      return;
    }
    if (!/^\d{4}$/.test(pin)) {
      setError("El PIN debe ser de 4 dígitos");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim(), pin }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Error al iniciar sesión");
      }

      router.push("/dashboard");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error inesperado");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div>
        <label htmlFor="name" className="block text-sm font-medium mb-1.5">
          Nombre
        </label>
        <input
          id="name"
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Tu nombre completo"
          className="w-full px-4 py-3 rounded-xl border border-warm-200 bg-white focus:outline-none focus:ring-2 focus:ring-coral-400 focus:border-transparent transition"
          disabled={loading}
        />
      </div>

      <div>
        <label htmlFor="pin" className="block text-sm font-medium mb-1.5">
          PIN de 4 dígitos
        </label>
        <input
          id="pin"
          type="text"
          inputMode="numeric"
          maxLength={4}
          value={pin}
          onChange={(e) => setPin(e.target.value.replace(/\D/g, ""))}
          placeholder="1234"
          className="w-full px-4 py-3 rounded-xl border border-warm-200 bg-white focus:outline-none focus:ring-2 focus:ring-coral-400 focus:border-transparent transition tracking-[0.3em] text-center text-lg"
          disabled={loading}
        />
      </div>

      {error && (
        <p className="text-red-500 text-sm text-center">{error}</p>
      )}

      <button
        type="submit"
        disabled={loading}
        className="w-full py-3 px-4 bg-coral-500 hover:bg-coral-600 text-white font-semibold rounded-xl transition disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {loading ? "Entrando..." : "Entrar"}
      </button>
    </form>
  );
}
