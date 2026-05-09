import { Link, useLocation } from "react-router-dom";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Home, ArrowLeft } from "lucide-react";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);
  return (
    <div className="min-h-screen bg-background relative flex items-center justify-center p-4 overflow-hidden">
      {/* Premium Background System */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-[10%] -left-[10%] w-[70%] h-[70%] bg-indigo-500/15 dark:bg-indigo-600/10 blur-[120px] rounded-full animate-aurora mix-blend-screen overflow-hidden" />
        <div className="absolute top-[10%] -right-[5%] w-[60%] h-[60%] bg-purple-500/15 dark:bg-purple-600/10 blur-[130px] rounded-full animate-float mix-blend-screen overflow-hidden" />
        <div className="absolute inset-0 opacity-[0.4] dark:opacity-[0.6] bg-grid-slate-800 dark:bg-grid-white bg-[size:32px_32px]" />
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-[0.03] dark:opacity-[0.08] mix-blend-overlay" />
      </div>

      <div className="relative z-10 text-center max-w-md">
        {/* 404 Text */}
        <div className="relative mb-8">
          <span className="text-[120px] md:text-[180px] font-display font-bold text-gradient leading-none">
            404
          </span>
          <div className="absolute inset-0 gradient-primary opacity-20 blur-3xl" />
        </div>

        <h1 className="text-2xl md:text-3xl font-display font-bold text-foreground mb-4">
          Page Not Found
        </h1>
        <p className="text-muted-foreground mb-8">
          Oops! The page you're looking for doesn't exist or has been moved.
          Let's get you back on track.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link to="/">
            <Button variant="gradient" size="lg">
              <Home className="w-5 h-5" />
              Go Home
            </Button>
          </Link>
          <Button variant="outline" size="lg" onClick={() => window.history.back()}>
            <ArrowLeft className="w-5 h-5" />
            Go Back
          </Button>
        </div>

        <div className="mt-12 pt-8 border-t border-border">
          <p className="text-sm text-muted-foreground mb-4">
            Looking for something specific?
          </p>
          <div className="flex items-center gap-4 justify-center">
            <Link to="/notes" className="text-sm text-primary hover:underline">
              Notes
            </Link>
            <span className="text-border">•</span>
            <Link to="/events" className="text-sm text-primary hover:underline">
              Events
            </Link>
            <span className="text-border">•</span>
            <Link to="/opportunities" className="text-sm text-primary hover:underline">
              Opportunities
            </Link>
            <span className="text-border">•</span>
            <Link to="/dashboard" className="text-sm text-primary hover:underline">
              Dashboard
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NotFound;
