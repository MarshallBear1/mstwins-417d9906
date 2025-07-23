
import { Shield, Lock, Heart, Users, Award, CheckCircle } from "lucide-react";

const TrustSignals = () => {
  const trustElements = [
    {
      icon: Shield,
      title: "Medical-Grade Security",
      description: "HIPAA-compliant encryption protects your health information"
    },
    {
      icon: Lock,
      title: "Private by Design",
      description: "Your data is never sold or shared with third parties"
    },
    {
      icon: Heart,
      title: "No Dating Pressure",
      description: "Friendship-focused platform designed for genuine connections"
    },
    {
      icon: Users,
      title: "Verified Community",
      description: "All members verified to ensure authentic MS community"
    },
    {
      icon: Award,
      title: "Trusted Platform",
      description: "4.9/5 rating from 1,000+ verified members"
    },
    {
      icon: CheckCircle,
      title: "100% Free",
      description: "No hidden fees, premium tiers, or paid features"
    }
  ];

  const securityFeatures = [
    "End-to-end encryption for all messages",
    "Secure photo sharing with auto-deletion",
    "Anonymous reporting system",
    "24/7 community moderation",
    "Verified member profiles only"
  ];

  return (
    <section className="py-20 bg-gradient-to-b from-gray-50 to-white">
      <div className="container mx-auto px-6">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            Your Safety is Our Priority
          </h2>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Built with the highest security standards to protect your privacy and create a safe space for the MS community.
          </p>
        </div>

        {/* Trust Elements Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 mb-16">
          {trustElements.map((element, index) => (
            <div key={index} className="bg-white rounded-xl p-6 shadow-soft hover:shadow-medium transition-all duration-300 border border-gray-100">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
                <element.icon className="w-6 h-6 text-blue-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">{element.title}</h3>
              <p className="text-gray-600 text-sm leading-relaxed">{element.description}</p>
            </div>
          ))}
        </div>

        {/* Security Features */}
        <div className="bg-blue-50 rounded-2xl p-8 md:p-12">
          <div className="grid md:grid-cols-2 gap-8 items-center">
            <div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">
                Advanced Security Features
              </h3>
              <p className="text-gray-600 mb-6">
                We've implemented military-grade security to ensure your conversations and personal information remain completely private.
              </p>
              <ul className="space-y-3">
                {securityFeatures.map((feature, index) => (
                  <li key={index} className="flex items-start">
                    <CheckCircle className="w-5 h-5 text-green-500 mr-3 mt-0.5 flex-shrink-0" />
                    <span className="text-gray-700">{feature}</span>
                  </li>
                ))}
              </ul>
            </div>
            
            <div className="text-center">
              <div className="w-32 h-32 bg-blue-600 rounded-full flex items-center justify-center mx-auto mb-6">
                <Shield className="w-16 h-16 text-white" />
              </div>
              <div className="text-3xl font-bold text-blue-600 mb-2">256-bit</div>
              <div className="text-gray-600">End-to-end encryption</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default TrustSignals;
