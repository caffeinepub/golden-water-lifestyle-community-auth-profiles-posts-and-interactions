import type { Post, ModerationStatus } from '../backend';

export type FlaggedPostItem = [bigint, ModerationStatus, Post];

/**
 * Extract the flag reason text from a ModerationStatus
 */
export function getFlagReason(status: ModerationStatus): string {
  if (status.__kind__ === 'flagged') {
    return status.flagged;
  }
  return 'Unknown reason';
}

/**
 * Case-insensitive substring match
 */
export function containsIgnoreCase(text: string, search: string): boolean {
  return text.toLowerCase().includes(search.toLowerCase());
}

/**
 * Check if a post has any media (image or video)
 */
export function hasMedia(post: Post): boolean {
  return !!(post.image || post.video);
}

/**
 * Check if a post has an image
 */
export function hasImage(post: Post): boolean {
  return !!post.image;
}

/**
 * Check if a post has a video
 */
export function hasVideo(post: Post): boolean {
  return !!post.video;
}

/**
 * Compare two posts by timestamp (for sorting)
 */
export function compareByTimestamp(a: Post, b: Post, order: 'asc' | 'desc'): number {
  const aTime = Number(a.timestamp);
  const bTime = Number(b.timestamp);
  return order === 'desc' ? bTime - aTime : aTime - bTime;
}

export type MediaFilter = 'all' | 'image' | 'video' | 'any-media';

/**
 * Apply media filter to a post
 */
export function matchesMediaFilter(post: Post, filter: MediaFilter): boolean {
  switch (filter) {
    case 'all':
      return true;
    case 'image':
      return hasImage(post);
    case 'video':
      return hasVideo(post);
    case 'any-media':
      return hasMedia(post);
    default:
      return true;
  }
}
