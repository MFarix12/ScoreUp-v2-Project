"use client";

import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { createClient } from "@/lib/supabase/client";

export default function LoginPage() {
  const router = useRouter();
  const supabase = createClient();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [rememberMe, setRememberMe] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const [loading, setLoading] = useState(false);
  const [forgotLoading, setForgotLoading] = useState(false);

  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const [showForgotPassword, setShowForgotPassword] =
    useState(false);

  const [forgotEmail, setForgotEmail] = useState("");

  useEffect(() => {
    const rememberedEmail =
      localStorage.getItem("scoreup_remembered_email");

    if (rememberedEmail) {
      setEmail(rememberedEmail);
      setRememberMe(true);
    }
  }, []);

  async function handleLogin(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    setLoading(true);
    setErrorMessage("");
    setSuccessMessage("");

    const cleanEmail = email.trim().toLowerCase();

    if (!cleanEmail || !password) {
      setErrorMessage(
        "Please enter your email address and password."
      );

      setLoading(false);
      return;
    }

    try {
      const { error } =
        await supabase.auth.signInWithPassword({
          email: cleanEmail,
          password,
        });

      if (error) {
        if (
          error.message
            .toLowerCase()
            .includes("invalid login credentials")
        ) {
          setErrorMessage(
            "The email or password you entered is incorrect."
          );
        } else {
          setErrorMessage(
            error.message ||
              "Unable to sign in. Please try again."
          );
        }

        return;
      }

      if (rememberMe) {
        localStorage.setItem(
          "scoreup_remembered_email",
          cleanEmail
        );
      } else {
        localStorage.removeItem(
          "scoreup_remembered_email"
        );
      }

      router.push("/dashboard");
      router.refresh();
    } catch {
      setErrorMessage(
        "Something went wrong while signing in. Please try again."
      );
    } finally {
      setLoading(false);
    }
  }

  async function handleForgotPassword(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    setForgotLoading(true);
    setErrorMessage("");
    setSuccessMessage("");

    const cleanEmail = forgotEmail
      .trim()
      .toLowerCase();

    if (!cleanEmail) {
      setErrorMessage(
        "Please enter your email address."
      );

      setForgotLoading(false);
      return;
    }

    try {
      const redirectTo =
        typeof window !== "undefined"
          ? `${window.location.origin}/auth/callback?next=/reset-password`
          : undefined;

      const { error } =
        await supabase.auth.resetPasswordForEmail(
          cleanEmail,
          {
            redirectTo,
          }
        );

      if (error) {
        setErrorMessage(
          error.message ||
            "Unable to send the password reset email."
        );

        return;
      }

      setSuccessMessage(
        "Password reset instructions have been sent to your email."
      );

      setShowForgotPassword(false);
      setForgotEmail("");
    } catch {
      setErrorMessage(
        "Unable to process your request. Please try again."
      );
    } finally {
      setForgotLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-[#F5F6F8]">
      <div className="grid min-h-screen lg:grid-cols-[1.05fr_0.95fr]">
        {/* =====================================================
            BRANDING SIDE
        ===================================================== */}
        <section className="relative hidden overflow-hidden bg-[#111827] text-white lg:flex lg:flex-col lg:justify-between">
          {/* Background effects */}
          <div className="pointer-events-none absolute inset-0">
            <div className="absolute -left-32 -top-32 h-[450px] w-[450px] rounded-full bg-[#E30613]/20 blur-3xl" />

            <div className="absolute -bottom-40 right-0 h-[500px] w-[500px] rounded-full bg-[#B0000C]/20 blur-3xl" />

            <div
              className="absolute inset-0 opacity-[0.04]"
              style={{
                backgroundImage:
                  "linear-gradient(rgba(255,255,255,0.35) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.35) 1px, transparent 1px)",
                backgroundSize: "54px 54px",
              }}
            />

            <div className="absolute right-[10%] top-[18%] h-64 w-64 rotate-12 rounded-[52px] border border-white/5 bg-white/[0.02]" />

            <div className="absolute bottom-[16%] left-[12%] h-48 w-48 -rotate-12 rounded-[44px] border border-red-500/10 bg-[#E30613]/5" />
          </div>

          {/* Logo */}
          <div className="relative z-10 flex items-center gap-3 p-10">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#E30613] text-xl font-black text-white shadow-lg shadow-red-950/30">
              S
            </div>

            <div>
              <p className="text-xl font-black tracking-tight">
                ScoreUp
              </p>

              <p className="text-xs font-medium text-slate-400">
                SuperUPSI Games
              </p>
            </div>
          </div>

          {/* Main branding */}
          <div className="relative z-10 max-w-2xl px-10 pb-10 xl:px-16">
            <span className="inline-flex items-center gap-2 rounded-full border border-red-400/20 bg-red-500/10 px-4 py-2 text-xs font-black uppercase tracking-[0.18em] text-red-200">
              <span className="h-2 w-2 rounded-full bg-[#E30613]" />
              Competition Management
            </span>

            <h1 className="mt-8 text-5xl font-black leading-[1.05] tracking-tight xl:text-6xl">
              Manage every match.
              <br />
              Track every result.
            </h1>

            <p className="mt-6 max-w-xl text-base leading-8 text-slate-300">
              The centralized competition management platform
              for SuperUPSI Games — from tournament scheduling
              and match results to automatic progression and
              public standings.
            </p>

            <div className="mt-10 grid max-w-xl grid-cols-3 gap-3">
              <BrandFeature
                number="01"
                label="Manage"
              />

              <BrandFeature
                number="02"
                label="Compete"
              />

              <BrandFeature
                number="03"
                label="Score"
              />
            </div>
          </div>

          {/* Bottom */}
          <div className="relative z-10 flex items-center justify-between border-t border-white/10 px-10 py-6 text-xs text-slate-500">
            <span>ScoreUp</span>
            <span>Universiti Pendidikan Sultan Idris</span>
          </div>
        </section>

        {/* =====================================================
            LOGIN SIDE
        ===================================================== */}
        <section className="relative flex min-h-screen items-center justify-center px-5 py-10 sm:px-8 lg:px-12">
          <div className="w-full max-w-md">
            {/* Mobile logo */}
            <div className="mb-10 flex items-center justify-between lg:hidden">
              <Link
                href="/"
                className="flex items-center gap-3"
              >
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#E30613] text-lg font-black text-white shadow-lg shadow-red-100">
                  S
                </div>

                <div>
                  <p className="text-lg font-black text-[#111827]">
                    ScoreUp
                  </p>

                  <p className="text-[11px] font-medium text-slate-400">
                    SuperUPSI Games
                  </p>
                </div>
              </Link>
            </div>

            {/* Login heading */}
            <div>
              <p className="text-xs font-black uppercase tracking-[0.2em] text-[#E30613]">
                Staff Access
              </p>

              <h2 className="mt-3 text-3xl font-black tracking-tight text-[#111827] sm:text-4xl">
                Welcome back
              </h2>

              <p className="mt-3 text-sm leading-6 text-slate-500">
                Sign in to access your ScoreUp administration
                or sports technician workspace.
              </p>
            </div>

            {/* Messages */}
            {errorMessage && (
              <div className="mt-6 rounded-2xl border border-red-200 bg-red-50 px-4 py-3.5">
                <div className="flex gap-3">
                  <div className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#E30613] text-xs font-black text-white">
                    !
                  </div>

                  <p className="text-sm font-medium leading-6 text-red-700">
                    {errorMessage}
                  </p>
                </div>
              </div>
            )}

            {successMessage && (
              <div className="mt-6 rounded-2xl border border-green-200 bg-green-50 px-4 py-3.5">
                <p className="text-sm font-medium leading-6 text-green-700">
                  {successMessage}
                </p>
              </div>
            )}

            {/* Form */}
            <form
              onSubmit={handleLogin}
              className="mt-8 space-y-5"
            >
              <div>
                <label
                  htmlFor="email"
                  className="mb-2 block text-sm font-bold text-[#111827]"
                >
                  Email address
                </label>

                <div className="relative">
                  <span className="pointer-events-none absolute inset-y-0 left-4 flex items-center text-slate-400">
                    @
                  </span>

                  <input
                    id="email"
                    type="email"
                    autoComplete="email"
                    value={email}
                    onChange={(event) =>
                      setEmail(event.target.value)
                    }
                    placeholder="name@example.com"
                    className="w-full rounded-xl border border-slate-300 bg-white py-3.5 pl-11 pr-4 text-[#111827] placeholder:text-slate-400 outline-none transition focus:border-[#E30613] focus:ring-2 focus:ring-red-100"
                  />
                </div>
              </div>

              <div>
                <div className="mb-2 flex items-center justify-between gap-4">
                  <label
                    htmlFor="password"
                    className="block text-sm font-bold text-[#111827]"
                  >
                    Password
                  </label>

                  <button
                    type="button"
                    onClick={() => {
                      setErrorMessage("");
                      setSuccessMessage("");
                      setForgotEmail(email);
                      setShowForgotPassword(true);
                    }}
                    className="text-xs font-bold text-[#E30613] transition hover:text-[#B0000C]"
                  >
                    Forgot password?
                  </button>
                </div>

                <div className="relative">
                  <span className="pointer-events-none absolute inset-y-0 left-4 flex items-center text-slate-400">
                    •
                  </span>

                  <input
                    id="password"
                    type={
                      showPassword
                        ? "text"
                        : "password"
                    }
                    autoComplete="current-password"
                    value={password}
                    onChange={(event) =>
                      setPassword(
                        event.target.value
                      )
                    }
                    placeholder="Enter your password"
                    className="w-full rounded-xl border border-slate-300 bg-white py-3.5 pl-11 pr-20 text-[#111827] placeholder:text-slate-400 outline-none transition focus:border-[#E30613] focus:ring-2 focus:ring-red-100"
                  />

                  <button
                    type="button"
                    onClick={() =>
                      setShowPassword(
                        (previous) =>
                          !previous
                      )
                    }
                    className="absolute inset-y-0 right-4 flex items-center text-xs font-bold text-slate-500 transition hover:text-[#E30613]"
                  >
                    {showPassword
                      ? "Hide"
                      : "Show"}
                  </button>
                </div>
              </div>

              <label className="flex cursor-pointer items-center gap-3">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(event) =>
                    setRememberMe(
                      event.target.checked
                    )
                  }
                  className="h-4 w-4 rounded border-slate-300 accent-[#E30613]"
                />

                <span className="text-sm font-medium text-slate-600">
                  Remember my email
                </span>
              </label>

              <button
                type="submit"
                disabled={loading}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#E30613] px-5 py-3.5 text-sm font-black text-white shadow-lg shadow-red-100 transition hover:bg-[#B0000C] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading ? (
                  <>
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                    Signing in...
                  </>
                ) : (
                  <>
                    Sign In
                    <span>→</span>
                  </>
                )}
              </button>
            </form>

            {/* Public portal */}
            <div className="mt-8 border-t border-slate-200 pt-6 text-center">
              <p className="text-xs leading-6 text-slate-500">
                Looking for competition information?
              </p>

              <Link
                href="/"
                className="mt-1 inline-flex items-center gap-1 text-sm font-bold text-[#E30613] transition hover:text-[#B0000C]"
              >
                Visit the public ScoreUp portal
                <span>→</span>
              </Link>
            </div>

            <p className="mt-8 text-center text-[11px] leading-5 text-slate-400">
              Authorized personnel only. Public users do not
              need an account to view competition information.
            </p>
          </div>
        </section>
      </div>

      {/* =====================================================
          FORGOT PASSWORD MODAL
      ===================================================== */}
      {showForgotPassword && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#111827]/70 px-5 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-[28px] border border-slate-200 bg-white p-6 shadow-2xl sm:p-7">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.18em] text-[#E30613]">
                  Account Recovery
                </p>

                <h3 className="mt-2 text-2xl font-black text-[#111827]">
                  Forgot password?
                </h3>
              </div>

              <button
                type="button"
                onClick={() => {
                  setShowForgotPassword(false);
                  setErrorMessage("");
                }}
                className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-100 text-lg font-bold text-slate-500 transition hover:bg-slate-200"
              >
                ×
              </button>
            </div>

            <p className="mt-4 text-sm leading-6 text-slate-500">
              Enter your registered email address and we will
              send you instructions to reset your password.
            </p>

            <form
              onSubmit={handleForgotPassword}
              className="mt-6"
            >
              <label
                htmlFor="forgot-email"
                className="mb-2 block text-sm font-bold text-[#111827]"
              >
                Email address
              </label>

              <input
                id="forgot-email"
                type="email"
                autoComplete="email"
                value={forgotEmail}
                onChange={(event) =>
                  setForgotEmail(
                    event.target.value
                  )
                }
                placeholder="name@example.com"
                className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3.5 text-[#111827] placeholder:text-slate-400 outline-none transition focus:border-[#E30613] focus:ring-2 focus:ring-red-100"
              />

              <button
                type="submit"
                disabled={forgotLoading}
                className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl bg-[#E30613] px-5 py-3.5 text-sm font-black text-white transition hover:bg-[#B0000C] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {forgotLoading
                  ? "Sending..."
                  : "Send Reset Link"}
              </button>
            </form>
          </div>
        </div>
      )}
    </main>
  );
}

function BrandFeature({
  number,
  label,
}: {
  number: string;
  label: string;
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4 backdrop-blur-sm">
      <p className="text-xs font-black text-[#E30613]">
        {number}
      </p>

      <p className="mt-2 text-sm font-bold text-white">
        {label}
      </p>
    </div>
  );
}