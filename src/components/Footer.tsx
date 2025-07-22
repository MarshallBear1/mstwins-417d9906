import { Heart, Shield, Users, Mail } from "lucide-react";
import { Link } from "react-router-dom";

const Footer = () => {
  return (
    <footer className="bg-foreground text-background py-16">
      <div className="container mx-auto px-6 lg:px-8">
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 mb-12">
          {/* Logo & Mission */}
          <div className="lg:col-span-2 space-y-4">
            <div className="flex items-center space-x-2">
              <div className="w-12 h-12 rounded-lg overflow-hidden bg-white border border-gray-200 p-1 shadow-sm">
                <img 
                  src="/lovable-uploads/2293d200-728d-46fb-a007-7994ca0a639c.png" 
                  alt="MSTwins mascot"
                  className="w-full h-full object-contain"
                />
              </div>
              <span className="text-xl font-bold">
                MS<span className="text-blue-400">Twins</span>
              </span>
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
              <li><a href="#about" className="hover:text-background transition-colors">How It Works</a></li>
              <li><a href="#features" className="hover:text-background transition-colors">Features</a></li>
              <li><a href="#testimonials" className="hover:text-background transition-colors">Success Stories</a></li>
              <li><Link to="/auth" className="hover:text-background transition-colors">Join Community</Link></li>
            </ul>
          </div>

          {/* Support */}
          <div className="space-y-4">
            <h3 className="font-semibold text-lg flex items-center gap-2">
              <Mail className="w-5 h-5" />
              Support
            </h3>
            <ul className="space-y-2 text-background/80">
              <li>
                <a 
                  href="mailto:team@sharedgenes.org" 
                  className="hover:text-background transition-colors"
                >
                  Contact Us
                </a>
              </li>
              <li><Link to="/privacy-policy" className="hover:text-background transition-colors">Privacy Policy</Link></li>
              <li><Link to="/terms-of-service" className="hover:text-background transition-colors">Terms of Service</Link></li>
              <li>
                <a 
                  href="mailto:team@sharedgenes.org?subject=Help%20Request" 
                  className="hover:text-background transition-colors"
                >
                  Help Center
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom */}
        <div className="pt-8 border-t border-background/20">
          <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
            <div className="text-center md:text-left">
              <p className="text-background/60 text-sm">
                © 2025 MSTwins. Supporting the MS community with care and understanding.
              </p>
              <p className="text-background/60 text-xs mt-1">
                Contact us: <a href="mailto:team@sharedgenes.org" className="hover:text-background transition-colors">team@sharedgenes.org</a>
              </p>
            </div>
            <p className="text-background/60 text-sm text-center md:text-right">
              Not a dating app • Community focused • MS support network
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;