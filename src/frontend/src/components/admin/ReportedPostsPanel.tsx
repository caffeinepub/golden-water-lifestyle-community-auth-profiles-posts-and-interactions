import { AlertCircle, CheckCircle, Trash2 } from 'lucide-react';
import { useGetReportedPostsAdminView, useClearPostReports, useDeletePost } from '../../hooks/useQueries';
import { LoadingSkeleton, ErrorState, EmptyState } from '../state/QueryState';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Separator } from '../ui/separator';
import AuthorName from './AuthorName';
import { useState } from 'react';
import { toast } from 'sonner';

export default function ReportedPostsPanel() {
  const { data: reportedPosts, isLoading, error } = useGetReportedPostsAdminView();
  const clearReportsMutation = useClearPostReports();
  const deletePostMutation = useDeletePost();
  const [processingId, setProcessingId] = useState<bigint | null>(null);

  const handleClearReports = async (postId: bigint) => {
    setProcessingId(postId);
    try {
      await clearReportsMutation.mutateAsync(postId);
      toast.success('Reports cleared successfully');
    } catch (error: any) {
      toast.error(error?.message || 'Failed to clear reports');
    } finally {
      setProcessingId(null);
    }
  };

  const handleDeletePost = async (postId: bigint) => {
    if (!confirm('Are you sure you want to delete this post? This action cannot be undone.')) {
      return;
    }
    setProcessingId(postId);
    try {
      await deletePostMutation.mutateAsync(postId);
      toast.success('Post deleted successfully');
    } catch (error: any) {
      toast.error(error?.message || 'Failed to delete post');
    } finally {
      setProcessingId(null);
    }
  };

  if (isLoading) {
    return <LoadingSkeleton />;
  }

  if (error) {
    return <ErrorState message="Failed to load reported posts" />;
  }

  if (!reportedPosts || reportedPosts.length === 0) {
    return (
      <EmptyState
        icon={CheckCircle}
        message="No reported posts. All posts are clear. Great job keeping the community safe!"
      />
    );
  }

  return (
    <div className="space-y-4">
      {reportedPosts.map((post) => (
        <Card key={post.id.toString()} className="border-amber-200 dark:border-amber-900">
          <CardHeader>
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1 min-w-0">
                <CardTitle className="text-lg flex items-center gap-2 flex-wrap">
                  <AuthorName principal={post.author} />
                  <Badge variant="destructive" className="flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" />
                    {post.reports.toString()} {Number(post.reports) === 1 ? 'report' : 'reports'}
                  </Badge>
                </CardTitle>
                <p className="text-sm text-muted-foreground mt-1">
                  {new Date(Number(post.timestamp) / 1000000).toLocaleString()}
                </p>
              </div>
              <div className="flex gap-2 flex-shrink-0">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleClearReports(post.id)}
                  disabled={processingId === post.id}
                >
                  <CheckCircle className="h-4 w-4 mr-1" />
                  Clear Reports
                </Button>
                <Button
                  size="sm"
                  variant="destructive"
                  onClick={() => handleDeletePost(post.id)}
                  disabled={processingId === post.id}
                >
                  <Trash2 className="h-4 w-4 mr-1" />
                  Delete
                </Button>
              </div>
            </div>
          </CardHeader>
          <Separator />
          <CardContent className="pt-4">
            <p className="text-sm whitespace-pre-wrap break-words">{post.content}</p>
            {(post.image || post.video) && (
              <div className="mt-4 text-xs text-muted-foreground">
                {post.image && <span>📷 Contains image</span>}
                {post.image && post.video && <span> • </span>}
                {post.video && <span>🎥 Contains video</span>}
              </div>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
