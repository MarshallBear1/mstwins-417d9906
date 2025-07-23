
import { Shield, Users, Heart, MessageCircle, Star, CheckCircle } from "lucide-react";

const ValueProposition = () => {
  const benefits = [
    {
      icon: Users,
      title: "Find Your People",
      description: "Connect with others who understand your MS journey"
    },
    {
      icon: Shield,
      title: "Safe & Private",
      description: "Medical-grade privacy with secure conversations"
    },
    {
      icon: Heart,
      title: "Friendship Only",
      description: "No dating pressure - just genuine connections"
    },
    {
      icon: MessageCircle,
      title: "24/7 Support",
      description: "Community support whenever you need it"
    }
  ];

  const stats = [
    { number: "1,000+", label: "Active Members" },
    { number: "10,000+", label: "Connections Made" },
    { number: "4.9/5", label: "Member Rating" },
    { number: "100%", label: "Free Forever" }
  ];

  return (
    <section className="py-16 bg-gradient-to-r from-blue-50 to-teal-50">
      <div className="container mx-auto px-6">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            Why Choose MSTwins?
          </h2>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            The only platform designed specifically for the MS community
          </p>
        </div>

        {/* Benefits Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
          {benefits.map((benefit, index) => (
            <div key={index} className="bg-white rounded-xl p-6 shadow-soft hover:shadow-medium transition-all duration-300">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
                <benefit.icon className="w-6 h-6 text-blue-600" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">{benefit.title}</h3>
              <p className="text-gray-600 text-sm">{benefit.description}</p>
            </div>
          ))}
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {stats.map((stat, index) => (
            <div key={index} className="text-center">
              <div className="text-3xl font-bold text-blue-600 mb-2">{stat.number}</div>
              <div className="text-gray-600 text-sm">{stat.label}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default ValueProposition;
