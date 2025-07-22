import { UserPlus, Users, MessageCircle, Heart } from "lucide-react";

const HowItWorks = () => {
  const steps = [
    {
      icon: UserPlus,
      title: "Join & Set Up Your Profile",
      description: "Create your account and tell us about yourself, your interests, and what kind of support you're looking for.",
      step: "01"
    },
    {
      icon: Users,
      title: "Get Matched with Like-Minded People",
      description: "Our intelligent matching system connects you with others who share similar experiences and interests.",
      step: "02"
    },
    {
      icon: MessageCircle,
      title: "Start Meaningful Conversations",
      description: "Break the ice with conversation starters and connect through our secure messaging platform.",
      step: "03"
    },
    {
      icon: Heart,
      title: "Build Lasting Friendships",
      description: "Form genuine connections and create a supportive network of friends who truly understand your journey.",
      step: "04"
    }
  ];

  return (
    <section className="py-24 bg-gradient-to-b from-white to-blue-50/50">
      <div className="container mx-auto px-6">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
            How It Works
          </h2>
        </div>

        <div className="relative">
          {/* Connection line */}
          <div className="hidden lg:block absolute top-1/2 left-0 right-0 h-0.5 bg-gradient-to-r from-blue-200 via-purple-200 to-blue-200 transform -translate-y-1/2 z-0"></div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 relative z-10">
            {steps.map((step, index) => (
              <div 
                key={index}
                className="group relative bg-white rounded-2xl p-8 shadow-lg hover:shadow-2xl transition-all duration-500 hover:-translate-y-2 animate-fade-in"
                style={{ animationDelay: `${index * 200}ms` }}
              >
                {/* Step number */}
                <div className="absolute -top-4 -right-4 w-12 h-12 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full flex items-center justify-center text-white font-bold text-lg shadow-lg">
                  {step.step}
                </div>

                {/* Icon */}
                <div className="w-16 h-16 bg-gradient-to-r from-blue-100 to-purple-100 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                  <step.icon className="w-8 h-8 text-blue-600" />
                </div>

                {/* Content */}
                <h3 className="text-xl font-bold text-gray-900 mb-4 group-hover:text-blue-600 transition-colors">
                  {step.title}
                </h3>

                {/* Animated border */}
                <div className="absolute inset-0 rounded-2xl border-2 border-transparent group-hover:border-gradient-to-r group-hover:from-blue-200 group-hover:to-purple-200 transition-all duration-300"></div>
              </div>
            ))}
          </div>
        </div>

      </div>
    </section>
  );
};

export default HowItWorks;