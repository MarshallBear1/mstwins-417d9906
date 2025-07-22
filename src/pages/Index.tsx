import Header from "@/components/Header";
import Hero from "@/components/Hero";
import HowItWorks from "@/components/HowItWorks";
import MatchingAnimation from "@/components/MatchingAnimation";
import Testimonials from "@/components/Testimonials";
import Footer from "@/components/Footer";
import LaunchStats from "@/components/LaunchStats";

const Index = () => {
  return (
    <div className="min-h-screen">
      <Header />
      <main>
        <Hero />
        <div id="how-it-works">
          <HowItWorks />
        </div>
        <MatchingAnimation />
        <div id="testimonials">
          <Testimonials />
        </div>
        
        {/* Launch Stats at bottom of page */}
        <section className="py-16 px-6 lg:px-8">
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
