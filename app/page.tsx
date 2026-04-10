import { Header } from "@/components/header"
import { Hero } from "@/components/hero"
import { SystemsSection } from "@/components/systems-section"
import { AboutSection } from "@/components/about-section"
import { SectiTimelineSection } from "@/components/secti-timeline-section"
import { Footer } from "@/components/footer"
import { BackToTop } from "@/components/back-to-top"

export default function Home() {
  return (
    <main className="min-h-screen">
      <Header />
      <Hero />
      <SystemsSection />
      <AboutSection />
      <SectiTimelineSection />
      <Footer />
      <BackToTop />
    </main>
  )
}
