// Date / distance formatters
export const relativeTime = (dateStr: string): string => {
  const diff = Date.now() - new Date(dateStr).getTime();
  const days = Math.floor(diff / 86_400_000);
  if (days === 0) return 'Today';
  if (days === 1) return '1 day ago';
  return `${days} days ago`;
};

export const formatDate = (dateStr: string): string => {
  return new Date(dateStr).toLocaleDateString('en-US', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
};

export const formatDistance = (meters: number): string => {
  if (meters < 1000) return `${Math.round(meters)} m`;
  return `${(meters / 1000).toFixed(1)} km`;
};

export const computeHydrationStatus = (lastWateredAt: string | undefined, wateringPeriodDays: number): 'watered' | 'needs_water' | 'due_soon' => {
  if (!lastWateredAt) return 'needs_water';
  
  const diffTime = Date.now() - new Date(lastWateredAt).getTime();
  const diffDays = diffTime / (1000 * 60 * 60 * 24);
  
  if (diffDays > wateringPeriodDays) return 'needs_water';
  if (diffDays > wateringPeriodDays - 1) return 'due_soon';
  return 'watered';
};
