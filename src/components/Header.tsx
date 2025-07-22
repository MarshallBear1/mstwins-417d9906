import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import FeedbackDialog from "@/components/FeedbackDialog";

const Header = () => {
  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-md border-b border-border">
      <div className="container mx-auto px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex items-center space-x-2">
            <div className="w-12 h-12 rounded-lg overflow-hidden bg-white border border-gray-200 p-1 shadow-sm">
              <img 
                src="/lovable-uploads/2293d200-728d-46fb-a007-7994ca0a639c.png" 
                alt="MSTwins mascot"
                className="w-full h-full object-contain"
              />
            </div>
            <span className="text-xl font-bold">
              <span className="text-black">MS</span><span className="text-blue-600">Twins</span>
            </span>
          </div>

          {/* Navigation */}
          <nav className="hidden md:flex items-center space-x-8">
            <a href="#how-it-works" className="text-muted-foreground hover:text-foreground transition-colors">
              How It Works
            </a>
            <a href="#testimonials" className="text-muted-foreground hover:text-foreground transition-colors">
              Stories
            </a>
          </nav>

          {/* CTA Buttons */}
          <div className="flex items-center space-x-4">
            <FeedbackDialog />
            <Button variant="ghost" className="hidden sm:inline-flex" asChild>
              <Link to="/auth">Sign In</Link>
            </Button>
            <Button className="bg-blue-600 hover:bg-blue-700 text-white" asChild>
              <Link to="/auth">Get Started</Link>
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;