import { useMutation, useQuery, useQueryClient, useInfiniteQuery } from '@tanstack/react-query';
import { useActor } from './useActor';
import type { Post, Comment, Profile, ReactionType, UserRole, ModerationStatus } from '../backend';
import { ExternalBlob } from '../backend';
import { Principal } from '@dfinity/principal';
import { toCandidOpt } from '../utils/candidOption';

// ============================================================================
// Profile Queries
// ============================================================================

export function useGetCallerUserProfile() {
  const { actor, isFetching: actorFetching } = useActor();

  const query = useQuery<Profile | null>({
    queryKey: ['currentUserProfile'],
    queryFn: async () => {
      if (!actor) throw new Error('Actor not available');
      return actor.getCallerUserProfile();
    },
    enabled: !!actor && !actorFetching,
    retry: false,
  });

  return {
    ...query,
    isLoading: actorFetching || query.isLoading,
    isFetched: !!actor && query.isFetched,
  };
}

export function useSaveCallerUserProfile() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (profile: Profile) => {
      if (!actor) throw new Error('Actor not available');
      return actor.saveCallerUserProfile(profile);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['currentUserProfile'] });
    },
  });
}

export function useGetUsernameFromPrincipal(principal: Principal) {
  const { actor, isFetching: actorFetching } = useActor();

  return useQuery<string | null>({
    queryKey: ['username', principal.toString()],
    queryFn: async () => {
      if (!actor) throw new Error('Actor not available');
      return actor.getUsernameFromPrincipal(principal);
    },
    enabled: !!actor && !actorFetching,
    staleTime: 5 * 60 * 1000, // 5 minutes - usernames rarely change
    gcTime: 10 * 60 * 1000, // 10 minutes
  });
}

// ============================================================================
// Content Guidelines Query
// ============================================================================

export function useGetContentGuidelines() {
  const { actor, isFetching: actorFetching } = useActor();

  return useQuery<string>({
    queryKey: ['contentGuidelines'],
    queryFn: async () => {
      if (!actor) throw new Error('Actor not available');
      return actor.getContentGuidelines();
    },
    enabled: !!actor && !actorFetching,
    staleTime: Infinity, // Guidelines rarely change
    gcTime: Infinity,
    refetchOnWindowFocus: false, // Don't refetch on focus
    refetchOnMount: false, // Don't refetch on mount if data exists
  });
}

// ============================================================================
// Post Queries (Paginated)
// ============================================================================

export function useGetPostsPage(pageSize: number = 20) {
  const { actor, isFetching: actorFetching } = useActor();

  return useInfiniteQuery({
    queryKey: ['posts', 'paginated'],
    queryFn: async ({ pageParam = 0 }) => {
      if (!actor) throw new Error('Actor not available');
      return actor.getPostsPage(BigInt(pageParam), BigInt(pageSize));
    },
    getNextPageParam: (lastPage) => {
      return lastPage.nextPageStart !== undefined && lastPage.nextPageStart !== null
        ? Number(lastPage.nextPageStart)
        : undefined;
    },
    initialPageParam: 0,
    enabled: !!actor && !actorFetching,
    staleTime: 30 * 1000, // 30 seconds
    gcTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: false, // Don't auto-refetch when tab becomes visible
  });
}

export function useGetPost(postId: bigint) {
  const { actor, isFetching: actorFetching } = useActor();

  return useQuery<Post | null>({
    queryKey: ['post', postId.toString()],
    queryFn: async () => {
      if (!actor) throw new Error('Actor not available');
      return actor.getPost(postId);
    },
    enabled: !!actor && !actorFetching,
    staleTime: 60 * 1000, // 1 minute
  });
}

export function useCreatePost() {
  const { actor, isFetching: actorFetching } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      content,
      image,
      video,
    }: {
      content: string;
      image: ExternalBlob | null;
      video: ExternalBlob | null;
    }) => {
      if (!actor) {
        throw new Error('The app is still connecting. Please wait a moment and try again.');
      }
      
      // Ensure optional fields are properly encoded for Candid
      const imageOpt = toCandidOpt(image);
      const videoOpt = toCandidOpt(video);
      
      return actor.createPost(content, imageOpt, videoOpt);
    },
    onSuccess: () => {
      // Invalidate only the paginated posts query
      queryClient.invalidateQueries({ queryKey: ['posts', 'paginated'] });
    },
    meta: {
      actorFetching,
    },
  });
}

export function useDeletePost() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (postId: bigint) => {
      if (!actor) throw new Error('Actor not available');
      return actor.deletePost(postId);
    },
    onSuccess: (_, postId) => {
      // Invalidate paginated posts and the specific post
      queryClient.invalidateQueries({ queryKey: ['posts', 'paginated'] });
      queryClient.invalidateQueries({ queryKey: ['post', postId.toString()] });
    },
  });
}

export function useReportPost() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (postId: bigint) => {
      if (!actor) throw new Error('Actor not available');
      return actor.reportPost(postId);
    },
    onSuccess: (_, postId) => {
      // Invalidate only the specific post and admin views
      queryClient.invalidateQueries({ queryKey: ['post', postId.toString()] });
      queryClient.invalidateQueries({ queryKey: ['reportedPosts'] });
    },
  });
}

// ============================================================================
// Post Reactions
// ============================================================================

export function useSetPostReaction() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ postId, reactionType }: { postId: bigint; reactionType: ReactionType }) => {
      if (!actor) throw new Error('Actor not available');
      return actor.setPostReaction(postId, reactionType);
    },
    onSuccess: (_, { postId }) => {
      // Invalidate only the specific post
      queryClient.invalidateQueries({ queryKey: ['post', postId.toString()] });
    },
  });
}

export function useRemovePostReaction() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (postId: bigint) => {
      if (!actor) throw new Error('Actor not available');
      return actor.removePostReaction(postId);
    },
    onSuccess: (_, postId) => {
      // Invalidate only the specific post
      queryClient.invalidateQueries({ queryKey: ['post', postId.toString()] });
    },
  });
}

// ============================================================================
// Comment Queries
// ============================================================================

export function useGetPostComments(postId: bigint) {
  const { actor, isFetching: actorFetching } = useActor();

  return useQuery<Comment[]>({
    queryKey: ['comments', postId.toString()],
    queryFn: async () => {
      if (!actor) throw new Error('Actor not available');
      return actor.getPostComments(postId);
    },
    enabled: !!actor && !actorFetching,
    staleTime: 30 * 1000, // 30 seconds
  });
}

export function useCreateComment() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ postId, content }: { postId: bigint; content: string }) => {
      if (!actor) throw new Error('Actor not available');
      return actor.createComment(postId, content);
    },
    onSuccess: (_, { postId }) => {
      // Invalidate only the specific post's comments
      queryClient.invalidateQueries({ queryKey: ['comments', postId.toString()] });
    },
  });
}

export function useDeleteComment() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ commentId, postId }: { commentId: bigint; postId: bigint }) => {
      if (!actor) throw new Error('Actor not available');
      return actor.deleteComment(commentId);
    },
    onSuccess: (_, { postId }) => {
      // Invalidate only the specific post's comments
      queryClient.invalidateQueries({ queryKey: ['comments', postId.toString()] });
      queryClient.invalidateQueries({ queryKey: ['reportedComments'] });
    },
  });
}

export function useReportComment() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ commentId, postId }: { commentId: bigint; postId: bigint }) => {
      if (!actor) throw new Error('Actor not available');
      return actor.reportComment(commentId);
    },
    onSuccess: (_, { postId }) => {
      // Invalidate the specific post's comments and admin views
      queryClient.invalidateQueries({ queryKey: ['comments', postId.toString()] });
      queryClient.invalidateQueries({ queryKey: ['reportedComments'] });
    },
  });
}

// ============================================================================
// Comment Reactions
// ============================================================================

export function useSetCommentReaction() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      commentId,
      reactionType,
      postId,
    }: {
      commentId: bigint;
      reactionType: ReactionType;
      postId: bigint;
    }) => {
      if (!actor) throw new Error('Actor not available');
      return actor.setCommentReaction(commentId, reactionType);
    },
    onSuccess: (_, { postId }) => {
      // Invalidate only the specific post's comments
      queryClient.invalidateQueries({ queryKey: ['comments', postId.toString()] });
    },
  });
}

export function useRemoveCommentReaction() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ commentId, postId }: { commentId: bigint; postId: bigint }) => {
      if (!actor) throw new Error('Actor not available');
      return actor.removeCommentReaction(commentId);
    },
    onSuccess: (_, { postId }) => {
      // Invalidate only the specific post's comments
      queryClient.invalidateQueries({ queryKey: ['comments', postId.toString()] });
    },
  });
}

// ============================================================================
// Admin Queries
// ============================================================================

export function useIsCallerAdmin() {
  const { actor, isFetching: actorFetching } = useActor();

  return useQuery<boolean>({
    queryKey: ['isAdmin'],
    queryFn: async () => {
      if (!actor) throw new Error('Actor not available');
      return actor.isCallerAdmin();
    },
    enabled: !!actor && !actorFetching,
    staleTime: 5 * 60 * 1000, // 5 minutes - admin status rarely changes
    refetchOnWindowFocus: false,
  });
}

export function useGetReportedPostsAdminView() {
  const { actor, isFetching: actorFetching } = useActor();

  return useQuery<Post[]>({
    queryKey: ['reportedPosts'],
    queryFn: async () => {
      if (!actor) throw new Error('Actor not available');
      return actor.getReportedPostsAdminView();
    },
    enabled: !!actor && !actorFetching,
    staleTime: 30 * 1000, // 30 seconds
    refetchOnWindowFocus: false,
  });
}

export function useGetReportedCommentsAdminView() {
  const { actor, isFetching: actorFetching } = useActor();

  return useQuery<Comment[]>({
    queryKey: ['reportedComments'],
    queryFn: async () => {
      if (!actor) throw new Error('Actor not available');
      return actor.getReportedCommentsAdminView();
    },
    enabled: !!actor && !actorFetching,
    staleTime: 30 * 1000, // 30 seconds
    refetchOnWindowFocus: false,
  });
}

export function useGetFlaggedPosts() {
  const { actor, isFetching: actorFetching } = useActor();

  return useQuery<Array<[bigint, ModerationStatus, Post]>>({
    queryKey: ['flaggedPosts'],
    queryFn: async () => {
      if (!actor) throw new Error('Actor not available');
      const flaggedEntries = await actor.getFlaggedHateSpeechPosts();
      const results: Array<[bigint, ModerationStatus, Post]> = [];
      
      for (const [postId, status] of flaggedEntries) {
        const post = await actor.getPost(postId);
        if (post !== null) {
          results.push([postId, status, post]);
        }
      }
      
      return results;
    },
    enabled: !!actor && !actorFetching,
    staleTime: 30 * 1000, // 30 seconds
    refetchOnWindowFocus: false,
  });
}

export function useClearPostReports() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (postId: bigint) => {
      if (!actor) throw new Error('Actor not available');
      return actor.clearPostReports(postId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reportedPosts'] });
    },
  });
}

export function useClearCommentReports() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (commentId: bigint) => {
      if (!actor) throw new Error('Actor not available');
      return actor.clearCommentReports(commentId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reportedComments'] });
    },
  });
}

export function useClearFlaggedPost() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (postId: bigint) => {
      if (!actor) throw new Error('Actor not available');
      return actor.clearFlaggedPost(postId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['flaggedPosts'] });
    },
  });
}
