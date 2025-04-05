
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

export default function Hero() {
  return (
    <section className="py-20 md:py-28">
      <div className="container px-4 md:px-6">
        <div className="flex flex-col items-center gap-4 text-center">
          <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight">
            The Modern Spreadsheet for <span className="text-primary">Modern Schools</span>
          </h1>
          <p className="max-w-[700px] text-lg text-muted-foreground md:text-xl">
            Collaborate in real-time, organize data efficiently, and transform how your school manages information.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 min-[400px]:gap-4">
            <Link to="/signup">
              <Button size="lg" className="font-medium h-12 px-6">
                Get Started
              </Button>
            </Link>
            <Link to="/demo">
              <Button size="lg" variant="outline" className="font-medium h-12 px-6">
                Try Demo
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
