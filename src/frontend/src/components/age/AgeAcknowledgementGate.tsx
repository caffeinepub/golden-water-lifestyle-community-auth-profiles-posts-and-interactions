import { useEffect, useState } from 'react';
import { useNavigate, useRouterState } from '@tanstack/react-router';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '../ui/dialog';
import { Button } from '../ui/button';
import { AlertTriangle } from 'lucide-react';
import { useCurrentUser } from '../../hooks/useCurrentUser';
import { hasAcknowledgedAge, setAgeAcknowledged, isAgeGatedRoute } from '../../utils/ageGate';

interface AgeAcknowledgementGateProps {
  children: React.ReactNode;
}

export default function AgeAcknowledgementGate({ children }: AgeAcknowledgementGateProps) {
  const { isAuthenticated, userProfile, profileLoading } = useCurrentUser();
  const navigate = useNavigate();
  const routerState = useRouterState();
  const currentPath = routerState.location.pathname;
  const [showGate, setShowGate] = useState(false);

  useEffect(() => {
    // Sync localStorage with user profile if profile has isAdult = true
    if (userProfile?.isAdult && !hasAcknowledgedAge()) {
      setAgeAcknowledged(true);
    }

    // Determine if we should show the gate
    const shouldShowGate =
      isAuthenticated &&
      !profileLoading &&
      isAgeGatedRoute(currentPath) &&
      !hasAcknowledgedAge();

    setShowGate(shouldShowGate);
  }, [isAuthenticated, profileLoading, currentPath, userProfile]);

  const handleConfirm = () => {
    setAgeAcknowledged(true);
    setShowGate(false);
  };

  const handleLeave = () => {
    navigate({ to: '/' });
  };

  return (
    <>
      {children}
      <Dialog open={showGate} onOpenChange={() => {}}>
        <DialogContent
          className="sm:max-w-md"
          onPointerDownOutside={(e) => e.preventDefault()}
          onEscapeKeyDown={(e) => e.preventDefault()}
        >
          <DialogHeader>
            <div className="flex items-center gap-3 mb-2">
              <AlertTriangle className="h-6 w-6 text-primary" />
              <DialogTitle>Adults Only - 18+ Community</DialogTitle>
            </div>
            <DialogDescription className="space-y-3 text-base">
              <p>
                Golden Water is an adults-only community for individuals 18 years of age or older.
              </p>
              <p>
                By continuing, you confirm that you are at least 18 years old and agree to our community guidelines.
              </p>
              <p className="text-sm text-muted-foreground">
                This community is intended for mature audiences only. All content and interactions must comply with our guidelines and applicable laws.
              </p>
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex-col sm:flex-row gap-2">
            <Button
              variant="outline"
              onClick={handleLeave}
              className="w-full sm:w-auto"
            >
              Leave
            </Button>
            <Button
              onClick={handleConfirm}
              className="w-full sm:w-auto"
              autoFocus
            >
              I am 18+ and Agree
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
