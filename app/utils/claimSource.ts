import { ClaimSource } from '@/types/types';

export function getIconAndName(claimSrc: ClaimSource) {
  switch (claimSrc) {
    case ClaimSource.FACEBOOK:
      return { icon: '/fb.png', name: 'Facebook' };
    case ClaimSource.X:
      return { icon: '/x.png', name: 'X' };
    case ClaimSource.TIKTOK:
      return { icon: '/fb.png', name: 'TikTok' };
    default:
      return { icon: '', name: 'unknown source' };
  }
}
