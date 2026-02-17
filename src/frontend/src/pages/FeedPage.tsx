import { useState, useRef, useEffect, useMemo, memo, useCallback } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { Button } from '../components/ui/button';
import { Textarea } from '../components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Loader2, Send, Image as ImageIcon, Video as VideoIcon, X, RefreshCw, CheckCircle2 } from 'lucide-react';
import { useCurrentUser } from '../hooks/useCurrentUser';
import { useGetPostsPage, useCreatePost, useIsCallerAdmin } from '../hooks/useQueries';
import PostCard from '../components/posts/PostCard';
import { LoadingSkeleton, ErrorState, EmptyState } from '../components/state/QueryState';
import { Alert, AlertDescription } from '../components/ui/alert';
import ModerationAlert from '../components/moderation/ModerationAlert';
import { validateImageFile, createPreviewUrl, revokeImageUrl, fileToBackendImage } from '../utils/postImages';
import { validateVideoFile, fileToBackendVideo, createVideoPreviewUrl, revokeVideoUrl } from '../utils/postVideos';
import { normalizeModerationMessage, categorizeError } from '../utils/moderation';
import { perfMark, perfMeasure } from '../utils/perf';
import type { Post } from '../backend';
import { ExternalBlob } from '../backend';

// Memoized post list to prevent re-renders during typing/background fetches
const PostList = memo(({ posts, isAdmin }: { posts: Post[]; isAdmin: boolean }) => {
  return (
    <div className="space-y-4">
      {posts.map((post) => (
        <PostCard key={post.id.toString()} post={post} isAdmin={isAdmin} />
      ))}
    </div>
  );
});

PostList.displayName = 'PostList';

export default function FeedPage() {
  const navigate = useNavigate();
  const { isAuthenticated } = useCurrentUser();
  const { data, isLoading, error, refetch, isFetching, fetchNextPage, hasNextPage, isFetchingNextPage } = useGetPostsPage(20);
  const { data: isAdmin = false } = useIsCallerAdmin();
  const createPost = useCreatePost();
  const [content, setContent] = useState('');
  const [selectedImageFile, setSelectedImageFile] = useState<File | null>(null);
  const [selectedVideoFile, setSelectedVideoFile] = useState<File | null>(null);
  const [imagePreviewUrl, setImagePreviewUrl] = useState<string | null>(null);
  const [videoPreviewUrl, setVideoPreviewUrl] = useState<string | null>(null);
  const [imageError, setImageError] = useState<string | null>(null);
  const [videoError, setVideoError] = useState<string | null>(null);
  const [moderationError, setModerationError] = useState<string | null>(null);
  const [submissionError, setSubmissionError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [refreshError, setRefreshError] = useState<string | null>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);

  // Performance instrumentation
  useEffect(() => {
    perfMark('feed-initial-render');
    return () => {
      perfMeasure('feed-initial-render', 'Feed: Initial render');
    };
  }, []);

  useEffect(() => {
    if (data && !isLoading) {
      perfMeasure('feed-data-ready', 'Feed: Data ready');
    }
  }, [data, isLoading]);

  const handleImageSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const validation = validateImageFile(file);
    if (!validation.valid) {
      setImageError(validation.error || 'Invalid image file');
      return;
    }

    setImageError(null);
    setSelectedImageFile(file);
    const url = createPreviewUrl(file);
    setImagePreviewUrl(url);
  }, []);

  const handleVideoSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const validation = validateVideoFile(file);
    if (!validation.valid) {
      setVideoError(validation.error || 'Invalid video file');
      return;
    }

    setVideoError(null);
    setSelectedVideoFile(file);
    const url = createVideoPreviewUrl(file);
    setVideoPreviewUrl(url);
  }, []);

  const handleRemoveImage = useCallback(() => {
    if (imagePreviewUrl) {
      revokeImageUrl(imagePreviewUrl);
    }
    setSelectedImageFile(null);
    setImagePreviewUrl(null);
    setImageError(null);
    if (imageInputRef.current) {
      imageInputRef.current.value = '';
    }
  }, [imagePreviewUrl]);

  const handleRemoveVideo = useCallback(() => {
    if (videoPreviewUrl) {
      revokeVideoUrl(videoPreviewUrl);
    }
    setSelectedVideoFile(null);
    setVideoPreviewUrl(null);
    setVideoError(null);
    if (videoInputRef.current) {
      videoInputRef.current.value = '';
    }
  }, [videoPreviewUrl]);

  const handleCreatePost = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if ((!content.trim() && !selectedImageFile && !selectedVideoFile) || !isAuthenticated) return;

    perfMark('post-creation');
    setSubmissionError(null);
    setImageError(null);
    setVideoError(null);
    setModerationError(null);
    setSuccessMessage(null);

    try {
      let imageData: ExternalBlob | null = null;
      let videoData: ExternalBlob | null = null;

      if (selectedImageFile) {
        imageData = await fileToBackendImage(selectedImageFile);
      }

      if (selectedVideoFile) {
        videoData = await fileToBackendVideo(selectedVideoFile);
      }

      await createPost.mutateAsync({
        content: content.trim(),
        image: imageData,
        video: videoData,
      });

      perfMeasure('post-creation', 'Feed: Post creation complete');

      setContent('');
      handleRemoveImage();
      handleRemoveVideo();
      
      setSuccessMessage('Your post has been shared with the community!');
      setTimeout(() => setSuccessMessage(null), 5000);
    } catch (error: any) {
      console.error('Failed to create post:', error);
      const errorMessage = normalizeModerationMessage(error);
      const errorType = categorizeError(errorMessage);
      
      switch (errorType) {
        case 'moderation':
          setModerationError(errorMessage);
          break;
        case 'video':
          setVideoError(errorMessage);
          break;
        case 'image':
          setImageError(errorMessage);
          break;
        default:
          setSubmissionError(errorMessage);
          break;
      }
    }
  }, [content, selectedImageFile, selectedVideoFile, isAuthenticated, createPost, handleRemoveImage, handleRemoveVideo]);

  const handleAddImageClick = useCallback(() => {
    if (imageInputRef.current) {
      imageInputRef.current.value = '';
    }
    imageInputRef.current?.click();
  }, []);

  const handleAddVideoClick = useCallback(() => {
    if (videoInputRef.current) {
      videoInputRef.current.value = '';
    }
    videoInputRef.current?.click();
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

  const handleLoadMore = useCallback(() => {
    if (hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  useEffect(() => {
    return () => {
      if (imagePreviewUrl) {
        revokeImageUrl(imagePreviewUrl);
      }
      if (videoPreviewUrl) {
        revokeVideoUrl(videoPreviewUrl);
      }
    };
  }, [imagePreviewUrl, videoPreviewUrl]);

  // Memoize flattened and sorted posts to avoid re-sorting on every render
  const sortedPosts = useMemo(() => {
    if (!data?.pages) return [];
    const allPosts = data.pages.flatMap((page) => page.posts);
    return [...allPosts].sort((a, b) => Number(b.timestamp - a.timestamp));
  }, [data?.pages]);

  const hasExistingPosts = sortedPosts.length > 0;
  const showInitialError = error && !hasExistingPosts;
  const isRefetching = isFetching && hasExistingPosts;

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
              
              {imagePreviewUrl && (
                <div className="relative inline-block">
                  <img
                    src={imagePreviewUrl}
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

              {videoPreviewUrl && (
                <div className="relative inline-block w-full">
                  <video
                    src={videoPreviewUrl}
                    controls
                    className="max-h-64 w-full rounded-lg border object-contain"
                  />
                  <Button
                    type="button"
                    variant="destructive"
                    size="icon"
                    className="absolute top-2 right-2"
                    onClick={handleRemoveVideo}
                    disabled={createPost.isPending}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              )}

              {moderationError && (
                <ModerationAlert message={moderationError} />
              )}

              {imageError && (
                <Alert variant="destructive">
                  <AlertDescription>{imageError}</AlertDescription>
                </Alert>
              )}

              {videoError && (
                <Alert variant="destructive">
                  <AlertDescription>{videoError}</AlertDescription>
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
                    ref={imageInputRef}
                    type="file"
                    accept="image/jpeg,image/png,image/webp,image/gif"
                    onChange={handleImageSelect}
                    className="hidden"
                    id="image-upload"
                  />
                  <input
                    ref={videoInputRef}
                    type="file"
                    accept="video/mp4,video/webm,video/ogg,video/quicktime"
                    onChange={handleVideoSelect}
                    className="hidden"
                    id="video-upload"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleAddImageClick}
                    disabled={createPost.isPending || !!selectedImageFile || !!selectedVideoFile}
                  >
                    <ImageIcon className="h-4 w-4 mr-2" />
                    Add Image
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleAddVideoClick}
                    disabled={createPost.isPending || !!selectedImageFile || !!selectedVideoFile}
                  >
                    <VideoIcon className="h-4 w-4 mr-2" />
                    Add Video
                  </Button>
                  <span className="text-xs text-muted-foreground">
                    {content.length}/1000 characters
                  </span>
                </div>
                <Button
                  type="submit"
                  disabled={(!content.trim() && !selectedImageFile && !selectedVideoFile) || createPost.isPending}
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

          {isRefetching && (
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

          {isLoading && <LoadingSkeleton />}
          {showInitialError && <ErrorState message="Failed to load posts. Please try again." />}
          {!isLoading && !showInitialError && sortedPosts.length === 0 && (
            <EmptyState message="No posts yet. Be the first to share something!" />
          )}
          {!isLoading && !showInitialError && sortedPosts.length > 0 && (
            <>
              <PostList posts={sortedPosts} isAdmin={isAdmin} />
              {hasNextPage && (
                <div className="flex justify-center pt-4">
                  <Button
                    variant="outline"
                    onClick={handleLoadMore}
                    disabled={isFetchingNextPage}
                  >
                    {isFetchingNextPage ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Loading more...
                      </>
                    ) : (
                      'Load more posts'
                    )}
                  </Button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
