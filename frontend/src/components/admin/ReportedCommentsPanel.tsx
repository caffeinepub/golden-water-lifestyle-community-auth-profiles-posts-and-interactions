import { AlertCircle, CheckCircle, Trash2, ExternalLink } from 'lucide-react';
import { useGetReportedCommentsAdminView, useClearCommentReports, useDeleteComment } from '../../hooks/useQueries';
import { LoadingSkeleton, ErrorState, EmptyState } from '../state/QueryState';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Separator } from '../ui/separator';
import AuthorName from './AuthorName';
import { useState } from 'react';
import { toast } from 'sonner';
import { Link } from '@tanstack/react-router';

export default function ReportedCommentsPanel() {
  const { data: reportedComments, isLoading, error } = useGetReportedCommentsAdminView();
  const clearReportsMutation = useClearCommentReports();
  const deleteCommentMutation = useDeleteComment();
  const [processingId, setProcessingId] = useState<bigint | null>(null);

  const handleClearReports = async (commentId: bigint) => {
    setProcessingId(commentId);
    try {
      await clearReportsMutation.mutateAsync(commentId);
      toast.success('Reports cleared successfully');
    } catch (error: any) {
      toast.error(error?.message || 'Failed to clear reports');
    } finally {
      setProcessingId(null);
    }
  };

  const handleDeleteComment = async (commentId: bigint, postId: bigint) => {
    if (!confirm('Are you sure you want to delete this comment? This action cannot be undone.')) {
      return;
    }
    setProcessingId(commentId);
    try {
      await deleteCommentMutation.mutateAsync({ commentId, postId });
      toast.success('Comment deleted successfully');
    } catch (error: any) {
      toast.error(error?.message || 'Failed to delete comment');
    } finally {
      setProcessingId(null);
    }
  };

  if (isLoading) {
    return <LoadingSkeleton />;
  }

  if (error) {
    return <ErrorState message="Failed to load reported comments" />;
  }

  if (!reportedComments || reportedComments.length === 0) {
    return (
      <EmptyState
        icon={CheckCircle}
        message="No reported comments. All comments are clear. Great job keeping the community safe!"
      />
    );
  }

  return (
    <div className="space-y-4">
      {reportedComments.map((comment) => (
        <Card key={comment.id.toString()} className="border-amber-200 dark:border-amber-900">
          <CardHeader>
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1 min-w-0">
                <CardTitle className="text-lg flex items-center gap-2 flex-wrap">
                  <AuthorName principal={comment.author} />
                  <Badge variant="destructive" className="flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" />
                    {comment.reports.toString()} {Number(comment.reports) === 1 ? 'report' : 'reports'}
                  </Badge>
                </CardTitle>
                <div className="flex items-center gap-2 mt-1 text-sm text-muted-foreground">
                  <span>{new Date(Number(comment.timestamp) / 1000000).toLocaleString()}</span>
                  <span>•</span>
                  <Link
                    to="/post/$postId"
                    params={{ postId: comment.postId.toString() }}
                    className="flex items-center gap-1 hover:text-primary transition-colors"
                  >
                    View post <ExternalLink className="h-3 w-3" />
                  </Link>
                </div>
              </div>
              <div className="flex gap-2 flex-shrink-0">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleClearReports(comment.id)}
                  disabled={processingId === comment.id}
                >
                  <CheckCircle className="h-4 w-4 mr-1" />
                  Clear Reports
                </Button>
                <Button
                  size="sm"
                  variant="destructive"
                  onClick={() => handleDeleteComment(comment.id, comment.postId)}
                  disabled={processingId === comment.id}
                >
                  <Trash2 className="h-4 w-4 mr-1" />
                  Delete
                </Button>
              </div>
            </div>
          </CardHeader>
          <Separator />
          <CardContent className="pt-4">
            <p className="text-sm whitespace-pre-wrap break-words">{comment.content}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
