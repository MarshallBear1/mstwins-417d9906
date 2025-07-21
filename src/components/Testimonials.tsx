import { Card, CardContent } from "@/components/ui/card";
import { Quote, Star } from "lucide-react";

const Testimonials = () => {
  const testimonials = [
    {
      name: "Sarah M.",
      location: "Portland, OR",
      msType: "RRMS",
      testimonial: "Finding people who understand what it's like to live with MS has been life-changing. I've made genuine friendships here.",
      rating: 5
    },
    {
      name: "Michael R.",
      location: "Austin, TX", 
      msType: "SPMS",
      testimonial: "The community here gets it. No need to explain why I need to rest or how fatigue affects everything. Just understanding.",
      rating: 5
    },
    {
      name: "Jennifer L.",
      location: "Boston, MA",
      msType: "RRMS", 
      testimonial: "I was hesitant at first, but this isn't about dating - it's about real connections with people who share my journey.",
      rating: 5
    }
  ];

  return (
    <section className="py-24 bg-gradient-subtle">
      <div className="container mx-auto px-6 lg:px-8">
        <div className="text-center space-y-4 mb-16">
          <h2 className="text-3xl md:text-4xl font-bold">
            Stories from Our{" "}
            <span className="bg-gradient-hero bg-clip-text text-transparent">
              Community
            </span>
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Real experiences from real people in the MS community.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
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

                <div className="text-center space-y-1">
                  <p className="font-semibold text-foreground">{testimonial.name}</p>
                  <p className="text-sm text-muted-foreground">{testimonial.location}</p>
                  <p className="text-xs text-primary font-medium">{testimonial.msType}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Testimonials;