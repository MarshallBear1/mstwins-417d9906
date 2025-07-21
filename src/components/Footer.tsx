import { Heart, Shield, Users, Mail } from "lucide-react";

const Footer = () => {
  return (
    <footer className="bg-foreground text-background py-16">
      <div className="container mx-auto px-6 lg:px-8">
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 mb-12">
          {/* Logo & Mission */}
          <div className="lg:col-span-2 space-y-4">
            <div className="flex items-center space-x-2">
              <div className="p-2 bg-gradient-primary rounded-lg">
                <Heart className="w-6 h-6 text-primary-foreground" fill="currentColor" />
              </div>
              <span className="text-xl font-bold">MSTwins</span>
            </div>
            <p className="text-background/80 leading-relaxed max-w-md">
              A safe, supportive community platform connecting individuals living with Multiple Sclerosis. 
              Building friendships, not dating relationships.
            </p>
            <div className="flex items-center space-x-2 text-sm text-background/60">
              <Shield className="w-4 h-4" />
              <span>Medical-grade privacy & security</span>
            </div>
          </div>

          {/* Community */}
          <div className="space-y-4">
            <h3 className="font-semibold text-lg flex items-center gap-2">
              <Users className="w-5 h-5" />
              Community
            </h3>
            <ul className="space-y-2 text-background/80">
              <li><a href="#" className="hover:text-background transition-colors">How It Works</a></li>
              <li><a href="#" className="hover:text-background transition-colors">Safety Guidelines</a></li>
              <li><a href="#" className="hover:text-background transition-colors">Community Standards</a></li>
              <li><a href="#" className="hover:text-background transition-colors">Success Stories</a></li>
            </ul>
          </div>

          {/* Support */}
          <div className="space-y-4">
            <h3 className="font-semibold text-lg flex items-center gap-2">
              <Mail className="w-5 h-5" />
              Support
            </h3>
            <ul className="space-y-2 text-background/80">
              <li><a href="#" className="hover:text-background transition-colors">Help Center</a></li>
              <li><a href="#" className="hover:text-background transition-colors">Contact Us</a></li>
              <li><a href="#" className="hover:text-background transition-colors">Privacy Policy</a></li>
              <li><a href="#" className="hover:text-background transition-colors">Terms of Service</a></li>
            </ul>
          </div>
        </div>

        {/* Bottom */}
        <div className="pt-8 border-t border-background/20">
          <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
            <p className="text-background/60 text-sm">
              © 2024 MSTwins. Supporting the MS community with care and understanding.
            </p>
            <p className="text-background/60 text-sm">
              Not a dating app • Community focused • MS support network
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;