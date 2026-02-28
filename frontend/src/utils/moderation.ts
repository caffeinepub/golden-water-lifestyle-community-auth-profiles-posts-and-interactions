/**
 * Moderation utility functions for detecting and handling content moderation messages
 */

const MODERATION_BLOCK_PREFIX = 'Upload blocked:';

/**
 * Checks if an error message is a moderation block message from the backend
 */
export function isModerationBlock(errorMessage: string): boolean {
  return errorMessage.startsWith(MODERATION_BLOCK_PREFIX);
}

/**
 * Extracts the user-facing moderation message from a backend error
 * Returns the full message if it's a moderation block, otherwise returns the original message
 */
export function normalizeModerationMessage(error: any): string {
  if (typeof error === 'string') {
    return error;
  }
  
  if (error?.message) {
    const message = error.message;
    
    // Extract trap messages (backend Runtime.trap calls)
    if (message.includes('trap')) {
      const trapMatch = message.match(/trap[^:]*:\s*(.+?)(?:\n|$)/i);
      if (trapMatch) {
        return trapMatch[1].trim();
      }
    }
    
    return message;
  }
  
  return 'An unexpected error occurred. Please try again.';
}

/**
 * Categorizes an error message to determine its type
 */
export function categorizeError(errorMessage: string): 'moderation' | 'image' | 'video' | 'general' {
  if (isModerationBlock(errorMessage)) {
    return 'moderation';
  }
  
  const lowerMessage = errorMessage.toLowerCase();
  
  if (lowerMessage.includes('video')) {
    return 'video';
  }
  
  if (lowerMessage.includes('image') || 
      lowerMessage.includes('size') ||
      lowerMessage.includes('10mb') ||
      lowerMessage.includes('mb')) {
    return 'image';
  }
  
  return 'general';
}
