import { Navbar } from "@/components/customer/navbar";
import { Footer } from "@/components/customer/footer";

export default function CustomerLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Navbar />
      <main className="min-h-screen">{children}</main>
      <Footer />
    </>
  );
}
