
import HeroContent from "./hero/HeroContent";
import MSMatchingDemo from "./hero/MSMatchingDemo";

const OptimizedHero = () => {
  return (
    <section className="relative min-h-screen flex items-center bg-gradient-subtle pt-32 mobile-safe-top mobile-safe-bottom">
      <div className="container mx-auto mobile-safe-x lg:px-8">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          <HeroContent />
          <MSMatchingDemo />
        </div>
      </div>
    </section>
  );
};

export default OptimizedHero;
