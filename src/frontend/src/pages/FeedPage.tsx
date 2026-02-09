import { useState, useRef, useEffect, useMemo, memo, useCallback } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { Button } from '../components/ui/button';
import { Textarea } from '../components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Loader2, Send, Image as ImageIcon, X, RefreshCw, CheckCircle2 } from 'lucide-react';
import { useCurrentUser } from '../hooks/useCurrentUser';
import { useGetAllPosts, useCreatePost } from '../hooks/useQueries';
import PostCard from '../components/posts/PostCard';
import { LoadingSkeleton, ErrorState, EmptyState } from '../components/state/QueryState';
import { Alert, AlertDescription } from '../components/ui/alert';
import { validateImageFile, fileToBackendImage, createPreviewUrl, revokeImageUrl, extractErrorMessage } from '../utils/postImages';
import type { Image, Post } from '../backend';

// Memoized post list to prevent re-renders during typing/background fetches
const PostList = memo(({ posts }: { posts: Post[] }) => {
  return (
    <div className="space-y-4">
      {posts.map((post) => (
        <PostCard key={post.id.toString()} post={post} />
      ))}
    </div>
  );
});

PostList.displayName = 'PostList';

export default function FeedPage() {
  const navigate = useNavigate();
  const { isAuthenticated } = useCurrentUser();
  const { data: posts, isLoading, error, refetch, isFetching, isRefetching } = useGetAllPosts(true);
  const createPost = useCreatePost();
  const [content, setContent] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [imageError, setImageError] = useState<string | null>(null);
  const [submissionError, setSubmissionError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [refreshError, setRefreshError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const validation = validateImageFile(file);
    if (!validation.valid) {
      setImageError(validation.error || 'Invalid image file');
      return;
    }

    setImageError(null);
    setSelectedFile(file);
    const url = createPreviewUrl(file);
    setPreviewUrl(url);
  }, []);

  const handleRemoveImage = useCallback(() => {
    if (previewUrl) {
      revokeImageUrl(previewUrl);
    }
    setSelectedFile(null);
    setPreviewUrl(null);
    setImageError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, [previewUrl]);

  const handleCreatePost = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if ((!content.trim() && !selectedFile) || !isAuthenticated) return;

    setSubmissionError(null);
    setImageError(null);
    setSuccessMessage(null);

    try {
      let imageData: Image | null = null;
      if (selectedFile) {
        imageData = await fileToBackendImage(selectedFile);
      }

      await createPost.mutateAsync({
        content: content.trim(),
        image: imageData,
      });

      setContent('');
      handleRemoveImage();
      
      setSuccessMessage('Your post has been shared with the community!');
      setTimeout(() => setSuccessMessage(null), 5000);
    } catch (error: any) {
      console.error('Failed to create post:', error);
      const errorMessage = extractErrorMessage(error);
      
      if (errorMessage.toLowerCase().includes('image') || 
          errorMessage.toLowerCase().includes('size') ||
          errorMessage.toLowerCase().includes('10mb') ||
          errorMessage.toLowerCase().includes('mb')) {
        setImageError(errorMessage);
      } else {
        setSubmissionError(errorMessage);
      }
    }
  }, [content, selectedFile, isAuthenticated, createPost, handleRemoveImage]);

  const handleAddImageClick = useCallback(() => {
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    fileInputRef.current?.click();
  }, []);

  const handleManualRefresh = useCallback(async () => {
    setRefreshError(null);
    try {
      await refetch();
    } catch (error: any) {
      console.error('Failed to refresh posts:', error);
      setRefreshError('Failed to refresh posts. Please try again.');
    }
  }, [refetch]);

  useEffect(() => {
    return () => {
      if (previewUrl) {
        revokeImageUrl(previewUrl);
      }
    };
  }, [previewUrl]);

  // Memoize sorted posts to avoid re-sorting on every render
  const sortedPosts = useMemo(() => {
    if (!posts) return [];
    return [...posts].sort((a, b) => Number(b.timestamp - a.timestamp));
  }, [posts]);

  const hasExistingPosts = sortedPosts.length > 0;
  const showInitialError = error && !hasExistingPosts;
  const showBackgroundRefreshError = error && hasExistingPosts;
  const showBackgroundRefreshing = isRefetching && hasExistingPosts;

  if (!isAuthenticated) {
    return (
      <div className="container mx-auto px-4 py-12 max-w-2xl">
        <Alert>
          <AlertDescription className="text-center">
            Please sign in to view and create posts in the community.
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

  return (
    <div className="container mx-auto px-4 py-6 sm:py-8 max-w-3xl">
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Share with the Community</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleCreatePost} className="space-y-4">
              <Textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="What's on your mind? Share your thoughts, experiences, or insights..."
                rows={4}
                maxLength={1000}
                className="resize-none"
                disabled={createPost.isPending}
              />
              
              {previewUrl && (
                <div className="relative inline-block">
                  <img
                    src={previewUrl}
                    alt="Preview"
                    className="max-h-64 rounded-lg border object-contain"
                    loading="lazy"
                    decoding="async"
                  />
                  <Button
                    type="button"
                    variant="destructive"
                    size="icon"
                    className="absolute top-2 right-2"
                    onClick={handleRemoveImage}
                    disabled={createPost.isPending}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              )}

              {imageError && (
                <Alert variant="destructive">
                  <AlertDescription>{imageError}</AlertDescription>
                </Alert>
              )}

              {submissionError && (
                <Alert variant="destructive">
                  <AlertDescription>{submissionError}</AlertDescription>
                </Alert>
              )}

              {successMessage && (
                <Alert className="border-green-600 bg-green-50 dark:bg-green-950/20">
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                  <AlertDescription className="text-green-800 dark:text-green-200">
                    {successMessage}
                  </AlertDescription>
                </Alert>
              )}

              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div className="flex flex-wrap items-center gap-2">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/jpeg,image/png,image/webp,image/gif"
                    onChange={handleFileSelect}
                    className="hidden"
                    id="image-upload"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleAddImageClick}
                    disabled={createPost.isPending || !!selectedFile}
                  >
                    <ImageIcon className="h-4 w-4 mr-2" />
                    Add Image
                  </Button>
                  <span className="text-xs text-muted-foreground">
                    {content.length}/1000 characters
                  </span>
                </div>
                <Button
                  type="submit"
                  disabled={(!content.trim() && !selectedFile) || createPost.isPending}
                  className="w-full sm:w-auto"
                >
                  {createPost.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Posting...
                    </>
                  ) : (
                    <>
                      <Send className="mr-2 h-4 w-4" />
                      Post
                    </>
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        <div className="space-y-4">
          <div className="flex items-center justify-between gap-2">
            <h2 className="text-xl sm:text-2xl font-bold">Community Feed</h2>
            <Button
              variant="outline"
              size="sm"
              onClick={handleManualRefresh}
              disabled={isFetching}
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${isRefetching ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">Refresh</span>
            </Button>
          </div>

          {showBackgroundRefreshing && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>Refreshing posts...</span>
            </div>
          )}

          {refreshError && (
            <Alert variant="destructive">
              <AlertDescription>{refreshError}</AlertDescription>
            </Alert>
          )}

          {showBackgroundRefreshError && (
            <Alert variant="destructive">
              <AlertDescription>
                Failed to refresh posts automatically. You can use the Refresh button to try again.
              </AlertDescription>
            </Alert>
          )}

          {isLoading && <LoadingSkeleton />}
          {showInitialError && <ErrorState message="Failed to load posts. Please try again." />}
          {!isLoading && !showInitialError && sortedPosts.length === 0 && (
            <EmptyState message="No posts yet. Be the first to share something!" />
          )}
          {!isLoading && !showInitialError && sortedPosts.length > 0 && (
            <PostList posts={sortedPosts} />
          )}
        </div>
      </div>
    </div>
  );
}
