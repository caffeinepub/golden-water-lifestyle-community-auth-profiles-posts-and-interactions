import { Shield, AlertTriangle } from 'lucide-react';
import { useCurrentUser } from '../hooks/useCurrentUser';
import { useIsCallerAdmin } from '../hooks/useQueries';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { LoadingSkeleton } from '../components/state/QueryState';
import ReportedPostsPanel from '../components/admin/ReportedPostsPanel';
import ReportedCommentsPanel from '../components/admin/ReportedCommentsPanel';
import FlaggedPostsPanel from '../components/admin/FlaggedPostsPanel';

export default function AdminPanelPage() {
  const { isAuthenticated } = useCurrentUser();
  const { data: isAdmin, isLoading: adminCheckLoading } = useIsCallerAdmin();

  // Show loading state while checking authentication and admin status
  if (adminCheckLoading) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        <LoadingSkeleton />
      </div>
    );
  }

  // Not authenticated
  if (!isAuthenticated) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-2xl">
        <Card className="border-destructive/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-destructive" />
              Sign In Required
            </CardTitle>
            <CardDescription>
              You must be signed in to access the admin panel.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  // Not an admin
  if (!isAdmin) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-2xl">
        <Card className="border-destructive/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-destructive" />
              Access Denied
            </CardTitle>
            <CardDescription>
              You do not have permission to access the admin panel. Only administrators can view this page.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  // Admin panel content
  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <Shield className="h-8 w-8 text-primary" />
          <h1 className="text-3xl font-bold">Admin Panel</h1>
        </div>
        <p className="text-muted-foreground">
          Review and moderate reported and flagged content
        </p>
      </div>

      <Tabs defaultValue="reported-posts" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3 max-w-2xl">
          <TabsTrigger value="reported-posts">Reported Posts</TabsTrigger>
          <TabsTrigger value="reported-comments">Reported Comments</TabsTrigger>
          <TabsTrigger value="flagged-posts">Flagged Posts</TabsTrigger>
        </TabsList>

        <TabsContent value="reported-posts" className="space-y-4">
          <ReportedPostsPanel />
        </TabsContent>

        <TabsContent value="reported-comments" className="space-y-4">
          <ReportedCommentsPanel />
        </TabsContent>

        <TabsContent value="flagged-posts" className="space-y-4">
          <FlaggedPostsPanel />
        </TabsContent>
      </Tabs>
    </div>
  );
}
