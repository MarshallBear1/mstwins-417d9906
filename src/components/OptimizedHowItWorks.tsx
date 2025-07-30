
import { UserPlus, Users, MessageCircle, Heart, ArrowRight, Clock, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import FeaturedProfiles from "@/components/FeaturedProfiles";

const OptimizedHowItWorks = () => {
  const steps = [
    {
      icon: UserPlus,
      title: "Create Your Profile",
      description: "Share your MS journey, interests, and what support you're looking for",
      time: "2 minutes",
      step: "01"
    },
    {
      icon: Users,
      title: "Get Matched",
      description: "Our system connects you with compatible community members nearby",
      time: "Instantly",
      step: "02"
    },
    {
      icon: MessageCircle,
      title: "Start Chatting",
      description: "Break the ice with guided conversation starters and connect safely",
      time: "Right away",
      step: "03"
    },
    {
      icon: Heart,
      title: "Build Friendships",
      description: "Form lasting connections with people who truly understand your journey",
      time: "Ongoing",
      step: "04"
    }
  ];

  const features = [
    {
      icon: Shield,
      title: "Private & Secure",
      description: "Medical-grade encryption keeps your conversations safe"
    },
    {
      icon: Clock,
      title: "No Time Pressure",
      description: "Connect at your own pace, understanding MS limitations"
    },
    {
      icon: Heart,
      title: "Friendship Focus",
      description: "No dating pressure - just genuine supportive connections"
    }
  ];

  return (
    <section className="py-24 bg-white">
      <div className="container mx-auto px-6">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
            How MS<span className="text-blue-600">Twins</span> Works
          </h2>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Simple, safe, and designed specifically for the MS community
          </p>
        </div>

        <div className="mb-20">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {steps.map((step, index) => (
              <div key={index} className="relative group">
                {/* Clean Step Number */}
                <div className="absolute -top-4 -right-4 w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center text-white font-bold text-lg shadow-lg">
                  {index + 1}
                </div>
                
                {/* Clean Icon Container */}
                <div className="w-16 h-16 bg-blue-100 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                  <step.icon className="w-8 h-8 text-blue-600" />
                </div>

                {/* Content */}
                <h3 className="text-xl font-bold text-gray-900 mb-3 group-hover:text-blue-600 transition-colors">
                  {step.title}
                </h3>
                <p className="text-gray-600 mb-4 leading-relaxed">
                  {step.description}
                </p>
                
                {/* Time indicator */}
                <div className="flex items-center text-sm text-blue-600 font-medium">
                  <Clock className="w-4 h-4 mr-1" />
                  {step.time}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Featured Profiles */}
        <div className="mb-20">
          <div className="text-center mb-12">
            <h3 className="text-3xl font-bold text-gray-900 mb-4">
              Meet Your Community
            </h3>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Discover real people in our MS<span className="text-blue-600">Twins</span> community. 
              Flip the cards to learn more about their journey and experiences.
            </p>
          </div>
          <FeaturedProfiles />
        </div>

        {/* Features */}
        <div className="grid md:grid-cols-3 gap-8 mb-12">
          {features.map((feature, index) => (
            <div key={index} className="text-center">
              <div className="w-16 h-16 bg-blue-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <feature.icon className="w-8 h-8 text-blue-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">{feature.title}</h3>
              <p className="text-gray-600">{feature.description}</p>
            </div>
          ))}
        </div>

        {/* CTA */}
        <div className="text-center">
          <Button 
            variant="hero" 
            size="lg" 
            className="text-lg px-8 py-4 bg-blue-600 hover:bg-blue-700 text-white shadow-strong" 
            asChild
          >
            <Link to="/auth">
              Start Connecting Today
              <ArrowRight className="w-5 h-5 ml-2" />
            </Link>
          </Button>
          <p className="text-sm text-gray-500 mt-3">
            Free to join • No credit card required • 100% private
          </p>
        </div>
      </div>
    </section>
  );
};

export default OptimizedHowItWorks;
