import { useState, useMemo, useCallback, useEffect } from 'react';
import { useParams, useNavigate } from '@tanstack/react-router';
import { Button } from '../components/ui/button';
import { Textarea } from '../components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Separator } from '../components/ui/separator';
import { ArrowLeft, Loader2, Send } from 'lucide-react';
import { useCurrentUser } from '../hooks/useCurrentUser';
import { useGetPost, useGetPostComments, useCreateComment, useIsCallerAdmin } from '../hooks/useQueries';
import PostCard from '../components/posts/PostCard';
import CommentItem from '../components/comments/CommentItem';
import { LoadingSkeleton, ErrorState, EmptyState } from '../components/state/QueryState';
import { Alert, AlertDescription } from '../components/ui/alert';
import { extractErrorMessage } from '../utils/postImages';
import { perfMark, perfMeasure } from '../utils/perf';

export default function PostDetailPage() {
  const { postId } = useParams({ from: '/post/$postId' });
  const navigate = useNavigate();
  const { isAuthenticated } = useCurrentUser();
  const { data: post, isLoading: postLoading, error: postError } = useGetPost(BigInt(postId));
  const { data: comments, isLoading: commentsLoading, error: commentsError } = useGetPostComments(BigInt(postId));
  const { data: isAdmin = false } = useIsCallerAdmin();
  const createComment = useCreateComment();
  const [commentContent, setCommentContent] = useState('');
  const [commentError, setCommentError] = useState<string | null>(null);

  // Performance instrumentation
  useEffect(() => {
    perfMark('post-detail-render');
    return () => {
      perfMeasure('post-detail-render', 'PostDetail: Initial render');
    };
  }, []);

  useEffect(() => {
    if (post && !postLoading) {
      perfMeasure('post-detail-data-ready', 'PostDetail: Post data ready');
    }
  }, [post, postLoading]);

  useEffect(() => {
    if (comments && !commentsLoading) {
      perfMeasure('post-detail-comments-ready', 'PostDetail: Comments data ready');
    }
  }, [comments, commentsLoading]);

  const handleCreateComment = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentContent.trim() || !isAuthenticated) return;

    setCommentError(null);
    try {
      await createComment.mutateAsync({
        postId: BigInt(postId),
        content: commentContent.trim(),
      });
      setCommentContent('');
    } catch (error: any) {
      console.error('Failed to create comment:', error);
      setCommentError(extractErrorMessage(error));
    }
  }, [commentContent, isAuthenticated, createComment, postId]);

  const handleBack = useCallback(() => {
    navigate({ to: '/feed' });
  }, [navigate]);

  // Memoize sorted comments to avoid re-sorting on every render
  const sortedComments = useMemo(() => {
    if (!comments) return [];
    return [...comments].sort((a, b) => Number(a.timestamp - b.timestamp));
  }, [comments]);

  if (!isAuthenticated) {
    return (
      <div className="container mx-auto px-4 py-12 max-w-2xl">
        <Alert>
          <AlertDescription className="text-center">
            Please sign in to view posts and comments.
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

  if (postLoading) {
    return (
      <div className="container mx-auto px-4 py-6 sm:py-8 max-w-3xl">
        <LoadingSkeleton count={1} />
      </div>
    );
  }

  if (postError || !post) {
    return (
      <div className="container mx-auto px-4 py-6 sm:py-8 max-w-3xl">
        <Button variant="ghost" onClick={handleBack} className="mb-4">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Feed
        </Button>
        <ErrorState message="Failed to load post. Please try again." />
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-6 sm:py-8 max-w-3xl">
      <Button variant="ghost" onClick={handleBack} className="mb-4">
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back to Feed
      </Button>

      <div className="space-y-6">
        <PostCard post={post} isAdmin={isAdmin} />

        <Separator />

        <Card>
          <CardHeader>
            <CardTitle>Add a Comment</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleCreateComment} className="space-y-4">
              <Textarea
                value={commentContent}
                onChange={(e) => setCommentContent(e.target.value)}
                placeholder="Share your thoughts..."
                rows={3}
                maxLength={500}
                className="resize-none"
                disabled={createComment.isPending}
              />
              {commentError && (
                <Alert variant="destructive">
                  <AlertDescription>{commentError}</AlertDescription>
                </Alert>
              )}
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <span className="text-xs text-muted-foreground">
                  {commentContent.length}/500 characters
                </span>
                <Button
                  type="submit"
                  disabled={!commentContent.trim() || createComment.isPending}
                  className="w-full sm:w-auto"
                >
                  {createComment.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Posting...
                    </>
                  ) : (
                    <>
                      <Send className="mr-2 h-4 w-4" />
                      Comment
                    </>
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        <div className="space-y-4">
          <h3 className="text-lg sm:text-xl font-semibold">
            Comments ({sortedComments.length})
          </h3>
          {commentsLoading && <LoadingSkeleton count={2} />}
          {commentsError && <ErrorState message="Failed to load comments. Please try again." />}
          {!commentsLoading && !commentsError && sortedComments.length === 0 && (
            <EmptyState message="No comments yet. Be the first to comment!" />
          )}
          {!commentsLoading && !commentsError && sortedComments.map((comment) => (
            <CommentItem key={comment.id.toString()} comment={comment} />
          ))}
        </div>
      </div>
    </div>
  );
}
