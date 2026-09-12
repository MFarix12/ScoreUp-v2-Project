import Link from "next/link";

export default function UnauthorizedPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-[#F5F6F8] px-6">
      <div className="w-full max-w-lg rounded-3xl border border-slate-200 bg-white p-10 text-center shadow-sm">
        <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-red-50 text-2xl font-bold text-[#E30613]">
          !
        </div>

        <h1 className="text-2xl font-bold text-[#111827]">
          Access Not Assigned
        </h1>

        <p className="mt-3 text-sm leading-6 text-slate-500">
          Your account is authenticated, but it does not
          currently have permission to access a ScoreUp
          management portal.
        </p>

        <Link
          href="/login"
          className="mt-8 inline-block rounded-xl bg-[#E30613] px-6 py-3 text-sm font-semibold text-white transition hover:bg-[#B0000C]"
        >
          Return to Login
        </Link>
      </div>
    </main>
  );
}