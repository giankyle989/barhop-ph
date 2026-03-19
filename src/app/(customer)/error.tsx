"use client";

// Next.js requires this exact prop signature for error boundaries.
// `error` carries the digest for server-side error correlation even when not rendered.
export default function CustomerError({
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <h2 className="font-display text-display-sm mb-4">Something went wrong</h2>
        <p className="text-content-secondary mb-6">We&apos;re having trouble loading this page.</p>
        <button
          onClick={reset}
          className="bg-neon-purple text-white px-6 py-2 rounded-lg hover:bg-neon-purple/90 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neon-purple focus-visible:ring-offset-2 focus-visible:ring-offset-surface"
        >
          Try again
        </button>
      </div>
    </div>
  );
}
