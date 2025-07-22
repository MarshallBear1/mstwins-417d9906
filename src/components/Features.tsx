import { Card, CardContent } from "@/components/ui/card";
import { Heart, MessageCircle, Users, Shield, Search, Bell } from "lucide-react";

const Features = () => {
  const features = [
    {
      icon: Search,
      title: "Discover Your Community",
      description: "Browse profiles of others living with MS who share your interests, location, or experiences.",
      color: "text-primary"
    },
    {
      icon: Heart,
      title: "Build Meaningful Connections",
      description: "Like profiles to show interest and create mutual matches with people you'd like to know better.",
      color: "text-accent"
    },
    {
      icon: MessageCircle,
      title: "Safe Private Messaging",
      description: "Start conversations in a secure environment designed for the MS community.",
      color: "text-success"
    },
    {
      icon: Users,
      title: "Share Your Journey",
      description: "Connect over shared symptoms, treatments, and the unique experiences of living with MS.",
      color: "text-primary"
    },
    {
      icon: Shield,
      title: "Privacy & Safety First",
      description: "Your information is protected with medical-grade security and privacy controls.",
      color: "text-muted-foreground"
    },
    {
      icon: Bell,
      title: "Stay Connected",
      description: "Get notified when someone likes your profile or sends you a message.",
      color: "text-accent"
    }
  ];

  return (
    <section className="py-24 bg-background">
      <div className="container mx-auto px-6 lg:px-8">
        <div className="text-center space-y-4 mb-16">
          <h2 className="text-3xl md:text-4xl font-bold">
            Features
          </h2>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <Card 
              key={index} 
              className="hover:shadow-medium transition-all duration-300 hover:-translate-y-1 border-0 shadow-soft"
            >
              <CardContent className="p-8 text-center space-y-4">
                <div className="flex justify-center">
                  <div className="p-4 bg-gradient-subtle rounded-full">
                    <feature.icon className={`w-8 h-8 ${feature.color}`} />
                  </div>
                </div>
                <h3 className="text-xl font-semibold">{feature.title}</h3>
                <p className="text-muted-foreground leading-relaxed">
                  {feature.description}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Features;