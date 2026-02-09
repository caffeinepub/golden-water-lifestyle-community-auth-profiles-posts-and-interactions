import { memo, useCallback, useState } from 'react';
import { Card, CardContent, CardFooter, CardHeader } from '../ui/card';
import { Button } from '../ui/button';
import { Flag, Loader2 } from 'lucide-react';
import { useCurrentUser } from '../../hooks/useCurrentUser';
import { useReportComment, useSetCommentReaction, useRemoveCommentReaction } from '../../hooks/useQueries';
import { Alert, AlertDescription } from '../ui/alert';
import { extractErrorMessage } from '../../utils/postImages';
import ReactionBar from '../reactions/ReactionBar';
import type { Comment, ReactionType } from '../../backend';

interface CommentItemProps {
  comment: Comment;
}

function CommentItem({ comment }: CommentItemProps) {
  const { identity } = useCurrentUser();
  const reportComment = useReportComment();
  const setReaction = useSetCommentReaction();
  const removeReaction = useRemoveCommentReaction();
  const [reportError, setReportError] = useState<string | null>(null);
  const [reactionError, setReactionError] = useState<string | null>(null);

  const isAuthor = identity?.getPrincipal().toString() === comment.author.toString();

  // For now, we don't have reaction data from backend, so selectedReaction is always null
  const selectedReaction: ReactionType | null = null;

  const handleReactionClick = useCallback(async (reactionType: ReactionType) => {
    setReactionError(null);
    try {
      if (selectedReaction === reactionType) {
        await removeReaction.mutateAsync(comment.id);
      } else {
        await setReaction.mutateAsync({ commentId: comment.id, reactionType });
      }
    } catch (error: any) {
      console.error('Failed to set reaction:', error);
      setReactionError(extractErrorMessage(error));
    }
  }, [comment.id, selectedReaction, setReaction, removeReaction]);

  const handleReport = useCallback(async () => {
    if (!window.confirm('Are you sure you want to report this comment?')) return;
    
    setReportError(null);
    try {
      await reportComment.mutateAsync(comment.id);
    } catch (error: any) {
      console.error('Failed to report comment:', error);
      setReportError(extractErrorMessage(error));
    }
  }, [comment.id, reportComment]);

  const formattedDate = new Date(Number(comment.timestamp) / 1000000).toLocaleString();

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">
              {isAuthor ? 'You' : `User ${comment.author.toString().slice(0, 8)}...`}
            </p>
            <p className="text-xs text-muted-foreground">{formattedDate}</p>
          </div>
          {comment.reports > 0n && (
            <span className="text-xs text-destructive font-medium whitespace-nowrap">
              {comment.reports.toString()} report{comment.reports > 1n ? 's' : ''}
            </span>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <p className="whitespace-pre-wrap break-words">{comment.content}</p>
        {reportError && (
          <Alert variant="destructive" className="mt-4">
            <AlertDescription>{reportError}</AlertDescription>
          </Alert>
        )}
        {reactionError && (
          <Alert variant="destructive" className="mt-4">
            <AlertDescription>{reactionError}</AlertDescription>
          </Alert>
        )}
      </CardContent>
      <CardFooter className="flex flex-wrap items-center gap-2 sm:gap-3">
        <ReactionBar
          selectedReaction={selectedReaction}
          onReactionClick={handleReactionClick}
          disabled={setReaction.isPending || removeReaction.isPending}
          isPending={setReaction.isPending || removeReaction.isPending}
        />
        {!isAuthor && (
          <Button
            variant="ghost"
            size="sm"
            onClick={handleReport}
            disabled={reportComment.isPending}
            className="gap-2"
          >
            {reportComment.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Flag className="h-4 w-4" />
            )}
            <span className="hidden sm:inline">Report</span>
          </Button>
        )}
      </CardFooter>
    </Card>
  );
}

// Memoize with shallow comparison for Comment object
export default memo(CommentItem, (prevProps, nextProps) => {
  return prevProps.comment.id === nextProps.comment.id &&
         prevProps.comment.reports === nextProps.comment.reports &&
         prevProps.comment.content === nextProps.comment.content;
});
