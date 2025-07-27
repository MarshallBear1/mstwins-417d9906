
import HeroContent from "./hero/HeroContent";
import MSMatchingDemo from "./hero/MSMatchingDemo";

const OptimizedHero = () => {
  return (
    <section className="relative min-h-screen flex flex-col bg-gradient-subtle pt-28 sm:pt-32 lg:pt-36 mobile-safe-top mobile-safe-bottom">
      <div className="container mx-auto mobile-safe-x lg:px-8">
        {/* Empty spacer to push content down */}
        <div className="h-16 sm:h-20 lg:h-24"></div>
        
        {/* Hero Content First */}
        <div className="text-center mb-8 lg:mb-12">
          <HeroContent />
        </div>
        
        {/* Profile Demo Below */}
        <div className="flex justify-center">
          <MSMatchingDemo />
        </div>
      </div>
    </section>
  );
};

export default OptimizedHero;
