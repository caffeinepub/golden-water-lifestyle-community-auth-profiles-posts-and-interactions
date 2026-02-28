/**
 * Development-only performance instrumentation utilities.
 * All functions are no-ops in production builds.
 */

const isDev = import.meta.env.DEV;

interface PerformanceMark {
  name: string;
  startTime: number;
}

const marks = new Map<string, PerformanceMark>();

/**
 * Start a performance measurement
 */
export function perfMark(name: string): void {
  if (!isDev) return;
  
  marks.set(name, {
    name,
    startTime: performance.now(),
  });
}

/**
 * End a performance measurement and log the duration
 */
export function perfMeasure(name: string, label?: string): void {
  if (!isDev) return;
  
  const mark = marks.get(name);
  if (!mark) {
    console.warn(`[Perf] No mark found for: ${name}`);
    return;
  }
  
  const duration = performance.now() - mark.startTime;
  const displayLabel = label || name;
  
  console.log(`[Perf] ${displayLabel}: ${duration.toFixed(2)}ms`);
  marks.delete(name);
}

/**
 * Log a performance event without measurement
 */
export function perfLog(message: string): void {
  if (!isDev) return;
  console.log(`[Perf] ${message}`);
}

/**
 * Clear all performance marks
 */
export function perfClear(): void {
  if (!isDev) return;
  marks.clear();
}
