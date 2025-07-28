
import { lazy, Suspense } from "react";
import Header from "@/components/Header";
import OptimizedHero from "@/components/OptimizedHero";
import CriticalCSS from "@/components/CriticalCSS";
import SEO from "@/components/SEO";
import { Button } from "@/components/ui/button";
import { ArrowRight, Mail, MessageCircle, Users } from "lucide-react";
import { Link } from "react-router-dom";

// Lazy load below-the-fold components
const OptimizedHowItWorksLazy = lazy(() => import("@/components/OptimizedHowItWorks"));

const TrustSignalsLazy = lazy(() => import("@/components/TrustSignals"));
const SocialProofLazy = lazy(() => import("@/components/SocialProof"));
const FooterLazy = lazy(() => import("@/components/Footer"));
const LaunchStatsLazy = lazy(() => import("@/components/LaunchStats"));

const LoadingSpinner = () => (
  <div className="flex items-center justify-center py-12">
    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
  </div>
);

const OptimizedIndex = () => {
  return (
    <div className="min-h-screen mobile-safe-bottom">
      <SEO
        title="MSTwins - Multiple Sclerosis Support Community | Connect with Others Living with MS"
        description="Join MSTwins, the supportive community for people living with Multiple Sclerosis. Connect, share experiences, and find friendship with others who understand your MS journey."
        canonical="https://mstwins.com/"
      />
      <CriticalCSS />
      <Header />
      <main id="main-content" data-main-content className="ios-scroll">
        <OptimizedHero />
        <div id="how-it-works">
          <Suspense fallback={<LoadingSpinner />}>
            <OptimizedHowItWorksLazy />
          </Suspense>
        </div>
        <Suspense fallback={<LoadingSpinner />}>
          <TrustSignalsLazy />
        </Suspense>
        <div id="testimonials">
          <Suspense fallback={<LoadingSpinner />}>
            <SocialProofLazy />
          </Suspense>
        </div>
        
        {/* Final CTA Section */}
        <section className="py-12 bg-background mobile-safe-bottom">
          <div className="container mx-auto mobile-safe-x text-center">
            <div className="max-w-3xl mx-auto">
              <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-6">
                Ready to Find Your MS Support Network?
              </h2>
              <p className="text-xl text-muted-foreground mb-8">
                Join 500+ members who've found friendship, support, and understanding in our community.
              </p>
              <Button 
                variant="secondary" 
                size="lg" 
                className="text-lg px-8 py-4 bg-blue-600 text-white hover:bg-blue-700 shadow-strong"
                asChild
              >
                <Link to="/auth">
                  Join Free Today
                  <ArrowRight className="w-5 h-5 ml-2" />
                </Link>
              </Button>
              <p className="text-sm text-muted-foreground mt-4">
                100% free • No credit card required • Join in under 2 minutes
              </p>
            </div>
          </div>
        </section>

        {/* Contact Section */}
        <section id="contact" className="py-16 bg-muted/50">
          <div className="container mx-auto mobile-safe-x">
            <div className="max-w-4xl mx-auto text-center">
              <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-6">
                Get in Touch
              </h2>
              <p className="text-lg text-muted-foreground mb-8">
                Have questions about MSTwins? We're here to help connect and support our MS community.
              </p>
              
              <div className="grid md:grid-cols-3 gap-6 mb-8">
                <div className="bg-white rounded-lg p-6 shadow-sm border">
                  <Mail className="w-8 h-8 text-primary mx-auto mb-4" />
                  <h3 className="font-semibold mb-2">Email Us</h3>
                  <a 
                    href="mailto:team@sharedgenes.org" 
                    className="text-primary hover:underline"
                  >
                    team@sharedgenes.org
                  </a>
                </div>
                
                <div className="bg-white rounded-lg p-6 shadow-sm border">
                  <Users className="w-8 h-8 text-primary mx-auto mb-4" />
                  <h3 className="font-semibold mb-2">Community Support</h3>
                  <p className="text-sm text-muted-foreground">
                    Questions about profiles, matches, or features
                  </p>
                </div>
                
                <div className="bg-white rounded-lg p-6 shadow-sm border">
                  <MessageCircle className="w-8 h-8 text-primary mx-auto mb-4" />
                  <h3 className="font-semibold mb-2">Response Time</h3>
                  <p className="text-sm text-muted-foreground">
                    We typically respond within 24-48 hours
                  </p>
                </div>
              </div>
              
              <Button 
                onClick={() => window.location.href = 'mailto:team@sharedgenes.org?subject=MSTwins Contact'} 
                variant="outline"
                size="lg"
                className="text-lg px-8 py-4"
              >
                <Mail className="w-5 h-5 mr-2" />
                Send us an Email
              </Button>
            </div>
          </div>
        </section>
      </main>
      <Suspense fallback={<LoadingSpinner />}>
        <FooterLazy />
      </Suspense>
    </div>
  );
};

export default OptimizedIndex;
