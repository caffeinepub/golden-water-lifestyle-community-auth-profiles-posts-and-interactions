import { Link } from '@tanstack/react-router';
import { X } from 'lucide-react';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetClose } from '../ui/sheet';
import LoginButton from '../Auth/LoginButton';
import { useCurrentUser } from '../../hooks/useCurrentUser';
import { useIsCallerAdmin } from '../../hooks/useQueries';

interface MobileNavProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function MobileNav({ isOpen, onClose }: MobileNavProps) {
  const { isAuthenticated } = useCurrentUser();
  const { data: isAdmin } = useIsCallerAdmin();

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent side="right" className="w-[280px] sm:w-[320px]">
        <SheetHeader>
          <SheetTitle>Menu</SheetTitle>
          <SheetClose className="absolute right-4 top-4">
            <X className="h-4 w-4" />
            <span className="sr-only">Close</span>
          </SheetClose>
        </SheetHeader>
        <nav className="flex flex-col gap-4 mt-8">
          <Link
            to="/"
            onClick={onClose}
            className="text-base font-medium hover:text-primary transition-colors py-2"
          >
            Home
          </Link>
          <Link
            to="/tips"
            onClick={onClose}
            className="text-base font-medium hover:text-primary transition-colors py-2"
          >
            Tips
          </Link>
          <Link
            to="/facts"
            onClick={onClose}
            className="text-base font-medium hover:text-primary transition-colors py-2"
          >
            Facts
          </Link>
          <Link
            to="/love-the-liquid"
            onClick={onClose}
            className="text-base font-medium hover:text-primary transition-colors py-2"
          >
            LOVE THE LIQUID
          </Link>
          {isAuthenticated && (
            <>
              <Link
                to="/feed"
                onClick={onClose}
                className="text-base font-medium hover:text-primary transition-colors py-2"
              >
                Feed
              </Link>
              <Link
                to="/profile"
                onClick={onClose}
                className="text-base font-medium hover:text-primary transition-colors py-2"
              >
                Profile
              </Link>
              {isAdmin && (
                <Link
                  to="/admin"
                  onClick={onClose}
                  className="text-base font-medium hover:text-primary transition-colors py-2"
                >
                  Admin
                </Link>
              )}
            </>
          )}
          <div className="pt-4 border-t">
            <LoginButton />
          </div>
        </nav>
      </SheetContent>
    </Sheet>
  );
}
