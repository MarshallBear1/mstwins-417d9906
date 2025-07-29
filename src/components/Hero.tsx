
import HeroContent from "./hero/HeroContent";
import ProfileDemo from "./hero/ProfileDemo";

const Hero = () => {
  return (
    <section className="relative min-h-screen flex items-center bg-gray-50 pt-20 overflow-hidden">
      {/* Clean background elements - Optimized for modern design */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-blue-400/8 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-purple-400/8 rounded-full blur-3xl" />
      </div>
      
      <div className="container mx-auto px-6 lg:px-8 relative z-10">
        {/* Mobile and tablet: stacked layout */}
        <div className="lg:hidden grid gap-12 items-center">
          <HeroContent />
          <ProfileDemo />
        </div>
        
        {/* Desktop: centered layout */}
        <div className="hidden lg:flex lg:flex-col lg:items-center lg:space-y-16">
          {/* Centered main content */}
          <div className="w-full max-w-5xl">
            <HeroContent />
          </div>
          
          {/* Centered profile demo below */}
          <div className="w-full max-w-md">
            <ProfileDemo />
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;

