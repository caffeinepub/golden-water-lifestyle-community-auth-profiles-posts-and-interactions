import { Button } from '../ui/button';
import { Heart, Smile, Laugh, Frown, Angry, Loader2 } from 'lucide-react';
import { ReactionType } from '../../backend';
import { cn } from '../../lib/utils';

interface ReactionBarProps {
  selectedReaction: ReactionType | null;
  onReactionClick: (reactionType: ReactionType) => void;
  disabled?: boolean;
  isPending?: boolean;
  error?: string | null;
  size?: 'sm' | 'default';
}

const reactionConfig = [
  { type: ReactionType.like, icon: Heart, label: 'Like', color: 'text-red-500' },
  { type: ReactionType.love, icon: Heart, label: 'Love', color: 'text-pink-500' },
  { type: ReactionType.laugh, icon: Laugh, label: 'Laugh', color: 'text-yellow-500' },
  { type: ReactionType.sad, icon: Frown, label: 'Sad', color: 'text-blue-500' },
  { type: ReactionType.angry, icon: Angry, label: 'Angry', color: 'text-orange-500' },
];

export default function ReactionBar({
  selectedReaction,
  onReactionClick,
  disabled = false,
  isPending = false,
  error,
  size = 'default',
}: ReactionBarProps) {
  const iconSize = size === 'sm' ? 'h-3 w-3' : 'h-4 w-4';
  const buttonSize = size === 'sm' ? 'sm' : 'sm';

  return (
    <div className="flex items-center gap-1">
      {reactionConfig.map(({ type, icon: Icon, label, color }) => {
        const isSelected = selectedReaction === type;
        
        return (
          <Button
            key={type}
            variant="ghost"
            size={buttonSize}
            onClick={() => onReactionClick(type)}
            disabled={disabled || isPending}
            className={cn(
              'transition-colors',
              isSelected && color,
              isSelected && 'font-semibold'
            )}
            title={label}
          >
            {isPending && isSelected ? (
              <Loader2 className={cn(iconSize, 'animate-spin')} />
            ) : (
              <Icon className={cn(iconSize, isSelected && 'fill-current')} />
            )}
          </Button>
        );
      })}
    </div>
  );
}
