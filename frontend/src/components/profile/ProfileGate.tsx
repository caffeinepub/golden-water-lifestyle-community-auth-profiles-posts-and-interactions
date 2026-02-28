import { useState } from 'react';
import { useCurrentUser } from '../../hooks/useCurrentUser';
import { useSaveCallerUserProfile } from '../../hooks/useQueries';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '../ui/dialog';
import { Input } from '../ui/input';
import { Textarea } from '../ui/textarea';
import { Button } from '../ui/button';
import { Label } from '../ui/label';
import { Checkbox } from '../ui/checkbox';
import { Loader2, AlertTriangle } from 'lucide-react';

interface ProfileGateProps {
  children: React.ReactNode;
}

export default function ProfileGate({ children }: ProfileGateProps) {
  const { isAuthenticated, userProfile, profileLoading, isFetched } = useCurrentUser();
  const saveProfile = useSaveCallerUserProfile();
  const [username, setUsername] = useState('');
  const [bio, setBio] = useState('');
  const [isAdult, setIsAdult] = useState(false);

  const showProfileSetup = isAuthenticated && !profileLoading && isFetched && userProfile === null;

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !isAdult) return;

    try {
      await saveProfile.mutateAsync({
        username: username.trim(),
        bio: bio.trim(),
        preferences: '',
        isAdult: true,
      });
    } catch (error) {
      console.error('Failed to save profile:', error);
    }
  };

  return (
    <>
      {children}
      <Dialog open={showProfileSetup} onOpenChange={() => {}}>
        <DialogContent className="sm:max-w-md" onPointerDownOutside={(e) => e.preventDefault()}>
          <DialogHeader>
            <DialogTitle>Welcome to Golden Water</DialogTitle>
            <DialogDescription>
              Let's set up your profile to get started in the community.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSaveProfile} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="username">Display Name *</Label>
              <Input
                id="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Your name"
                required
                maxLength={50}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="bio">Bio</Label>
              <Textarea
                id="bio"
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                placeholder="Tell us about yourself..."
                rows={3}
                maxLength={200}
              />
            </div>
            <div className="space-y-3 pt-2 border-t">
              <div className="flex items-start gap-3 p-3 bg-muted/50 rounded-lg">
                <AlertTriangle className="h-5 w-5 text-primary mt-0.5 shrink-0" />
                <div className="space-y-2 flex-1">
                  <p className="text-sm font-medium">Adults Only Community</p>
                  <p className="text-xs text-muted-foreground">
                    Golden Water is an 18+ community. You must be at least 18 years old to participate.
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Checkbox
                  id="age-confirm"
                  checked={isAdult}
                  onCheckedChange={(checked) => setIsAdult(checked === true)}
                  required
                />
                <Label
                  htmlFor="age-confirm"
                  className="text-sm font-normal leading-relaxed cursor-pointer"
                >
                  I confirm that I am 18 years of age or older and agree to the community guidelines *
                </Label>
              </div>
            </div>
            <Button
              type="submit"
              className="w-full"
              disabled={saveProfile.isPending || !username.trim() || !isAdult}
            >
              {saveProfile.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating Profile...
                </>
              ) : (
                'Complete Profile'
              )}
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
