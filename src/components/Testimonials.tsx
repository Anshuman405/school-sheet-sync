
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface TestimonialProps {
  quote: string;
  name: string;
  title: string;
  avatar: string;
}

function TestimonialCard({ quote, name, title, avatar }: TestimonialProps) {
  return (
    <div className="bg-card rounded-lg border p-6 flex flex-col h-full">
      <div className="flex-1">
        <p className="italic text-muted-foreground mb-4">"{quote}"</p>
      </div>
      <div className="flex items-center gap-3 mt-4">
        <Avatar>
          <AvatarImage src={avatar} alt={name} />
          <AvatarFallback>{name.charAt(0)}</AvatarFallback>
        </Avatar>
        <div>
          <h4 className="font-medium">{name}</h4>
          <p className="text-sm text-muted-foreground">{title}</p>
        </div>
      </div>
    </div>
  );
}

export default function Testimonials() {
  const testimonials = [
    {
      quote: "SheetSync has transformed how our admin staff manages student data. The real-time collaboration features saved us countless hours during enrollment periods.",
      name: "Sarah Johnson",
      title: "School Administrator, Lincoln High",
      avatar: "/placeholder.svg"
    },
    {
      quote: "As a math teacher, I use SheetSync to track student progress and share data with colleagues. The interface is intuitive and the collaborative features are game-changing.",
      name: "Michael Chen",
      title: "Math Department Head, Westview Academy",
      avatar: "/placeholder.svg"
    },
    {
      quote: "The ability to have multiple teachers working on the same grade sheets in real-time has been revolutionary for our quarterly reporting process.",
      name: "Emily Rodriguez",
      title: "Principal, Oakridge Elementary",
      avatar: "/placeholder.svg"
    }
  ];

  return (
    <section className="py-16 md:py-24">
      <div className="container px-4 md:px-6">
        <div className="text-center max-w-[800px] mx-auto mb-12">
          <h2 className="text-3xl font-bold tracking-tight mb-4">What Educators Say</h2>
          <p className="text-muted-foreground text-lg">
            Schools across the country are transforming how they manage data with SheetSync.
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {testimonials.map((testimonial, index) => (
            <TestimonialCard 
              key={index}
              quote={testimonial.quote}
              name={testimonial.name}
              title={testimonial.title}
              avatar={testimonial.avatar}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
