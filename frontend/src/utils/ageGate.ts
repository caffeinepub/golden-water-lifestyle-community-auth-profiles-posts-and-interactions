const AGE_GATE_KEY = 'golden-water-age-acknowledged';

export function hasAcknowledgedAge(): boolean {
  try {
    return localStorage.getItem(AGE_GATE_KEY) === 'true';
  } catch {
    return false;
  }
}

export function setAgeAcknowledged(acknowledged: boolean): void {
  try {
    if (acknowledged) {
      localStorage.setItem(AGE_GATE_KEY, 'true');
    } else {
      localStorage.removeItem(AGE_GATE_KEY);
    }
  } catch (error) {
    console.error('Failed to persist age acknowledgement:', error);
  }
}

export function clearAgeAcknowledgement(): void {
  try {
    localStorage.removeItem(AGE_GATE_KEY);
  } catch (error) {
    console.error('Failed to clear age acknowledgement:', error);
  }
}

export function isAgeGatedRoute(pathname: string): boolean {
  const gatedRoutes = ['/feed', '/profile'];
  const isPostDetail = /^\/post\/\d+$/.test(pathname);
  return gatedRoutes.includes(pathname) || isPostDetail;
}
