
import { lazy, Suspense, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Header from "@/components/Header";
import OptimizedHero from "@/components/OptimizedHero";
import CriticalCSS from "@/components/CriticalCSS";
import SEO from "@/components/SEO";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
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
  const navigate = useNavigate();

  // Check for password reset parameters and redirect to auth page
  useEffect(() => {
    const checkForPasswordReset = () => {
      const hashParams = new URLSearchParams(window.location.hash.substring(1));
      const urlParams = new URLSearchParams(window.location.search);
      
      const type = urlParams.get('type') || hashParams.get('type');
      const accessToken = urlParams.get('access_token') || hashParams.get('access_token');
      const refreshToken = urlParams.get('refresh_token') || hashParams.get('refresh_token');
      const code = urlParams.get('code') || hashParams.get('code');
      
      console.log('🔍 Landing page password reset check:', {
        url: window.location.href,
        hash: window.location.hash,
        search: window.location.search,
        type,
        hasAccessToken: !!accessToken,
        hasRefreshToken: !!refreshToken,
        hasCode: !!code,
        hashParams: Object.fromEntries(hashParams.entries()),
        urlParams: Object.fromEntries(urlParams.entries())
      });

      // Simplified condition for password reset detection
      if (type === 'recovery') {
        console.log('🔑 Password reset detected on landing page, redirecting to auth...');
        
        // Preserve all parameters when redirecting to auth
        const currentHash = window.location.hash;
        const currentSearch = window.location.search;
        
        if (currentHash) {
          // If parameters are in hash, redirect with hash preserved
          console.log('📍 Redirecting with hash:', `/auth${currentSearch}${currentHash}`);
          navigate(`/auth${currentSearch}${currentHash}`, { replace: true });
        } else if (currentSearch) {
          // If parameters are in search, redirect with search preserved  
          console.log('📍 Redirecting with search:', `/auth${currentSearch}`);
          navigate(`/auth${currentSearch}`, { replace: true });
        } else {
          // Fallback redirect
          console.log('📍 Fallback redirect to:', '/auth?type=recovery');
          navigate('/auth?type=recovery', { replace: true });
        }
        return;
      } else {
        console.log('ℹ️ No password reset detected - normal landing page load');
      }
    };

    // Add a small delay to ensure DOM is ready
    const timeoutId = setTimeout(checkForPasswordReset, 100);
    
    return () => clearTimeout(timeoutId);
  }, [navigate]);

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
      </main>
      <Suspense fallback={<LoadingSpinner />}>
        <FooterLazy />
      </Suspense>
    </div>
  );
};

export default OptimizedIndex;
