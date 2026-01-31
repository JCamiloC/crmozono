"use client";

import { useState, type ChangeEvent, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { signInWithPassword, fetchUserProfile } from "../../services/auth/auth.service";
import { getDefaultRouteForRole } from "../../lib/auth";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setLoading(true);

    const { data, error: signInError } = await signInWithPassword({
      email,
      password,
    });

    if (signInError || !data?.user) {
      setError(signInError?.message ?? "No se pudo iniciar sesión.");
      setLoading(false);
      return;
    }

    const profileResult = await fetchUserProfile(data.user.id);

    if (profileResult.error || !profileResult.data) {
      setError(profileResult.error?.message ?? "No se pudo cargar el perfil.");
      setLoading(false);
      return;
    }

    const nextRoute = getDefaultRouteForRole(profileResult.data.role);
    router.replace(nextRoute);
  };

  return (
    <div className="relative min-h-screen bg-botanical-50">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(74,168,120,0.18),_transparent_45%)]" />
      <div className="relative flex min-h-screen items-center justify-center px-4 py-10">
        <div className="grid w-full max-w-5xl overflow-hidden rounded-3xl bg-white shadow-card lg:grid-cols-[1.1fr_0.9fr]">
          <div className="flex flex-col justify-between bg-botanical-700 px-8 py-10 text-white sm:px-12">
            <div>
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/20 text-sm font-semibold">
                  SO
                </div>
                <div>
                  <p className="text-lg font-semibold">SuperOzono CRM</p>
                  <p className="text-sm text-botanical-100">Ventas inteligentes por WhatsApp</p>
                </div>
              </div>
              <h1 className="mt-10 text-3xl font-semibold leading-tight">
                Gestiona leads, mensajes y tareas en una sola plataforma.
              </h1>
              <p className="mt-4 text-sm text-botanical-100">
                CRM multi-país con seguimiento comercial y automatizaciones listas para escalar.
              </p>
            </div>
            <div className="mt-10 rounded-2xl border border-white/20 bg-white/10 p-4 text-xs text-botanical-100">
              “Tu equipo comercial más ordenado, tus leads más cerca del cierre.”
            </div>
          </div>
          <div className="flex items-center justify-center px-6 py-10 sm:px-10">
            <form
              onSubmit={handleSubmit}
              className="flex w-full max-w-sm flex-col gap-5"
            >
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-botanical-500">
                  Acceso seguro
                </p>
                <h2 className="mt-2 text-2xl font-semibold text-botanical-900">
                  Iniciar sesión
                </h2>
                <p className="mt-2 text-sm text-botanical-600">
                  Ingresa con tu cuenta de administrador para continuar.
                </p>
              </div>
              <label className="flex flex-col gap-2 text-xs font-semibold text-botanical-700">
                Email
                <input
                  type="email"
                  className="rounded-xl border border-botanical-100 bg-white px-4 py-3 text-sm text-botanical-900 shadow-sm focus:border-botanical-400 focus:outline-none focus:ring-2 focus:ring-botanical-200"
                  value={email}
                  onChange={(event: ChangeEvent<HTMLInputElement>) =>
                    setEmail(event.target.value)
                  }
                  required
                />
              </label>
              <label className="flex flex-col gap-2 text-xs font-semibold text-botanical-700">
                Contraseña
                <input
                  type="password"
                  className="rounded-xl border border-botanical-100 bg-white px-4 py-3 text-sm text-botanical-900 shadow-sm focus:border-botanical-400 focus:outline-none focus:ring-2 focus:ring-botanical-200"
                  value={password}
                  onChange={(event: ChangeEvent<HTMLInputElement>) =>
                    setPassword(event.target.value)
                  }
                  required
                />
              </label>
              <div className="flex items-center justify-between text-xs text-botanical-600">
                <span>¿Olvidaste tu contraseña?</span>
                <span className="font-semibold text-botanical-700">Soporte</span>
              </div>
              {error ? <p className="text-sm text-red-600">{error}</p> : null}
              <button
                type="submit"
                className="rounded-xl bg-botanical-700 px-4 py-3 text-sm font-semibold text-white shadow-soft transition hover:bg-botanical-800"
                disabled={loading}
              >
                {loading ? "Ingresando..." : "Ingresar"}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
