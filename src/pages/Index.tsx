
import Header from "@/components/Header";
import Hero from "@/components/Hero";
import OptimizedHowItWorks from "@/components/OptimizedHowItWorks";
import MatchingAnimation from "@/components/MatchingAnimation";
import SocialProof from "@/components/SocialProof";
import TrustSignals from "@/components/TrustSignals";
import Footer from "@/components/Footer";
import LaunchStats from "@/components/LaunchStats";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";

const Index = () => {
  return (
    <div className="min-h-screen">
      <Header />
      <main>
        <Hero />
        <div id="how-it-works">
          <OptimizedHowItWorks />
        </div>
        <MatchingAnimation />
        <TrustSignals />
        <div id="testimonials">
          <SocialProof />
        </div>
        
        {/* Final CTA Section */}
        <section className="py-20 bg-gradient-hero">
          <div className="container mx-auto px-6 text-center">
            <div className="max-w-3xl mx-auto">
              <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
                Ready to Find Your MS Support Network?
              </h2>
              <p className="text-xl text-white/90 mb-8">
                Join 1,000+ members who've found friendship, support, and understanding in our community.
              </p>
              <Button 
                variant="secondary" 
                size="lg" 
                className="text-lg px-8 py-4 bg-white text-blue-600 hover:bg-gray-50 shadow-strong" 
                asChild
              >
                <Link to="/auth">
                  Join Free Today
                  <ArrowRight className="w-5 h-5 ml-2" />
                </Link>
              </Button>
              <p className="text-sm text-white/75 mt-4">
                100% free • No credit card required • Join in under 2 minutes
              </p>
            </div>
          </div>
        </section>
        
        {/* Launch Stats at bottom of page */}
        <section className="py-16 px-6 lg:px-8 bg-gray-50">
          <div className="container mx-auto">
            <LaunchStats />
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
};

export default Index;
