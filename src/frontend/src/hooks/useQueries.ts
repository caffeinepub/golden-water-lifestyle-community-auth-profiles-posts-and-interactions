import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useActor } from './useActor';
import type { Post, Comment, Profile, ReactionType, ModerationStatus } from '../backend';
import { ExternalBlob } from '../backend';
import { useEffect, useRef } from 'react';
import { Principal } from '@dfinity/principal';

export function useGetContentGuidelines() {
  const { actor, isFetching } = useActor();

  return useQuery<string>({
    queryKey: ['contentGuidelines'],
    queryFn: async () => {
      if (!actor) throw new Error('Actor not available');
      return actor.getContentGuidelines();
    },
    enabled: !!actor && !isFetching,
    staleTime: 1000 * 60 * 60, // 1 hour - guidelines rarely change
  });
}

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

export function useIsCallerAdmin() {
  const { actor, isFetching } = useActor();

  return useQuery<boolean>({
    queryKey: ['isCallerAdmin'],
    queryFn: async () => {
      if (!actor) return false;
      return actor.isCallerAdmin();
    },
    enabled: !!actor && !isFetching,
    staleTime: 1000 * 60 * 5, // 5 minutes - admin status doesn't change often
  });
}

export function useGetUsernameFromPrincipal(authorPrincipal: Principal | string) {
  const { actor, isFetching } = useActor();
  const principalText = typeof authorPrincipal === 'string' ? authorPrincipal : authorPrincipal.toString();

  return useQuery<string | null>({
    queryKey: ['username', principalText],
    queryFn: async () => {
      if (!actor) return null;
      try {
        const principal = typeof authorPrincipal === 'string' 
          ? Principal.fromText(authorPrincipal) 
          : authorPrincipal;
        return await actor.getUsernameFromPrincipal(principal);
      } catch (error) {
        console.error('Failed to fetch username:', error);
        return null;
      }
    },
    enabled: !!actor && !isFetching,
    staleTime: 1000 * 60 * 10, // 10 minutes - usernames don't change often
    retry: false,
  });
}

export function useGetAllPosts(enableAutoRefresh = false) {
  const { actor, isFetching } = useActor();
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const queryClient = useQueryClient();

  const query = useQuery<Post[]>({
    queryKey: ['posts'],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getAllPosts();
    },
    enabled: !!actor && !isFetching,
    staleTime: 1000 * 20, // 20 seconds - keep data fresh but avoid excessive refetches
    refetchOnWindowFocus: false,
  });

  useEffect(() => {
    if (enableAutoRefresh && actor && !isFetching) {
      intervalRef.current = setInterval(() => {
        queryClient.invalidateQueries({ queryKey: ['posts'] });
      }, 30000);

      return () => {
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
        }
      };
    }
  }, [enableAutoRefresh, actor, isFetching, queryClient]);

  return query;
}

export function useGetPost(postId: bigint) {
  const { actor, isFetching } = useActor();

  return useQuery<Post | null>({
    queryKey: ['post', postId.toString()],
    queryFn: async () => {
      if (!actor) return null;
      return actor.getPost(postId);
    },
    enabled: !!actor && !isFetching,
  });
}

export function useCreatePost() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ content, image, video }: { content: string; image: ExternalBlob | null; video: ExternalBlob | null }) => {
      if (!actor) throw new Error('Actor not available');
      return actor.createPost(content, image, video);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['posts'] });
    },
  });
}

export function useUpdatePost() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ postId, content, image, video }: { postId: bigint; content: string; image: ExternalBlob | null; video: ExternalBlob | null }) => {
      if (!actor) throw new Error('Actor not available');
      return actor.updatePost(postId, content, image, video);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['posts'] });
      queryClient.invalidateQueries({ queryKey: ['post', variables.postId.toString()] });
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
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['posts'] });
      queryClient.invalidateQueries({ queryKey: ['reportedPostsAdmin'] });
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
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['posts'] });
    },
  });
}

export function useSetPostReaction() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ postId, reactionType }: { postId: bigint; reactionType: ReactionType }) => {
      if (!actor) throw new Error('Actor not available');
      return actor.setPostReaction(postId, reactionType);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['posts'] });
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
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['posts'] });
    },
  });
}

export function useGetPostComments(postId: bigint) {
  const { actor, isFetching } = useActor();

  return useQuery<Comment[]>({
    queryKey: ['comments', postId.toString()],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getPostComments(postId);
    },
    enabled: !!actor && !isFetching,
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
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['comments', variables.postId.toString()] });
    },
  });
}

export function useUpdateComment() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ commentId, content }: { commentId: bigint; content: string }) => {
      if (!actor) throw new Error('Actor not available');
      return actor.updateComment(commentId, content);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['comments'] });
    },
  });
}

export function useDeleteComment() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (commentId: bigint) => {
      if (!actor) throw new Error('Actor not available');
      return actor.deleteComment(commentId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['comments'] });
      queryClient.invalidateQueries({ queryKey: ['reportedCommentsAdmin'] });
    },
  });
}

export function useReportComment() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (commentId: bigint) => {
      if (!actor) throw new Error('Actor not available');
      return actor.reportComment(commentId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['comments'] });
    },
  });
}

export function useSetCommentReaction() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ commentId, reactionType }: { commentId: bigint; reactionType: ReactionType }) => {
      if (!actor) throw new Error('Actor not available');
      return actor.setCommentReaction(commentId, reactionType);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['comments'] });
    },
  });
}

export function useRemoveCommentReaction() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (commentId: bigint) => {
      if (!actor) throw new Error('Actor not available');
      return actor.removeCommentReaction(commentId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['comments'] });
    },
  });
}

// Admin moderation hooks

export function useGetReportedPostsAdminView() {
  const { actor, isFetching } = useActor();

  return useQuery<Post[]>({
    queryKey: ['reportedPostsAdmin'],
    queryFn: async () => {
      if (!actor) throw new Error('Actor not available');
      return actor.getReportedPostsAdminView();
    },
    enabled: !!actor && !isFetching,
    staleTime: 1000 * 30, // 30 seconds
  });
}

export function useGetReportedCommentsAdminView() {
  const { actor, isFetching } = useActor();

  return useQuery<Comment[]>({
    queryKey: ['reportedCommentsAdmin'],
    queryFn: async () => {
      if (!actor) throw new Error('Actor not available');
      return actor.getReportedCommentsAdminView();
    },
    enabled: !!actor && !isFetching,
    staleTime: 1000 * 30, // 30 seconds
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
      queryClient.invalidateQueries({ queryKey: ['reportedPostsAdmin'] });
      queryClient.invalidateQueries({ queryKey: ['posts'] });
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
      queryClient.invalidateQueries({ queryKey: ['reportedCommentsAdmin'] });
      queryClient.invalidateQueries({ queryKey: ['comments'] });
    },
  });
}

export function useGetFlaggedPosts() {
  const { actor, isFetching } = useActor();

  return useQuery<Array<[bigint, ModerationStatus, Post]>>({
    queryKey: ['flaggedPosts'],
    queryFn: async () => {
      if (!actor) throw new Error('Actor not available');
      const flaggedData = await actor.getFlaggedHateSpeechPosts();
      
      // Fetch full post data for each flagged post
      const postsWithData = await Promise.all(
        flaggedData.map(async ([postId, status]) => {
          const post = await actor.getPost(postId);
          return [postId, status, post] as [bigint, ModerationStatus, Post];
        })
      );
      
      // Filter out any posts that couldn't be fetched
      return postsWithData.filter(([, , post]) => post !== null);
    },
    enabled: !!actor && !isFetching,
    staleTime: 1000 * 30, // 30 seconds
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
      queryClient.invalidateQueries({ queryKey: ['posts'] });
    },
  });
}
