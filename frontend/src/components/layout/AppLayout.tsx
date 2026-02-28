import { Link } from '@tanstack/react-router';
import { Droplets, Menu } from 'lucide-react';
import { SiCaffeine } from 'react-icons/si';
import LoginButton from '../Auth/LoginButton';
import ProfileGate from '../profile/ProfileGate';
import AgeAcknowledgementGate from '../age/AgeAcknowledgementGate';
import { useCurrentUser } from '../../hooks/useCurrentUser';
import { useIsCallerAdmin } from '../../hooks/useQueries';
import { useState, useEffect } from 'react';
import MobileNav from './MobileNav';
import { Button } from '../ui/button';
import { perfMark, perfMeasure } from '../../utils/perf';

interface AppLayoutProps {
  children: React.ReactNode;
}

export default function AppLayout({ children }: AppLayoutProps) {
  const { isAuthenticated } = useCurrentUser();
  const { data: isAdmin } = useIsCallerAdmin();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Performance instrumentation
  useEffect(() => {
    perfMark('app-layout-mount');
    return () => {
      perfMeasure('app-layout-mount', 'AppLayout: Initial mount');
    };
  }, []);

  return (
    <ProfileGate>
      <AgeAcknowledgementGate>
        <div className="min-h-screen flex flex-col">
          <header className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-40">
            <div className="container mx-auto px-4 py-3 sm:py-4">
              <div className="flex items-center justify-between gap-4">
                <Link to="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
                  <Droplets className="h-6 w-6 sm:h-8 sm:w-8 text-primary" />
                  <span className="text-lg sm:text-xl font-bold">Golden Water</span>
                </Link>

                {/* Desktop Navigation */}
                <nav className="hidden md:flex items-center gap-4">
                  <Link
                    to="/"
                    className="text-sm font-medium hover:text-primary transition-colors"
                  >
                    Home
                  </Link>
                  <Link
                    to="/tips"
                    className="text-sm font-medium hover:text-primary transition-colors"
                  >
                    Tips
                  </Link>
                  <Link
                    to="/facts"
                    className="text-sm font-medium hover:text-primary transition-colors"
                  >
                    Facts
                  </Link>
                  <Link
                    to="/gold-water-tracker"
                    className="text-sm font-medium hover:text-primary transition-colors"
                  >
                    Gold Water Tracker
                  </Link>
                  <Link
                    to="/love-the-liquid"
                    className="text-sm font-medium hover:text-primary transition-colors"
                  >
                    LOVE THE LIQUID
                  </Link>
                  {isAuthenticated && (
                    <>
                      <Link
                        to="/feed"
                        className="text-sm font-medium hover:text-primary transition-colors"
                      >
                        Feed
                      </Link>
                      <Link
                        to="/profile"
                        className="text-sm font-medium hover:text-primary transition-colors"
                      >
                        Profile
                      </Link>
                      {isAdmin && (
                        <Link
                          to="/admin"
                          className="text-sm font-medium hover:text-primary transition-colors"
                        >
                          Admin
                        </Link>
                      )}
                    </>
                  )}
                  <LoginButton />
                </nav>

                {/* Mobile Menu Button */}
                <div className="flex md:hidden items-center gap-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setMobileMenuOpen(true)}
                    aria-label="Open menu"
                  >
                    <Menu className="h-5 w-5" />
                  </Button>
                </div>
              </div>
            </div>
          </header>

          {/* Mobile Navigation */}
          <MobileNav isOpen={mobileMenuOpen} onClose={() => setMobileMenuOpen(false)} />

          <main className="flex-1">
            {children}
          </main>

          <footer className="border-t bg-card/30 mt-auto">
            <div className="container mx-auto px-4 py-6 sm:py-8">
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-muted-foreground">
                <div className="flex items-center gap-2">
                  <span className="text-destructive font-semibold">18+ Adults Only</span>
                  <span className="hidden sm:inline">•</span>
                  <span className="text-center sm:text-left">
                    By using this service you confirm you are 18+ and agree to reject any illegal activity.
                  </span>
                </div>
                <div className="flex items-center gap-1 text-xs sm:text-sm">
                  <span>© {new Date().getFullYear()}. Built with</span>
                  <span className="text-red-500">♥</span>
                  <span>using</span>
                  <a
                    href={`https://caffeine.ai/?utm_source=Caffeine-footer&utm_medium=referral&utm_content=${encodeURIComponent(window.location.hostname)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 hover:text-primary transition-colors font-medium"
                  >
                    <SiCaffeine className="h-3 w-3" />
                    caffeine.ai
                  </a>
                </div>
              </div>
            </div>
          </footer>
        </div>
      </AgeAcknowledgementGate>
    </ProfileGate>
  );
}
