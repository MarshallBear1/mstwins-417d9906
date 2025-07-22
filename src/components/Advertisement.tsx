import { useState, useEffect } from "react";
import { Heart, MessageCircle, Users, Shield, Sparkles, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

const Advertisement = () => {
  const [currentStep, setCurrentStep] = useState(0);
  const [isAnimating, setIsAnimating] = useState(true);

  const profiles = [
    {
      id: 1,
      name: "Sarah",
      age: 28,
      location: "Boston, MA",
      image: "/lovable-uploads/4872045b-6fa1-4c2c-b2b9-cba6d4add944.png",
      msType: "Relapsing-Remitting",
      interests: ["Photography", "Yoga", "Cooking"]
    },
    {
      id: 2,
      name: "Emily",
      age: 32,
      location: "Seattle, WA",
      image: "/lovable-uploads/2293d200-728d-46fb-a007-7994ca0a639c.png",
      msType: "Progressive",
      interests: ["Reading", "Gardening", "Art"]
    }
  ];

  const steps = [
    { title: "Browse Profiles", icon: Users, description: "Discover people who understand your journey" },
    { title: "Connect & Match", icon: Heart, description: "Like profiles that resonate with you" },
    { title: "Start Chatting", icon: MessageCircle, description: "Build meaningful relationships" },
  ];

  useEffect(() => {
    if (!isAnimating) return;
    
    const interval = setInterval(() => {
      setCurrentStep((prev) => (prev + 1) % steps.length);
    }, 3000);

    return () => clearInterval(interval);
  }, [isAnimating, steps.length]);

  return (
    <section className="py-20 bg-gradient-to-br from-background via-primary/5 to-secondary/5 relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0 opacity-20">
        <div className="absolute top-10 left-10 w-20 h-20 bg-primary/20 rounded-full animate-pulse" />
        <div className="absolute top-40 right-20 w-16 h-16 bg-secondary/20 rounded-full animate-pulse" style={{animationDelay: '1s'}} />
        <div className="absolute bottom-20 left-1/4 w-12 h-12 bg-accent/20 rounded-full animate-pulse" style={{animationDelay: '2s'}} />
      </div>

      <div className="container mx-auto px-6 lg:px-8 relative z-10">
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 bg-primary/10 rounded-full px-4 py-2 mb-6">
            <Sparkles className="w-4 h-4 text-primary" />
            <span className="text-sm font-medium text-primary">See MSTwins in Action</span>
          </div>
          <h2 className="text-4xl lg:text-5xl font-bold mb-6 bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
            Where Understanding Meets Connection
          </h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            Watch how MSTwins brings together people who truly understand the MS journey, 
            creating meaningful connections based on shared experiences and mutual support.
          </p>
        </div>

        {/* Interactive Demo */}
        <div className="grid lg:grid-cols-2 gap-12 items-center mb-16">
          {/* Demo Animation */}
          <div className="relative">
            <div className="bg-card rounded-2xl shadow-2xl p-8 border">
              <div className="space-y-6">
                {/* Profile Cards Animation */}
                <div className="relative h-80 overflow-hidden">
                  {profiles.map((profile, index) => (
                    <div
                      key={profile.id}
                      className={`absolute inset-0 transition-all duration-500 transform ${
                        index === 0 
                          ? 'translate-x-0 scale-100 opacity-100 z-10' 
                          : index === 1 
                            ? 'translate-x-4 scale-95 opacity-60 z-5'
                            : 'translate-x-8 scale-90 opacity-30'
                      }`}
                    >
                      <div className="bg-white rounded-xl shadow-lg p-6 border border-border">
                        <div className="flex items-start space-x-4">
                          <div className="w-16 h-16 rounded-full overflow-hidden bg-gray-100">
                            <img 
                              src={profile.image} 
                              alt={profile.name}
                              className="w-full h-full object-cover"
                            />
                          </div>
                          <div className="flex-1">
                            <h3 className="text-lg font-semibold text-gray-900">{profile.name}, {profile.age}</h3>
                            <p className="text-sm text-gray-600">{profile.location}</p>
                            <p className="text-sm text-primary font-medium mt-1">{profile.msType} MS</p>
                            <div className="flex flex-wrap gap-1 mt-2">
                              {profile.interests.map((interest) => (
                                <span key={interest} className="bg-primary/10 text-primary text-xs px-2 py-1 rounded-full">
                                  {interest}
                                </span>
                              ))}
                            </div>
                          </div>
                        </div>
                        
                        {/* Action Buttons */}
                        <div className="flex justify-center space-x-4 mt-6">
                          <button className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center hover:bg-gray-200 transition-colors">
                            <span className="text-lg">👎</span>
                          </button>
                          <button className="w-12 h-12 rounded-full bg-primary flex items-center justify-center hover:bg-primary/90 transition-all transform hover:scale-110">
                            <Heart className="w-5 h-5 text-white" fill="white" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Match Animation */}
                <div className="text-center">
                  <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-pink-500 to-red-500 rounded-full animate-pulse">
                    <Heart className="w-8 h-8 text-white" fill="white" />
                  </div>
                  <p className="text-primary font-semibold mt-2 animate-fade-in">It's a Match! 💕</p>
                </div>
              </div>
            </div>
          </div>

          {/* Steps */}
          <div className="space-y-8">
            {steps.map((step, index) => (
              <div
                key={index}
                className={`flex items-start space-x-4 p-6 rounded-xl transition-all duration-500 ${
                  index === currentStep
                    ? 'bg-primary/10 border-2 border-primary/20 scale-105'
                    : 'bg-card border border-border hover:bg-primary/5'
                }`}
              >
                <div className={`w-12 h-12 rounded-full flex items-center justify-center transition-colors ${
                  index === currentStep ? 'bg-primary text-white' : 'bg-primary/10 text-primary'
                }`}>
                  <step.icon className="w-6 h-6" />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold mb-2">{step.title}</h3>
                  <p className="text-muted-foreground">{step.description}</p>
                </div>
                {index === currentStep && (
                  <ArrowRight className="w-5 h-5 text-primary animate-bounce" style={{animationDirection: 'alternate'}} />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-3 gap-8 mb-16">
          <div className="text-center p-6 rounded-xl bg-card border border-border hover:bg-primary/5 transition-colors group">
            <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:bg-primary/20 transition-colors">
              <Shield className="w-8 h-8 text-primary" />
            </div>
            <h3 className="text-xl font-semibold mb-2">Safe & Private</h3>
            <p className="text-muted-foreground">Your privacy is protected with advanced security measures and verified profiles.</p>
          </div>
          
          <div className="text-center p-6 rounded-xl bg-card border border-border hover:bg-primary/5 transition-colors group">
            <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:bg-primary/20 transition-colors">
              <Users className="w-8 h-8 text-primary" />
            </div>
            <h3 className="text-xl font-semibold mb-2">Understanding Community</h3>
            <p className="text-muted-foreground">Connect with people who truly understand your MS journey and challenges.</p>
          </div>
          
          <div className="text-center p-6 rounded-xl bg-card border border-border hover:bg-primary/5 transition-colors group">
            <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:bg-primary/20 transition-colors">
              <Heart className="w-8 h-8 text-primary" />
            </div>
            <h3 className="text-xl font-semibold mb-2">Meaningful Connections</h3>
            <p className="text-muted-foreground">Build lasting relationships based on shared experiences and mutual support.</p>
          </div>
        </div>

        {/* CTA Section */}
        <div className="text-center bg-gradient-to-r from-primary to-secondary rounded-2xl p-12 text-white">
          <h3 className="text-3xl font-bold mb-4">Ready to Find Your Community?</h3>
          <p className="text-xl mb-8 opacity-90">Join thousands of people with MS who have found friendship, support, and love on MSTwins.</p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" variant="secondary" className="text-primary hover:text-primary/90" asChild>
              <Link to="/auth">Start Your Journey</Link>
            </Button>
            <Button size="lg" variant="outline" className="border-white text-white hover:bg-white hover:text-primary">
              Learn More
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Advertisement;