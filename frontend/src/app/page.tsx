import { Footer } from '@/components/marketing/footer';
import { HeroSection } from '@/components/marketing/hero-section';
import { Navbar } from '@/components/marketing/navbar';
import { TopShopsPreview } from '@/components/marketing/top-shops-preview';
import { TrustFeatures } from '@/components/marketing/trust-features';

export default function HomePage() {
  return (
    <main className="min-h-screen overflow-x-hidden bg-stone-50 text-slate-900">
      <Navbar />
      <HeroSection />
      <TrustFeatures />
      <TopShopsPreview />
      <Footer />
    </main>
  );
}
