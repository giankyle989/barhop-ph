"use client";

export default function AdminError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center max-w-md px-4">
        <h2 className="font-display text-display-sm mb-4 text-content">Something went wrong</h2>
        <p className="text-content-secondary mb-2">
          An unexpected error occurred in the admin panel.
        </p>
        {error.digest && (
          <p className="text-xs text-content-muted font-mono mb-6">
            Error ID: {error.digest}
          </p>
        )}
        <div className="flex items-center justify-center gap-3">
          <button
            onClick={reset}
            className="bg-neon-purple text-white px-6 py-2 rounded-lg hover:bg-neon-purple/90 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neon-purple focus-visible:ring-offset-2 focus-visible:ring-offset-surface"
          >
            Try again
          </button>
          <a
            href="/admin/dashboard"
            className="px-6 py-2 rounded-lg border border-border text-content-secondary hover:text-content hover:border-border-hover transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neon-purple focus-visible:ring-offset-2 focus-visible:ring-offset-surface"
          >
            Go to dashboard
          </a>
        </div>
      </div>
    </div>
  );
}
