import { memo, useCallback, useState } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { Card, CardContent, CardFooter, CardHeader } from '../ui/card';
import { Button } from '../ui/button';
import { MessageCircle, Flag, Loader2, Trash2 } from 'lucide-react';
import { useCurrentUser } from '../../hooks/useCurrentUser';
import { useReportPost, useSetPostReaction, useRemovePostReaction, useDeletePost, useIsCallerAdmin, useGetUsernameFromPrincipal } from '../../hooks/useQueries';
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
  const { data: isAdmin } = useIsCallerAdmin();
  const reportPost = useReportPost();
  const deletePost = useDeletePost();
  const setReaction = useSetPostReaction();
  const removeReaction = useRemovePostReaction();
  const [reportError, setReportError] = useState<string | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [reactionError, setReactionError] = useState<string | null>(null);
  const imageUrl = useBackendImageUrl(post.image);

  const isAuthor = identity?.getPrincipal().toString() === post.author.toString();
  const canDelete = isAuthor || isAdmin;

  // Fetch username only if not the author
  const { data: username } = useGetUsernameFromPrincipal(post.author);

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

  const handleDelete = useCallback(async () => {
    if (!window.confirm('Are you sure you want to delete this post? This cannot be undone.')) return;
    
    setDeleteError(null);
    try {
      await deletePost.mutateAsync(post.id);
    } catch (error: any) {
      console.error('Failed to delete post:', error);
      setDeleteError(extractErrorMessage(error));
    }
  }, [post.id, deletePost]);

  const handleViewComments = useCallback(() => {
    navigate({ to: '/post/$postId', params: { postId: post.id.toString() } });
  }, [navigate, post.id]);

  const formattedDate = new Date(Number(post.timestamp) / 1000000).toLocaleString();

  // Determine display name
  const displayName = isAuthor 
    ? 'You' 
    : username 
      ? username 
      : `User ${post.author.toString().slice(0, 8)}...`;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">
              {displayName}
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
        {deleteError && (
          <Alert variant="destructive">
            <AlertDescription>{deleteError}</AlertDescription>
          </Alert>
        )}
        {reactionError && (
          <Alert variant="destructive">
            <AlertDescription>{reactionError}</AlertDescription>
          </Alert>
        )}
      </CardContent>
      <CardFooter className="flex flex-col sm:flex-row gap-2 sm:gap-3">
        <ReactionBar
          selectedReaction={selectedReaction}
          onReactionClick={handleReactionClick}
          disabled={setReaction.isPending || removeReaction.isPending}
        />
        <div className="flex gap-2 w-full sm:w-auto sm:ml-auto">
          <Button
            variant="outline"
            size="sm"
            onClick={handleViewComments}
            className="flex-1 sm:flex-initial"
          >
            <MessageCircle className="mr-2 h-4 w-4" />
            Comments
          </Button>
          {canDelete ? (
            <Button
              variant="outline"
              size="sm"
              onClick={handleDelete}
              disabled={deletePost.isPending}
              className="flex-1 sm:flex-initial text-destructive hover:text-destructive"
            >
              {deletePost.isPending ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Trash2 className="mr-2 h-4 w-4" />
              )}
              Delete
            </Button>
          ) : (
            <Button
              variant="outline"
              size="sm"
              onClick={handleReport}
              disabled={reportPost.isPending}
              className="flex-1 sm:flex-initial"
            >
              {reportPost.isPending ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Flag className="mr-2 h-4 w-4" />
              )}
              Report
            </Button>
          )}
        </div>
      </CardFooter>
    </Card>
  );
}

export default memo(PostCard);
