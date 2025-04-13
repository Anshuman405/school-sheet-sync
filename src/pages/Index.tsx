import Navbar from "@/components/Navbar";
import Hero from "@/components/Hero";
import Features from "@/components/Features";
import SpreadsheetDemo from "@/components/SpreadsheetDemo";
import Testimonials from "@/components/Testimonials";
import CTASection from "@/components/CTASection";
import Footer from "@/components/Footer";
import { Route, Routes } from "react-router-dom";
import { useRef } from "react";

const Index = () => {
  const featuresRef = useRef<HTMLDivElement>(null);
  const testimonialsRef = useRef<HTMLDivElement>(null);
  const ctaRef = useRef<HTMLDivElement>(null);

  const scrollToSection = (section: string) => {
    if (section === "features" && featuresRef.current) {
      featuresRef.current.scrollIntoView({ behavior: "smooth" });
    } else if (section === "testimonials" && testimonialsRef.current) {
      testimonialsRef.current.scrollIntoView({ behavior: "smooth" });
    } else if (section === "cta" && ctaRef.current) {
      ctaRef.current.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <div className="flex flex-col min-h-screen">
      <Navbar scrollToSection={scrollToSection} />
      <main className="flex-1">
        <Hero/>
        
        <section className="py-16 md:py-24">
          <div className="container px-4 md:px-6">
            <div className="text-center max-w-[800px] mx-auto mb-12">
              <h2 className="text-3xl font-bold tracking-tight mb-4">Collaborate on Spreadsheets in Real-Time</h2>
              <p className="text-muted-foreground text-lg">
                A powerful spreadsheet solution built specifically for schools and educational institutions.
              </p>
            </div>
            <SpreadsheetDemo />
          </div>
        </section>
        <div ref={featuresRef}>
          <Features />
        </div>
        <div ref={testimonialsRef}>
          <Testimonials />
        </div>
        <div ref={ctaRef}>
          <CTASection />
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Index;
