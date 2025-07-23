
import HeroContent from "./hero/HeroContent";
import ProfileDemo from "./hero/ProfileDemo";

const Hero = () => {
  return (
    <section className="relative min-h-screen flex items-center bg-gradient-subtle pt-32">
      <div className="container mx-auto px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          <HeroContent />
          <ProfileDemo />
        </div>
      </div>
    </section>
  );
};

export default Hero;
