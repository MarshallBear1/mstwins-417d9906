
import { Card, CardContent } from "@/components/ui/card";
import { Quote, Star, Users, MessageCircle, Heart } from "lucide-react";

const SocialProof = () => {
  const testimonials = [
    {
      name: "Sarah M.",
      location: "Portland, OR",
      msType: "RRMS",
      testimonial: "I found my support network here. People who actually understand what fatigue means and don't judge when I need to cancel plans.",
      rating: 5,
      avatar: "https://api.dicebear.com/6.x/avataaars/svg?seed=Sarah2&backgroundColor=b6e3f4,c0aede&eyes=happy&mouth=smile"
    },
    {
      name: "Michael R.",
      location: "Austin, TX", 
      msType: "SPMS",
      testimonial: "The community here gets it. No need to explain why I need to rest or how brain fog affects my work. Just understanding and support.",
      rating: 5,
      avatar: "https://api.dicebear.com/6.x/avataaars/svg?seed=Michael2&backgroundColor=b6e3f4,c0aede&eyes=happy&mouth=smile"
    },
    {
      name: "Jennifer L.",
      location: "Boston, MA",
      msType: "RRMS", 
      testimonial: "I was hesitant about joining another platform, but this is different. Real friendships, genuine support, and zero pressure.",
      rating: 5,
      avatar: "https://api.dicebear.com/6.x/avataaars/svg?seed=Jennifer2&backgroundColor=b6e3f4,c0aede&eyes=happy&mouth=smile"
    },
    {
      name: "David K.",
      location: "Chicago, IL",
      msType: "PPMS",
      testimonial: "Met my best friend here. We video chat weekly and support each other through flares. This platform changed my life.",
      rating: 5,
      avatar: "https://api.dicebear.com/6.x/avataaars/svg?seed=David2&backgroundColor=b6e3f4,c0aede&eyes=happy&mouth=smile"
    }
  ];

  const metrics = [
    {
      icon: Users,
      value: "500+",
      label: "Active Members",
      description: "Growing community of MS warriors"
    },
    {
      icon: MessageCircle,
      value: "1,000+",
      label: "Connections Made",
      description: "Meaningful friendships formed"
    },
    {
      icon: Heart,
      value: "4.9/5",
      label: "Member Rating",
      description: "Highly rated by our community"
    },
    {
      icon: Star,
      value: "98%",
      label: "Would Recommend",
      description: "Members love our platform"
    }
  ];

  return (
    <section className="py-24 bg-gradient-subtle">
      <div className="container mx-auto px-6 lg:px-8">
        {/* Header */}
        <div className="text-center space-y-4 mb-16">
          <h2 className="text-3xl md:text-4xl font-bold">
            Trusted by the{" "}
            <span className="bg-gradient-hero bg-clip-text text-transparent">
              MS Community
            </span>
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Real stories from real people who found their support network with MS<span className="text-blue-600">Twins</span>.
          </p>
        </div>

        {/* Metrics */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-16">
          {metrics.map((metric, index) => (
            <div key={index} className="text-center">
              <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <metric.icon className="w-8 h-8 text-primary" />
              </div>
              <div className="text-3xl font-bold text-primary mb-2">{metric.value}</div>
              <div className="font-semibold text-foreground mb-1">{metric.label}</div>
              <div className="text-sm text-muted-foreground">{metric.description}</div>
            </div>
          ))}
        </div>

        {/* Testimonials */}
        <div className="grid md:grid-cols-2 gap-8">
          {testimonials.map((testimonial, index) => (
            <Card key={index} className="hover:shadow-medium transition-all duration-300 border-0 shadow-soft">
              <CardContent className="p-8 space-y-6">
                <div className="flex justify-center">
                  <Quote className="w-8 h-8 text-primary opacity-60" />
                </div>
                
                <p className="text-center italic text-foreground leading-relaxed">
                  "{testimonial.testimonial}"
                </p>

                <div className="flex justify-center space-x-1">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <Star key={i} className="w-4 h-4 text-accent fill-current" />
                  ))}
                </div>

                <div className="flex items-center justify-center space-x-4">
                  <div className="w-12 h-12 rounded-full overflow-hidden">
                    <img 
                      src={testimonial.avatar} 
                      alt={testimonial.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="text-center">
                    <p className="font-semibold text-foreground">{testimonial.name}</p>
                    <p className="text-sm text-muted-foreground">{testimonial.location}</p>
                    <p className="text-xs text-primary font-medium">{testimonial.msType}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
};

export default SocialProof;
