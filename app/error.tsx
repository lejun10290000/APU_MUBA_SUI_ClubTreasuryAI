"use client";

export default function ErrorPage({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <main className="mx-auto flex min-h-screen max-w-xl flex-col justify-center gap-4 p-8">
      <h1 className="text-2xl font-bold">Something went wrong</h1>
      <p className="text-slate-400">The application failed safely. No payment state should be assumed from this screen.</p>
      <button className="w-fit rounded-lg bg-violet-600 px-4 py-2 font-medium" onClick={reset} type="button">
        Try again
      </button>
    </main>
  );
}
