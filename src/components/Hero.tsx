import { Button } from "@/components/ui/button";
import { Heart, Users, Shield, MessageCircle } from "lucide-react";
import heroImage from "@/assets/hero-image.jpg";

const Hero = () => {
  return (
    <section className="relative min-h-screen flex items-center bg-gradient-subtle">
      <div className="container mx-auto px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          {/* Content */}
          <div className="text-center lg:text-left space-y-8 animate-fade-in">
            <div className="space-y-4">
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold leading-tight">
                Connect with your{" "}
                <span className="bg-gradient-hero bg-clip-text text-transparent">
                  MS community
                </span>
              </h1>
              <p className="text-xl md:text-2xl text-muted-foreground max-w-2xl mx-auto lg:mx-0">
                Find understanding, build friendships, and share your journey with others who truly get it.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
              <Button variant="hero" size="lg" className="text-lg" asChild>
                <a href="/auth">
                  Get Started
                  <Heart className="w-5 h-5" />
                </a>
              </Button>
              <Button variant="outline" size="lg" className="text-lg">
                Learn More
              </Button>
            </div>

            {/* Feature highlights */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 pt-8">
              <div className="flex items-center gap-3 justify-center lg:justify-start">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <Users className="w-6 h-6 text-primary" />
                </div>
                <span className="text-sm font-medium">Safe Community</span>
              </div>
              <div className="flex items-center gap-3 justify-center lg:justify-start">
                <div className="p-2 bg-accent/10 rounded-lg">
                  <Shield className="w-6 h-6 text-accent" />
                </div>
                <span className="text-sm font-medium">Privacy First</span>
              </div>
              <div className="flex items-center gap-3 justify-center lg:justify-start">
                <div className="p-2 bg-success/10 rounded-lg">
                  <MessageCircle className="w-6 h-6 text-success" />
                </div>
                <span className="text-sm font-medium">Real Connections</span>
              </div>
            </div>
          </div>

          {/* Hero Image */}
          <div className="relative animate-scale-in">
            <div className="relative overflow-hidden rounded-2xl shadow-strong">
              <img
                src={heroImage}
                alt="People connecting and supporting each other in a medical community"
                className="w-full h-auto object-cover"
              />
              <div className="absolute inset-0 bg-gradient-primary opacity-10"></div>
            </div>
            {/* Floating elements */}
            <div className="absolute -top-6 -right-6 p-4 bg-card rounded-full shadow-medium border">
              <Heart className="w-8 h-8 text-accent" fill="currentColor" />
            </div>
            <div className="absolute -bottom-6 -left-6 p-4 bg-card rounded-full shadow-medium border">
              <Users className="w-8 h-8 text-primary" />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;