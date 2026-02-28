import { Flag, CheckCircle, ArrowUpDown, Search, Filter } from 'lucide-react';
import { useGetFlaggedPosts, useClearFlaggedPost } from '../../hooks/useQueries';
import { LoadingSkeleton, ErrorState, EmptyState } from '../state/QueryState';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Separator } from '../ui/separator';
import { Input } from '../ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Label } from '../ui/label';
import AuthorName from './AuthorName';
import { useState, useMemo } from 'react';
import { toast } from 'sonner';
import {
  getFlagReason,
  containsIgnoreCase,
  compareByTimestamp,
  matchesMediaFilter,
  type MediaFilter,
  type FlaggedPostItem,
} from '../../utils/flaggedPostsView';

type SortOrder = 'newest' | 'oldest';

export default function FlaggedPostsPanel() {
  const { data: flaggedData, isLoading, error } = useGetFlaggedPosts();
  const clearFlagMutation = useClearFlaggedPost();
  const [processingId, setProcessingId] = useState<bigint | null>(null);

  // Filter and sort state
  const [sortOrder, setSortOrder] = useState<SortOrder>('newest');
  const [contentSearch, setContentSearch] = useState('');
  const [mediaFilter, setMediaFilter] = useState<MediaFilter>('all');
  const [flagReasonSearch, setFlagReasonSearch] = useState('');

  const handleClearFlag = async (postId: bigint) => {
    setProcessingId(postId);
    try {
      await clearFlagMutation.mutateAsync(postId);
      toast.success('Flag cleared successfully');
    } catch (error: any) {
      toast.error(error?.message || 'Failed to clear flag');
    } finally {
      setProcessingId(null);
    }
  };

  // Derive filtered and sorted list
  const filteredAndSortedData = useMemo(() => {
    if (!flaggedData || flaggedData.length === 0) {
      return [];
    }

    let result: FlaggedPostItem[] = [...flaggedData];

    // Apply content search filter
    if (contentSearch.trim()) {
      result = result.filter(([, , post]) =>
        containsIgnoreCase(post.content, contentSearch.trim())
      );
    }

    // Apply media filter
    if (mediaFilter !== 'all') {
      result = result.filter(([, , post]) => matchesMediaFilter(post, mediaFilter));
    }

    // Apply flag reason search filter
    if (flagReasonSearch.trim()) {
      result = result.filter(([, status]) => {
        const reason = getFlagReason(status);
        return containsIgnoreCase(reason, flagReasonSearch.trim());
      });
    }

    // Apply sorting
    result.sort(([, , postA], [, , postB]) =>
      compareByTimestamp(postA, postB, sortOrder === 'newest' ? 'desc' : 'asc')
    );

    return result;
  }, [flaggedData, contentSearch, mediaFilter, flagReasonSearch, sortOrder]);

  if (isLoading) {
    return <LoadingSkeleton />;
  }

  if (error) {
    return <ErrorState message="Failed to load flagged posts" />;
  }

  const hasNoFlaggedPosts = !flaggedData || flaggedData.length === 0;
  const hasNoMatchingPosts = !hasNoFlaggedPosts && filteredAndSortedData.length === 0;

  if (hasNoFlaggedPosts) {
    return (
      <EmptyState
        icon={CheckCircle}
        message="No flagged posts. No posts have been automatically flagged by the moderation system."
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* Control Bar */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Filter className="h-4 w-4" />
            Filters & Sorting
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Sort Order */}
            <div className="space-y-2">
              <Label htmlFor="sort-order" className="text-sm font-medium flex items-center gap-1">
                <ArrowUpDown className="h-3 w-3" />
                Sort by
              </Label>
              <Select value={sortOrder} onValueChange={(value) => setSortOrder(value as SortOrder)}>
                <SelectTrigger id="sort-order">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="newest">Newest first</SelectItem>
                  <SelectItem value="oldest">Oldest first</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Media Filter */}
            <div className="space-y-2">
              <Label htmlFor="media-filter" className="text-sm font-medium">
                Media type
              </Label>
              <Select value={mediaFilter} onValueChange={(value) => setMediaFilter(value as MediaFilter)}>
                <SelectTrigger id="media-filter">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All posts</SelectItem>
                  <SelectItem value="image">Has image</SelectItem>
                  <SelectItem value="video">Has video</SelectItem>
                  <SelectItem value="any-media">Has any media</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Content Search */}
            <div className="space-y-2">
              <Label htmlFor="content-search" className="text-sm font-medium flex items-center gap-1">
                <Search className="h-3 w-3" />
                Search content
              </Label>
              <Input
                id="content-search"
                type="text"
                placeholder="Search post text..."
                value={contentSearch}
                onChange={(e) => setContentSearch(e.target.value)}
              />
            </div>

            {/* Flag Reason Search */}
            <div className="space-y-2">
              <Label htmlFor="reason-search" className="text-sm font-medium flex items-center gap-1">
                <Search className="h-3 w-3" />
                Search reason
              </Label>
              <Input
                id="reason-search"
                type="text"
                placeholder="Search flag reason..."
                value={flagReasonSearch}
                onChange={(e) => setFlagReasonSearch(e.target.value)}
              />
            </div>
          </div>

          {/* Active Filters Summary */}
          {(contentSearch || mediaFilter !== 'all' || flagReasonSearch) && (
            <div className="flex items-center gap-2 pt-2 border-t">
              <span className="text-sm text-muted-foreground">Active filters:</span>
              <div className="flex flex-wrap gap-2">
                {contentSearch && (
                  <Badge variant="secondary" className="text-xs">
                    Content: "{contentSearch}"
                  </Badge>
                )}
                {mediaFilter !== 'all' && (
                  <Badge variant="secondary" className="text-xs">
                    Media: {mediaFilter}
                  </Badge>
                )}
                {flagReasonSearch && (
                  <Badge variant="secondary" className="text-xs">
                    Reason: "{flagReasonSearch}"
                  </Badge>
                )}
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 px-2 text-xs"
                  onClick={() => {
                    setContentSearch('');
                    setMediaFilter('all');
                    setFlagReasonSearch('');
                  }}
                >
                  Clear all
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Results Count */}
      <div className="text-sm text-muted-foreground">
        Showing {filteredAndSortedData.length} of {flaggedData.length} flagged post{flaggedData.length === 1 ? '' : 's'}
      </div>

      {/* Empty State for No Matches */}
      {hasNoMatchingPosts && (
        <EmptyState
          icon={Search}
          message="No flagged posts match your current filters. Try adjusting your search criteria."
        />
      )}

      {/* Flagged Posts List */}
      {!hasNoMatchingPosts && (
        <div className="space-y-4">
          {filteredAndSortedData.map(([postId, status, post]) => {
            const flagReason = getFlagReason(status);

            return (
              <Card key={postId.toString()} className="border-amber-200 dark:border-amber-900">
                <CardHeader>
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <CardTitle className="text-lg flex items-center gap-2 flex-wrap">
                        <AuthorName principal={post.author} />
                        <Badge variant="outline" className="flex items-center gap-1 border-amber-500 text-amber-700 dark:text-amber-400">
                          <Flag className="h-3 w-3" />
                          Auto-flagged
                        </Badge>
                      </CardTitle>
                      <p className="text-sm text-muted-foreground mt-1">
                        {new Date(Number(post.timestamp) / 1000000).toLocaleString()}
                      </p>
                      <p className="text-sm text-amber-700 dark:text-amber-400 mt-1 font-medium">
                        Reason: {flagReason}
                      </p>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleClearFlag(postId)}
                      disabled={processingId === postId}
                    >
                      <CheckCircle className="h-4 w-4 mr-1" />
                      Clear Flag
                    </Button>
                  </div>
                </CardHeader>
                <Separator />
                <CardContent className="pt-4">
                  <p className="text-sm whitespace-pre-wrap break-words">{post.content}</p>
                  {(post.image || post.video) && (
                    <div className="mt-4 text-xs text-muted-foreground">
                      {post.image && <span>📷 Contains image</span>}
                      {post.image && post.video && <span> • </span>}
                      {post.video && <span>🎥 Contains video</span>}
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
