"use client";

import {
  FormEvent,
  useEffect,
  useState,
} from "react";

import Link from "next/link";
import { useRouter } from "next/navigation";

import { createClient } from "@/lib/supabase/client";

export default function ResetPasswordPage() {
  const router = useRouter();

  const supabase = createClient();

  const [password, setPassword] =
    useState("");

  const [confirmPassword, setConfirmPassword] =
    useState("");

  const [showPassword, setShowPassword] =
    useState(false);

  const [
    showConfirmPassword,
    setShowConfirmPassword,
  ] = useState(false);

  const [loading, setLoading] =
    useState(false);

  const [checkingSession, setCheckingSession] =
    useState(true);

  const [hasSession, setHasSession] =
    useState(false);

  const [errorMessage, setErrorMessage] =
    useState("");

  const [successMessage, setSuccessMessage] =
    useState("");

  useEffect(() => {
    async function checkRecoverySession() {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (session) {
        setHasSession(true);
      }

      setCheckingSession(false);
    }

    checkRecoverySession();
  }, [supabase]);

  async function handleResetPassword(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    setErrorMessage("");
    setSuccessMessage("");

    if (!password || !confirmPassword) {
      setErrorMessage(
        "Please enter and confirm your new password."
      );

      return;
    }

    if (password.length < 8) {
      setErrorMessage(
        "Your password must contain at least 8 characters."
      );

      return;
    }

    if (password !== confirmPassword) {
      setErrorMessage(
        "The passwords do not match."
      );

      return;
    }

    setLoading(true);

    try {
      const { error } =
        await supabase.auth.updateUser({
          password,
        });

      if (error) {
        setErrorMessage(
          getFriendlyError(error.message)
        );

        return;
      }

      setSuccessMessage(
        "Your password has been updated successfully."
      );

      /*
       * Sign the recovery session out after
       * changing the password.
       *
       * The user will then sign in normally
       * using the new password.
       */
      await supabase.auth.signOut();

      setTimeout(() => {
        router.replace("/login");
        router.refresh();
      }, 1800);
    } catch {
      setErrorMessage(
        "Something went wrong while updating your password. Please try again."
      );
    } finally {
      setLoading(false);
    }
  }

  if (checkingSession) {
    return <LoadingScreen />;
  }

  return (
    <main className="min-h-screen bg-[#F5F6F8]">
      <div className="grid min-h-screen lg:grid-cols-[1.05fr_0.95fr]">
        {/* =====================================================
            BRAND PANEL
        ===================================================== */}
        <section className="relative hidden overflow-hidden bg-[#111827] text-white lg:flex lg:flex-col lg:justify-between">
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
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#E30613] text-xl font-black shadow-lg shadow-red-950/30">
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

          {/* Branding */}
          <div className="relative z-10 max-w-2xl px-10 pb-10 xl:px-16">
            <span className="inline-flex items-center gap-2 rounded-full border border-red-400/20 bg-red-500/10 px-4 py-2 text-xs font-black uppercase tracking-[0.18em] text-red-200">
              <span className="h-2 w-2 rounded-full bg-[#E30613]" />
              Secure Account Recovery
            </span>

            <h1 className="mt-8 text-5xl font-black leading-[1.05] tracking-tight xl:text-6xl">
              Back in the game.
            </h1>

            <p className="mt-6 max-w-xl text-base leading-8 text-slate-300">
              Create a new password to restore
              access to your ScoreUp staff
              workspace.
            </p>

            <div className="mt-10 space-y-3">
              <RecoveryFeature
                number="01"
                title="Secure recovery"
                description="Recovery links are handled through Supabase Authentication."
              />

              <RecoveryFeature
                number="02"
                title="New credentials"
                description="Your previous password is replaced after a successful reset."
              />

              <RecoveryFeature
                number="03"
                title="Staff access"
                description="Return to your assigned Admin or Sports Technician workspace."
              />
            </div>
          </div>

          <div className="relative z-10 flex items-center justify-between border-t border-white/10 px-10 py-6 text-xs text-slate-500">
            <span>ScoreUp</span>

            <span>
              Universiti Pendidikan Sultan Idris
            </span>
          </div>
        </section>

        {/* =====================================================
            RESET FORM
        ===================================================== */}
        <section className="flex min-h-screen items-center justify-center px-5 py-10 sm:px-8 lg:px-12">
          <div className="w-full max-w-md">
            {/* Mobile logo */}
            <div className="mb-10 flex items-center gap-3 lg:hidden">
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
            </div>

            {!hasSession ? (
              <InvalidRecoveryState />
            ) : (
              <>
                <p className="text-xs font-black uppercase tracking-[0.2em] text-[#E30613]">
                  Account Recovery
                </p>

                <h2 className="mt-3 text-3xl font-black tracking-tight text-[#111827] sm:text-4xl">
                  Create new password
                </h2>

                <p className="mt-3 text-sm leading-6 text-slate-500">
                  Choose a secure new password for
                  your ScoreUp account.
                </p>

                {/* Error */}
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

                {/* Success */}
                {successMessage && (
                  <div className="mt-6 rounded-2xl border border-green-200 bg-green-50 px-4 py-3.5">
                    <div className="flex gap-3">
                      <div className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-green-600 text-xs font-black text-white">
                        ✓
                      </div>

                      <div>
                        <p className="text-sm font-bold text-green-800">
                          Password updated
                        </p>

                        <p className="mt-1 text-xs leading-5 text-green-700">
                          Redirecting you to the
                          login page...
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                <form
                  onSubmit={handleResetPassword}
                  className="mt-8 space-y-5"
                >
                  {/* Password */}
                  <PasswordField
                    id="new-password"
                    label="New password"
                    value={password}
                    onChange={setPassword}
                    visible={showPassword}
                    onToggle={() =>
                      setShowPassword(
                        (previous) =>
                          !previous
                      )
                    }
                    autoComplete="new-password"
                    placeholder="Enter your new password"
                  />

                  {/* Confirm Password */}
                  <PasswordField
                    id="confirm-password"
                    label="Confirm new password"
                    value={confirmPassword}
                    onChange={
                      setConfirmPassword
                    }
                    visible={
                      showConfirmPassword
                    }
                    onToggle={() =>
                      setShowConfirmPassword(
                        (previous) =>
                          !previous
                      )
                    }
                    autoComplete="new-password"
                    placeholder="Confirm your new password"
                  />

                  {/* Password requirements */}
                  <div className="rounded-2xl border border-slate-200 bg-white p-4">
                    <p className="text-xs font-black uppercase tracking-[0.14em] text-slate-400">
                      Password requirements
                    </p>

                    <div className="mt-3 space-y-2">
                      <Requirement
                        met={
                          password.length >= 8
                        }
                        text="At least 8 characters"
                      />

                      <Requirement
                        met={
                          password.length > 0 &&
                          password ===
                            confirmPassword
                        }
                        text="Both passwords match"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={
                      loading ||
                      Boolean(successMessage)
                    }
                    className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#E30613] px-5 py-3.5 text-sm font-black text-white shadow-lg shadow-red-100 transition hover:bg-[#B0000C] disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {loading ? (
                      <>
                        <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                        Updating password...
                      </>
                    ) : (
                      <>
                        Update Password
                        <span>→</span>
                      </>
                    )}
                  </button>
                </form>

                <div className="mt-8 border-t border-slate-200 pt-6 text-center">
                  <Link
                    href="/login"
                    className="text-sm font-bold text-[#E30613] transition hover:text-[#B0000C]"
                  >
                    ← Back to Sign In
                  </Link>
                </div>
              </>
            )}
          </div>
        </section>
      </div>
    </main>
  );
}

/* =========================================================
   PASSWORD FIELD
========================================================= */

function PasswordField({
  id,
  label,
  value,
  onChange,
  visible,
  onToggle,
  placeholder,
  autoComplete,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  visible: boolean;
  onToggle: () => void;
  placeholder: string;
  autoComplete: string;
}) {
  return (
    <div>
      <label
        htmlFor={id}
        className="mb-2 block text-sm font-bold text-[#111827]"
      >
        {label}
      </label>

      <div className="relative">
        <input
          id={id}
          type={visible ? "text" : "password"}
          value={value}
          onChange={(event) =>
            onChange(event.target.value)
          }
          placeholder={placeholder}
          autoComplete={autoComplete}
          className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3.5 pr-20 text-[#111827] placeholder:text-slate-400 outline-none transition focus:border-[#E30613] focus:ring-2 focus:ring-red-100"
        />

        <button
          type="button"
          onClick={onToggle}
          className="absolute inset-y-0 right-4 flex items-center text-xs font-bold text-slate-500 transition hover:text-[#E30613]"
        >
          {visible ? "Hide" : "Show"}
        </button>
      </div>
    </div>
  );
}

/* =========================================================
   REQUIREMENT
========================================================= */

function Requirement({
  met,
  text,
}: {
  met: boolean;
  text: string;
}) {
  return (
    <div className="flex items-center gap-2">
      <span
        className={`flex h-5 w-5 items-center justify-center rounded-full text-[9px] font-black ${
          met
            ? "bg-green-100 text-green-700"
            : "bg-slate-100 text-slate-400"
        }`}
      >
        {met ? "✓" : "•"}
      </span>

      <span
        className={`text-xs font-medium ${
          met
            ? "text-green-700"
            : "text-slate-500"
        }`}
      >
        {text}
      </span>
    </div>
  );
}

/* =========================================================
   INVALID / EXPIRED LINK
========================================================= */

function InvalidRecoveryState() {
  return (
    <div>
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-red-50 text-xl font-black text-[#E30613]">
        !
      </div>

      <p className="mt-6 text-xs font-black uppercase tracking-[0.2em] text-[#E30613]">
        Recovery Link
      </p>

      <h1 className="mt-3 text-3xl font-black tracking-tight text-[#111827]">
        This link is invalid or expired
      </h1>

      <p className="mt-4 text-sm leading-7 text-slate-500">
        Your password reset link may have
        expired or already been used. Request
        another reset link from the ScoreUp
        login page.
      </p>

      <Link
        href="/login"
        className="mt-7 inline-flex w-full items-center justify-center rounded-xl bg-[#E30613] px-5 py-3.5 text-sm font-black text-white transition hover:bg-[#B0000C]"
      >
        Return to Sign In
      </Link>
    </div>
  );
}

/* =========================================================
   LOADING
========================================================= */

function LoadingScreen() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-[#F5F6F8] px-5">
      <div className="text-center">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[#E30613]">
          <span className="h-5 w-5 animate-spin rounded-full border-2 border-white/30 border-t-white" />
        </div>

        <p className="mt-5 font-black text-[#111827]">
          Verifying recovery link
        </p>

        <p className="mt-2 text-sm text-slate-500">
          Please wait a moment...
        </p>
      </div>
    </main>
  );
}

/* =========================================================
   BRAND FEATURE
========================================================= */

function RecoveryFeature({
  number,
  title,
  description,
}: {
  number: string;
  title: string;
  description: string;
}) {
  return (
    <div className="flex gap-4 rounded-2xl border border-white/10 bg-white/[0.04] p-4 backdrop-blur-sm">
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#E30613]/10 text-xs font-black text-red-300">
        {number}
      </div>

      <div>
        <p className="text-sm font-bold text-white">
          {title}
        </p>

        <p className="mt-1 text-xs leading-5 text-slate-400">
          {description}
        </p>
      </div>
    </div>
  );
}

/* =========================================================
   FRIENDLY AUTH ERROR
========================================================= */

function getFriendlyError(
  message: string
) {
  const lower =
    message.toLowerCase();

  if (
    lower.includes(
      "new password should be different"
    )
  ) {
    return "Your new password must be different from your previous password.";
  }

  if (
    lower.includes("password")
  ) {
    return message;
  }

  return "Unable to update your password. Please request a new password reset link and try again.";
}