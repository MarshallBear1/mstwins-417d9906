import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import FeedbackDialog from "@/components/FeedbackDialog";
import { Users, Menu, X, Heart } from "lucide-react";
import { useState } from "react";
import { useMobileOptimizations } from "@/hooks/useMobileOptimizations";
const Header = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { isMobile, safeAreaInsets } = useMobileOptimizations();
  return (
    <>
      {/* Skip Navigation Link for Accessibility */}
      <a 
        href="#main-content" 
        className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 z-[60] bg-primary text-primary-foreground px-4 py-2 rounded-md font-medium"
        data-skip-link
      >
        Skip to main content
      </a>
      <header 
        className="fixed top-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-md border-b border-gray-200 shadow-sm"
        style={{ paddingTop: isMobile ? `max(0.5rem, ${safeAreaInsets.top}px)` : undefined }}
      >
      <div className="container mx-auto mobile-safe-x lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex items-center space-x-2">
            <div className="w-12 h-12 rounded-lg overflow-hidden bg-white border border-gray-200 p-1 shadow-sm">
              <img src="/lovable-uploads/2293d200-728d-46fb-a007-7994ca0a639c.png" alt="MSTwins mascot" className="w-full h-full object-contain" />
            </div>
            <span className="text-xl font-bold">
              <span className="text-black">MS</span><span className="text-blue-600">Twins</span>
            </span>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-8">
            <a href="#how-it-works" className="text-gray-700 hover:text-blue-600 transition-colors font-medium">
              How It Works
            </a>
            <a href="#testimonials" className="text-gray-700 hover:text-blue-600 transition-colors font-medium">
              Success Stories
            </a>
          </nav>

          {/* Desktop CTA Buttons */}
          <div className="hidden md:flex items-center space-x-4">
            <FeedbackDialog />
            <Button variant="ghost" className="text-gray-700 hover:text-blue-600" asChild>
              <Link to="/auth">Sign In</Link>
            </Button>
            <Button className="bg-blue-600 hover:bg-blue-700 text-white shadow-medium hover:shadow-strong transition-all" asChild>
              <Link to="/auth">Join Free</Link>
            </Button>
          </div>

          {/* Mobile Menu Button */}
          <button 
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)} 
            className="md:hidden p-3 text-gray-700 hover:text-blue-600 transition-colors mobile-touch-target mobile-focus"
            aria-label={mobileMenuOpen ? "Close menu" : "Open menu"}
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && <div className="md:hidden py-4 border-t border-gray-200 bg-white mobile-safe-x">
            <div className="flex flex-col space-y-4">
              <a href="#how-it-works" className="text-gray-700 hover:text-blue-600 transition-colors font-medium" onClick={() => setMobileMenuOpen(false)}>
                How It Works
              </a>
              <a href="#testimonials" className="text-gray-700 hover:text-blue-600 transition-colors font-medium" onClick={() => setMobileMenuOpen(false)}>
                Success Stories
              </a>
              <div className="flex flex-col space-y-2 text-sm text-gray-600">
                <div className="flex items-center space-x-2">
                  <Users className="w-4 h-4" />
                  <span>500+ members</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Heart className="w-4 h-4" />
                  <span>1,000 matches made</span>
                </div>
              </div>
              <div className="flex flex-col space-y-3 pt-2">
                <Button variant="ghost" size={isMobile ? "mobile" : "default"} className="justify-start text-gray-700 hover:text-blue-600" asChild>
                  <Link to="/auth">Sign In</Link>
                </Button>
                <Button size={isMobile ? "mobile" : "default"} className="bg-blue-600 hover:bg-blue-700 text-white" asChild>
                  <Link to="/auth">Join Free</Link>
                </Button>
              </div>
            </div>
          </div>}
      </div>
    </header>
    </>
  );
};

export default Header;