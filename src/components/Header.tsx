import { Button } from "@/components/ui/button";
import { Heart } from "lucide-react";

const Header = () => {
  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-md border-b border-border">
      <div className="container mx-auto px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex items-center space-x-2">
            <div className="p-2 bg-gradient-primary rounded-lg">
              <Heart className="w-6 h-6 text-primary-foreground" fill="currentColor" />
            </div>
            <span className="text-xl font-bold text-foreground">MSTwins</span>
          </div>

          {/* Navigation */}
          <nav className="hidden md:flex items-center space-x-8">
            <a href="#features" className="text-muted-foreground hover:text-foreground transition-colors">
              Features
            </a>
            <a href="#testimonials" className="text-muted-foreground hover:text-foreground transition-colors">
              Stories
            </a>
            <a href="#about" className="text-muted-foreground hover:text-foreground transition-colors">
              About
            </a>
          </nav>

          {/* CTA Buttons */}
          <div className="flex items-center space-x-4">
            <Button variant="ghost" className="hidden sm:inline-flex" asChild>
              <a href="/auth">Sign In</a>
            </Button>
            <Button className="bg-blue-600 hover:bg-blue-700 text-white" asChild>
              <a href="/auth">Get Started</a>
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;