import { Navbar } from "@/components/customer/navbar";
import { Footer } from "@/components/customer/footer";

export default function CustomerLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      {/* Skip-to-content link: visually hidden until focused via keyboard */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:bg-neon-purple focus:text-white focus:px-4 focus:py-2 focus:rounded focus:outline-none"
      >
        Skip to content
      </a>
      <Navbar />
      <main id="main-content" className="min-h-screen">{children}</main>
      <Footer />
    </>
  );
}
