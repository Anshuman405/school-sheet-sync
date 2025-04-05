
import Navbar from "@/components/Navbar";
import Hero from "@/components/Hero";
import Features from "@/components/Features";
import SpreadsheetDemo from "@/components/SpreadsheetDemo";
import Testimonials from "@/components/Testimonials";
import CTASection from "@/components/CTASection";
import Footer from "@/components/Footer";

const Index = () => {
  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <main className="flex-1">
        <Hero />
        
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
        
        <Features />
        <Testimonials />
        <CTASection />
      </main>
      <Footer />
    </div>
  );
};

export default Index;
