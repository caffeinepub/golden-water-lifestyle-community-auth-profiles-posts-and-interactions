import { memo, useCallback, useState } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { Card, CardContent, CardFooter, CardHeader } from '../ui/card';
import { Button } from '../ui/button';
import { MessageCircle, Flag, Loader2 } from 'lucide-react';
import { useCurrentUser } from '../../hooks/useCurrentUser';
import { useReportPost, useSetPostReaction, useRemovePostReaction } from '../../hooks/useQueries';
import { Alert, AlertDescription } from '../ui/alert';
import { extractErrorMessage } from '../../utils/postImages';
import { useBackendImageUrl } from '../../hooks/useBackendImageUrl';
import ReactionBar from '../reactions/ReactionBar';
import type { Post, ReactionType } from '../../backend';

interface PostCardProps {
  post: Post;
}

function PostCard({ post }: PostCardProps) {
  const navigate = useNavigate();
  const { identity } = useCurrentUser();
  const reportPost = useReportPost();
  const setReaction = useSetPostReaction();
  const removeReaction = useRemovePostReaction();
  const [reportError, setReportError] = useState<string | null>(null);
  const [reactionError, setReactionError] = useState<string | null>(null);
  const imageUrl = useBackendImageUrl(post.image);

  const isAuthor = identity?.getPrincipal().toString() === post.author.toString();

  // For now, we don't have reaction data from backend, so selectedReaction is always null
  const selectedReaction: ReactionType | null = null;

  const handleReactionClick = useCallback(async (reactionType: ReactionType) => {
    setReactionError(null);
    try {
      if (selectedReaction === reactionType) {
        await removeReaction.mutateAsync(post.id);
      } else {
        await setReaction.mutateAsync({ postId: post.id, reactionType });
      }
    } catch (error: any) {
      console.error('Failed to set reaction:', error);
      setReactionError(extractErrorMessage(error));
    }
  }, [post.id, selectedReaction, setReaction, removeReaction]);

  const handleReport = useCallback(async () => {
    if (!window.confirm('Are you sure you want to report this post?')) return;
    
    setReportError(null);
    try {
      await reportPost.mutateAsync(post.id);
    } catch (error: any) {
      console.error('Failed to report post:', error);
      setReportError(extractErrorMessage(error));
    }
  }, [post.id, reportPost]);

  const handleViewComments = useCallback(() => {
    navigate({ to: '/post/$postId', params: { postId: post.id.toString() } });
  }, [navigate, post.id]);

  const formattedDate = new Date(Number(post.timestamp) / 1000000).toLocaleString();

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">
              {isAuthor ? 'You' : `User ${post.author.toString().slice(0, 8)}...`}
            </p>
            <p className="text-xs text-muted-foreground">{formattedDate}</p>
          </div>
          {post.reports > 0n && (
            <span className="text-xs text-destructive font-medium whitespace-nowrap">
              {post.reports.toString()} report{post.reports > 1n ? 's' : ''}
            </span>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="whitespace-pre-wrap break-words">{post.content}</p>
        {imageUrl && (
          <img
            src={imageUrl}
            alt="Post attachment"
            className="max-h-96 w-full object-contain rounded-lg border"
            loading="lazy"
            decoding="async"
          />
        )}
        {reportError && (
          <Alert variant="destructive">
            <AlertDescription>{reportError}</AlertDescription>
          </Alert>
        )}
        {reactionError && (
          <Alert variant="destructive">
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
        <Button
          variant="ghost"
          size="sm"
          onClick={handleViewComments}
          className="gap-2"
        >
          <MessageCircle className="h-4 w-4" />
          <span className="hidden sm:inline">Comments</span>
        </Button>
        {!isAuthor && (
          <Button
            variant="ghost"
            size="sm"
            onClick={handleReport}
            disabled={reportPost.isPending}
            className="gap-2"
          >
            {reportPost.isPending ? (
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

// Memoize with shallow comparison for Post object
export default memo(PostCard, (prevProps, nextProps) => {
  return prevProps.post.id === nextProps.post.id &&
         prevProps.post.reports === nextProps.post.reports &&
         prevProps.post.content === nextProps.post.content;
});
