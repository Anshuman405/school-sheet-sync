
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

export default function CTASection() {
  return (
    <section className="py-16 md:py-24 bg-primary text-primary-foreground">
      <div className="container px-4 md:px-6">
        <div className="flex flex-col items-center gap-6 text-center max-w-[800px] mx-auto">
          <h2 className="text-3xl font-bold tracking-tight">Ready to transform how your school manages data?</h2>
          <p className="text-lg opacity-90">
            Join hundreds of schools already using SheetSync to collaborate on spreadsheets in real-time.
          </p>
          <div className="flex flex-col sm:flex-row gap-4">
            <Link to="/signup">
              <Button size="lg" variant="secondary" className="font-medium h-12 px-6">
                Start Free Trial
              </Button>
            </Link>
            <Link to="/demo">
              <Button size="lg" variant="outline" className="font-medium h-12 px-6 bg-transparent border-primary-foreground/20 hover:bg-primary-foreground/10">
                Schedule a Demo
              </Button>
            </Link>
          </div>
          <p className="text-sm opacity-75 mt-2">No credit card required. 14-day free trial.</p>
        </div>
      </div>
    </section>
  );
}
