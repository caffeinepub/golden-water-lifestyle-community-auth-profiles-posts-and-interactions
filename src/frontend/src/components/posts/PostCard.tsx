import { memo, useCallback, useState } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { Card, CardContent, CardFooter, CardHeader } from '../ui/card';
import { Button } from '../ui/button';
import { MessageCircle, Flag, Loader2, Trash2 } from 'lucide-react';
import { useCurrentUser } from '../../hooks/useCurrentUser';
import { useReportPost, useSetPostReaction, useRemovePostReaction, useDeletePost, useGetUsernameFromPrincipal } from '../../hooks/useQueries';
import { Alert, AlertDescription } from '../ui/alert';
import { extractErrorMessage } from '../../utils/postImages';
import { useBackendImageUrl } from '../../hooks/useBackendImageUrl';
import { useBackendExternalBlobUrl } from '../../hooks/useBackendExternalBlobUrl';
import ReactionBar from '../reactions/ReactionBar';
import type { Post, ReactionType } from '../../backend';

interface PostCardProps {
  post: Post;
  isAdmin: boolean;
}

function PostCard({ post, isAdmin }: PostCardProps) {
  const navigate = useNavigate();
  const { identity } = useCurrentUser();
  const reportPost = useReportPost();
  const deletePost = useDeletePost();
  const setReaction = useSetPostReaction();
  const removeReaction = useRemovePostReaction();
  const [reportError, setReportError] = useState<string | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [reactionError, setReactionError] = useState<string | null>(null);
  const imageUrl = useBackendImageUrl(post.image);
  const videoUrl = useBackendExternalBlobUrl(post.video);

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
    if (!window.confirm('Are you sure you want to delete this post? This action cannot be undone.')) return;
    
    setDeleteError(null);
    try {
      await deletePost.mutateAsync(post.id);
    } catch (error: any) {
      console.error('Failed to delete post:', error);
      setDeleteError(extractErrorMessage(error));
    }
  }, [post.id, deletePost]);

  const handleCardClick = useCallback((e: React.MouseEvent) => {
    if (
      (e.target as HTMLElement).closest('button') ||
      (e.target as HTMLElement).closest('a') ||
      (e.target as HTMLElement).closest('video')
    ) {
      return;
    }
    navigate({ to: '/post/$postId', params: { postId: post.id.toString() } });
  }, [navigate, post.id]);

  const displayName = username || `User ${post.author.toString().slice(0, 8)}...`;
  const formattedDate = new Date(Number(post.timestamp) / 1000000).toLocaleString();

  return (
    <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={handleCardClick}>
      <CardHeader>
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <p className="font-semibold truncate">{displayName}</p>
            <p className="text-xs text-muted-foreground">{formattedDate}</p>
          </div>
          {canDelete && (
            <Button
              variant="ghost"
              size="icon"
              onClick={(e) => {
                e.stopPropagation();
                handleDelete();
              }}
              disabled={deletePost.isPending}
              className="shrink-0"
            >
              {deletePost.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Trash2 className="h-4 w-4" />
              )}
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="whitespace-pre-wrap break-words">{post.content}</p>
        {imageUrl && (
          <img
            src={imageUrl}
            alt="Post attachment"
            className="w-full rounded-lg max-h-96 object-contain"
            loading="lazy"
            decoding="async"
          />
        )}
        {videoUrl && (
          <video
            src={videoUrl}
            controls
            className="w-full rounded-lg max-h-96"
            preload="metadata"
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
      <CardFooter className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pt-0">
        <ReactionBar
          selectedReaction={selectedReaction}
          onReactionClick={handleReactionClick}
          isPending={setReaction.isPending || removeReaction.isPending}
        />
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Button
            variant="ghost"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              navigate({ to: '/post/$postId', params: { postId: post.id.toString() } });
            }}
            className="flex-1 sm:flex-initial"
          >
            <MessageCircle className="h-4 w-4 mr-2" />
            Comment
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              handleReport();
            }}
            disabled={reportPost.isPending}
            className="flex-1 sm:flex-initial"
          >
            {reportPost.isPending ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Flag className="h-4 w-4 mr-2" />
            )}
            Report
          </Button>
        </div>
      </CardFooter>
    </Card>
  );
}

export default memo(PostCard);
