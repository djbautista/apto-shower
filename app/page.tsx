"use client";

import LoginForm from "@/components/LoginForm";

export default function Home() {
  return (
    <main className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-charcoal mb-2">
            Apto Shower
          </h1>
          <p className="text-charcoal/60">
            Bienvenido al registro de regalos para el apartamento nuevo
          </p>
        </div>
        <div className="bg-white rounded-2xl shadow-lg border border-warm-200 p-6">
          <LoginForm />
        </div>
      </div>
    </main>
  );
}
