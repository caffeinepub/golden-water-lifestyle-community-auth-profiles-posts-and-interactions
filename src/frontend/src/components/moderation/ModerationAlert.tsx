import { AlertTriangle } from 'lucide-react';
import { Alert, AlertDescription } from '../ui/alert';

interface ModerationAlertProps {
  message: string;
  className?: string;
}

/**
 * Displays moderation-related alerts with consistent styling
 * Uses warm amber/red semantics to indicate blocked content
 */
export default function ModerationAlert({ message, className = '' }: ModerationAlertProps) {
  return (
    <Alert className={`moderation-alert ${className}`}>
      <AlertTriangle className="h-4 w-4" />
      <AlertDescription className="font-medium">
        {message}
      </AlertDescription>
    </Alert>
  );
}
