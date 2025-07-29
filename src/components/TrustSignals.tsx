import { Shield, Lock, Heart, Users, Award, CheckCircle } from "lucide-react";
const TrustSignals = () => {
  const trustElements = [{
    icon: Shield,
    title: "Medical-Grade Security",
    description: "HIPAA-compliant encryption protects your health information"
  }, {
    icon: Lock,
    title: "Private by Design",
    description: "Your data is never sold or shared with third parties"
  }, {
    icon: Heart,
    title: "No Dating Pressure",
    description: "Friendship-focused platform designed for genuine connections"
  }, {
    icon: Users,
    title: "Verified Community",
    description: "All members verified to ensure authentic MS community"
  }, {
    icon: Award,
    title: "Trusted Platform",
    description: "4.9/5 rating from 500+ verified members"
  }, {
    icon: CheckCircle,
    title: "100% Free",
    description: "No hidden fees, premium tiers, or paid features"
  }];
  return (
    <section className="py-12 bg-white">
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
          {trustElements.map((element, index) => <div key={index} className="bg-white rounded-xl p-6 shadow-soft hover:shadow-medium transition-all duration-300 border border-gray-100">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
                <element.icon className="w-6 h-6 text-blue-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">{element.title}</h3>
              <p className="text-gray-600 text-sm leading-relaxed">{element.description}</p>
            </div>)}
        </div>

        {/* Community Features */}
        
      </div>
    </section>
  );
};
export default TrustSignals;