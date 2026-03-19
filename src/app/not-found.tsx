import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-surface px-4">
      <div className="text-center">
        <p
          className="font-display font-bold text-neon-purple leading-none select-none text-8xl"
          aria-hidden="true"
        >
          404
        </p>
        <h1 className="mt-4 font-display text-display-sm text-content">
          Page not found
        </h1>
        <p className="mt-2 text-content-secondary">
          The page you&apos;re looking for doesn&apos;t exist.
        </p>
        <Link
          href="/"
          className="mt-6 inline-block bg-neon-purple text-white px-6 py-2 rounded-lg hover:bg-neon-purple/90 transition-colors"
        >
          Go home
        </Link>
      </div>
    </div>
  );
}
