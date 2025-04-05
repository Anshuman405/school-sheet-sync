
import { 
  UsersRound, 
  FileSpreadsheet, 
  History, 
  Shield, 
  Layers, 
  Layout 
} from "lucide-react";

interface FeatureProps {
  icon: React.ReactNode;
  title: string;
  description: string;
}

function Feature({ icon, title, description }: FeatureProps) {
  return (
    <div className="bg-card rounded-lg border p-6 h-full flex flex-col">
      <div className="h-12 w-12 rounded-lg bg-primary/10 text-primary flex items-center justify-center mb-4">
        {icon}
      </div>
      <h3 className="text-xl font-semibold mb-2">{title}</h3>
      <p className="text-muted-foreground leading-relaxed">{description}</p>
    </div>
  );
}

export default function Features() {
  const features = [
    {
      icon: <UsersRound size={24} />,
      title: "Real-time Collaboration",
      description: "Work together with colleagues and students simultaneously on the same sheet with live presence indicators."
    },
    {
      icon: <FileSpreadsheet size={24} />,
      title: "Powerful Spreadsheets",
      description: "Create dynamic data tables with formulas, filtering, and sorting capabilities designed for educational data."
    },
    {
      icon: <History size={24} />,
      title: "Automatic Saving",
      description: "Never lose your work again with continuous saving that tracks every change made to your documents."
    },
    {
      icon: <Shield size={24} />,
      title: "Secure Access Control",
      description: "Control who can view, edit, or share your spreadsheets with role-based permissions and controls."
    },
    {
      icon: <Layers size={24} />,
      title: "Multiple Workspaces",
      description: "Organize spreadsheets by class, department, or project with customizable workspace structures."
    },
    {
      icon: <Layout size={24} />,
      title: "Intuitive Interface",
      description: "Clean, modern design that's easy to use for teachers, administrators and students of all tech levels."
    }
  ];

  return (
    <section className="py-16 md:py-24 bg-muted/50">
      <div className="container px-4 md:px-6">
        <div className="text-center max-w-[800px] mx-auto mb-12">
          <h2 className="text-3xl font-bold tracking-tight mb-4">Features Built for Education</h2>
          <p className="text-muted-foreground text-lg">
            Everything you need to manage, analyze, and collaborate on your school's data efficiently.
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature, index) => (
            <Feature 
              key={index}
              icon={feature.icon}
              title={feature.title}
              description={feature.description}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
