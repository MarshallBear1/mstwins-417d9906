
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
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-center">
          <HeroContent />
          <ProfileDemo />
        </div>
      </div>
    </section>
  );
};

export default Hero;
