import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Textarea } from '../components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Label } from '../components/ui/label';
import { Loader2, Save, Shield, ShieldCheck } from 'lucide-react';
import { useCurrentUser } from '../hooks/useCurrentUser';
import { useGetCallerUserProfile, useSaveCallerUserProfile, useIsCallerAdmin } from '../hooks/useQueries';
import { LoadingSkeleton, ErrorState } from '../components/state/QueryState';
import { Alert, AlertDescription } from '../components/ui/alert';
import { Separator } from '../components/ui/separator';

export default function ProfilePage() {
  const navigate = useNavigate();
  const { isAuthenticated } = useCurrentUser();
  const { data: profile, isLoading, error } = useGetCallerUserProfile();
  const { data: isAdmin, isLoading: isAdminLoading } = useIsCallerAdmin();
  const saveProfile = useSaveCallerUserProfile();
  const [username, setUsername] = useState('');
  const [bio, setBio] = useState('');
  const [preferences, setPreferences] = useState('');
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);

  useEffect(() => {
    if (profile) {
      setUsername(profile.username);
      setBio(profile.bio);
      setPreferences(profile.preferences);
    }
  }, [profile]);

  const handleSave = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim()) return;

    setSaveError(null);
    setSaveSuccess(false);

    try {
      await saveProfile.mutateAsync({
        username: username.trim(),
        bio: bio.trim(),
        preferences: preferences.trim(),
        isAdult: profile?.isAdult ?? true,
      });
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (error: any) {
      console.error('Failed to save profile:', error);
      setSaveError(error.message || 'Failed to save profile. Please try again.');
    }
  }, [username, bio, preferences, profile, saveProfile]);

  if (!isAuthenticated) {
    return (
      <div className="container mx-auto px-4 py-12 max-w-2xl">
        <Alert>
          <AlertDescription className="text-center">
            Please sign in to view and edit your profile.
          </AlertDescription>
        </Alert>
        <div className="mt-6 text-center">
          <Button onClick={() => navigate({ to: '/' })}>
            Go to Home
          </Button>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-6 sm:py-8 max-w-2xl">
        <LoadingSkeleton count={1} />
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-6 sm:py-8 max-w-2xl">
        <ErrorState message="Failed to load profile. Please try again." />
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-6 sm:py-8 max-w-2xl space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Your Profile</CardTitle>
          <CardDescription>
            Update your profile information and preferences
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSave} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="username">Username</Label>
              <Input
                id="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Enter your username"
                maxLength={50}
                disabled={saveProfile.isPending}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="bio">Bio</Label>
              <Textarea
                id="bio"
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                placeholder="Tell us about yourself..."
                rows={4}
                maxLength={500}
                className="resize-none"
                disabled={saveProfile.isPending}
              />
              <p className="text-xs text-muted-foreground">
                {bio.length}/500 characters
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="preferences">Preferences</Label>
              <Textarea
                id="preferences"
                value={preferences}
                onChange={(e) => setPreferences(e.target.value)}
                placeholder="Share your interests and preferences..."
                rows={3}
                maxLength={300}
                className="resize-none"
                disabled={saveProfile.isPending}
              />
              <p className="text-xs text-muted-foreground">
                {preferences.length}/300 characters
              </p>
            </div>

            {saveError && (
              <Alert variant="destructive">
                <AlertDescription>{saveError}</AlertDescription>
              </Alert>
            )}

            {saveSuccess && (
              <Alert className="border-green-600 bg-green-50 dark:bg-green-950/20">
                <AlertDescription className="text-green-800 dark:text-green-200">
                  Profile updated successfully!
                </AlertDescription>
              </Alert>
            )}

            <Button
              type="submit"
              disabled={!username.trim() || saveProfile.isPending}
              className="w-full sm:w-auto"
            >
              {saveProfile.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  Save Profile
                </>
              )}
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Admin Status
          </CardTitle>
          <CardDescription>
            View your administrative privileges
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isAdminLoading ? (
            <div className="flex items-center gap-2 text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>Checking admin status...</span>
            </div>
          ) : isAdmin ? (
            <div className="flex items-center gap-3 p-4 rounded-lg bg-primary/10 border border-primary/20">
              <ShieldCheck className="h-6 w-6 text-primary" />
              <div>
                <p className="font-medium text-primary">You are an administrator</p>
                <p className="text-sm text-muted-foreground">
                  You can delete any post or comment in the community
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground">
                You are not currently an administrator.
              </p>
              <Alert>
                <AlertDescription>
                  Admin privileges are managed by the system. Contact support if you need administrative access.
                </AlertDescription>
              </Alert>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
