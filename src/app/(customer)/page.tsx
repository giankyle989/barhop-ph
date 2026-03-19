export default function HomePage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center">
      <h1 className="font-display text-display-lg text-center">
        <span className="text-neon-purple">Bar</span>
        <span className="text-neon-pink">Hop</span>
        {" "}PH
      </h1>
      <p className="mt-4 text-content-secondary text-lg">
        Discover bars &amp; clubs across the Philippines
      </p>
    </div>
  );
}
