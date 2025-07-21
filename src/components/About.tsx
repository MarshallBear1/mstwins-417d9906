import { Heart, Users, Shield, Zap } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

const About = () => {
  return (
    <section id="about" className="py-20 bg-background">
      <div className="container mx-auto px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            About MSTwins
          </h2>
          <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
            MSTwins is a supportive community platform designed specifically for people living with Multiple Sclerosis. 
            We help you find meaningful connections, share experiences, and build lasting friendships.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-12 items-center mb-16">
          <div className="space-y-6">
            <h3 className="text-2xl font-bold text-foreground">Our Mission</h3>
            <p className="text-muted-foreground leading-relaxed">
              Living with MS can feel isolating, but it doesn&apos;t have to be. MSTwins connects individuals who understand 
              the unique challenges and experiences of living with Multiple Sclerosis. Our platform focuses on building 
              genuine friendships and support networks, not romantic relationships.
            </p>
            <p className="text-muted-foreground leading-relaxed">
              We believe that shared experiences create the strongest bonds. Whether you&apos;re newly diagnosed or have been 
              on this journey for years, you&apos;ll find people who truly understand your path.
            </p>
          </div>
          <div className="relative">
            <img 
              src="https://images.unsplash.com/photo-1559757148-5c350d0d3c56?w=600&h=400&fit=crop&crop=center" 
              alt="People supporting each other"
              className="rounded-2xl shadow-lg w-full h-80 object-cover"
            />
          </div>
        </div>

        <div className="mb-16">
          <h3 className="text-2xl font-bold text-center text-foreground mb-12">How It Works</h3>
          <div className="grid md:grid-cols-4 gap-8">
            <Card className="text-center">
              <CardContent className="p-6">
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Users className="w-8 h-8 text-blue-600" />
                </div>
                <h4 className="font-semibold text-foreground mb-2">1. Create Profile</h4>
                <p className="text-sm text-muted-foreground">
                  Share your MS journey, interests, and what you&apos;re looking for in connections
                </p>
              </CardContent>
            </Card>

            <Card className="text-center">
              <CardContent className="p-6">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Heart className="w-8 h-8 text-green-600" />
                </div>
                <h4 className="font-semibold text-foreground mb-2">2. Discover</h4>
                <p className="text-sm text-muted-foreground">
                  Browse profiles of others in the MS community who share similar experiences
                </p>
              </CardContent>
            </Card>

            <Card className="text-center">
              <CardContent className="p-6">
                <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Zap className="w-8 h-8 text-purple-600" />
                </div>
                <h4 className="font-semibold text-foreground mb-2">3. Connect</h4>
                <p className="text-sm text-muted-foreground">
                  Like profiles that resonate with you and match with others who like you back
                </p>
              </CardContent>
            </Card>

            <Card className="text-center">
              <CardContent className="p-6">
                <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Shield className="w-8 h-8 text-orange-600" />
                </div>
                <h4 className="font-semibold text-foreground mb-2">4. Build Friendships</h4>
                <p className="text-sm text-muted-foreground">
                  Start conversations and build meaningful, supportive friendships
                </p>
              </CardContent>
            </Card>
          </div>
        </div>

        <div className="bg-blue-50 rounded-2xl p-8 text-center">
          <h3 className="text-2xl font-bold text-foreground mb-4">
            A Safe Space for the MS Community
          </h3>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            MSTwins is built with privacy and safety as our top priorities. We understand the sensitive nature 
            of health information and provide a secure environment where you can connect with confidence.
          </p>
        </div>
      </div>
    </section>
  );
};

export default About;