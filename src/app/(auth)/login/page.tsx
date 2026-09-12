"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function LoginPage() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleLogin(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    setLoading(true);
    setError("");

    const supabase = createClient();

    const { error } =
      await supabase.auth.signInWithPassword({
        email,
        password,
      });

    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }

    router.push("/dashboard");
    router.refresh();
  }

  return (
    <main className="grid min-h-screen lg:grid-cols-2">
      {/* Brand Panel */}
      <section className="relative hidden overflow-hidden bg-[#111827] p-12 text-white lg:flex lg:flex-col lg:justify-between">
        {/* Decorative championship shapes */}
        <div className="absolute -right-24 -top-24 h-80 w-80 rotate-45 bg-[#E30613]" />

        <div className="absolute -bottom-40 -left-32 h-96 w-96 rotate-45 bg-[#B0000C]" />

        <div className="absolute bottom-20 right-20 h-32 w-32 rotate-45 border-[20px] border-white/5" />

        <div className="relative z-10">
          <h1 className="text-3xl font-black tracking-tight">
            Score<span className="text-[#E30613]">Up</span>
          </h1>

          <p className="mt-2 text-sm text-slate-400">
            SuperUPSI Games
          </p>
        </div>

        <div className="relative z-10 max-w-lg">
          <div className="mb-6 h-1 w-16 bg-[#E30613]" />

          <h2 className="text-5xl font-black leading-tight">
            Every Score.
            <br />
            Every Match.
            <br />
            One Platform.
          </h2>

          <p className="mt-6 max-w-md text-lg leading-8 text-slate-300">
            Competition management, live results,
            tournament standings and schedules for
            SuperUPSI Games.
          </p>
        </div>

        <p className="relative z-10 text-xs text-slate-500">
          ScoreUp Sports Competition Management System
        </p>
      </section>

      {/* Login */}
      <section className="flex items-center justify-center bg-[#F5F6F8] px-6 py-12">
        <div className="w-full max-w-md">
          <div className="mb-10 lg:hidden">
            <h1 className="text-3xl font-black text-[#111827]">
              Score
              <span className="text-[#E30613]">
                Up
              </span>
            </h1>

            <p className="mt-1 text-sm text-slate-500">
              SuperUPSI Games
            </p>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm sm:p-10">
            <div className="mb-8">
              <div className="mb-4 h-1 w-10 rounded-full bg-[#E30613]" />

              <h2 className="text-3xl font-bold text-[#111827]">
                Welcome back
              </h2>

              <p className="mt-2 text-sm text-slate-500">
                Sign in to your ScoreUp account.
              </p>
            </div>

            <form
              onSubmit={handleLogin}
              className="space-y-5"
            >
              <div>
                <label
                  htmlFor="email"
                  className="mb-2 block text-sm font-semibold text-slate-700"
                >
                  Email Address
                </label>

                <input
                  id="email"
                  type="email"
                  required
                  value={email}
                  onChange={(event) =>
                    setEmail(event.target.value)
                  }
                  placeholder="name@example.com"
                  className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none transition focus:border-[#E30613] focus:ring-2 focus:ring-red-100"
                />
              </div>

              <div>
                <label
                  htmlFor="password"
                  className="mb-2 block text-sm font-semibold text-slate-700"
                >
                  Password
                </label>

                <input
                  id="password"
                  type="password"
                  required
                  value={password}
                  onChange={(event) =>
                    setPassword(event.target.value)
                  }
                  placeholder="••••••••"
                  className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none transition focus:border-[#E30613] focus:ring-2 focus:ring-red-100"
                />
              </div>

              {error && (
                <div className="rounded-xl border border-red-100 bg-red-50 p-3 text-sm text-red-600">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-xl bg-[#E30613] px-4 py-3.5 font-bold text-white transition hover:bg-[#B0000C] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading
                  ? "Signing in..."
                  : "Sign In"}
              </button>
            </form>
          </div>
        </div>
      </section>
    </main>
  );
}