// Ported from: source/packages/dashboard/src/lib/utils.ts

/**
 * Format a date to a relative time string (e.g., "2 hours ago")
 */
export function formatDistanceToNow(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffSeconds = Math.floor(diffMs / 1000);
  const diffMinutes = Math.floor(diffSeconds / 60);
  const diffHours = Math.floor(diffMinutes / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffSeconds < 60) {
    return 'just now';
  } else if (diffMinutes < 60) {
    return `${diffMinutes} ${diffMinutes === 1 ? 'minute' : 'minutes'} ago`;
  } else if (diffHours < 24) {
    return `${diffHours} ${diffHours === 1 ? 'hour' : 'hours'} ago`;
  } else if (diffDays < 7) {
    return `${diffDays} ${diffDays === 1 ? 'day' : 'days'} ago`;
  } else {
    return date.toLocaleDateString();
  }
}

/**
 * Format a date to a readable string
 */
export function formatDate(date: Date): string {
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

/**
 * Truncate a string with ellipsis
 */
export function truncate(str: string, length: number): string {
  if (str.length <= length) return str;
  return str.substring(0, length) + '...';
}

/**
 * Generate a unique tracking ID
 */
export function generateTrackingId(): string {
  const timestamp = Date.now().toString(36);
  const randomBytes = new Uint8Array(8);
  crypto.getRandomValues(randomBytes);
  const randomHex = Array.from(randomBytes)
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
  return `${timestamp}-${randomHex}`;
}

/**
 * Sign a tracking URL with HMAC-SHA256
 */
export async function signTrackingUrl(trackingId: string, secret: string): Promise<string> {
  const encoder = new TextEncoder();
  const keyData = encoder.encode(secret);
  const key = await crypto.subtle.importKey(
    'raw',
    keyData,
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  const signature = await crypto.subtle.sign('HMAC', key, encoder.encode(trackingId));
  const hashArray = Array.from(new Uint8Array(signature));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('').substring(0, 16);
}

/**
 * Verify a tracking signature
 */
export async function verifyTrackingSignature(
  trackingId: string,
  signature: string,
  secret: string
): Promise<boolean> {
  const expectedSignature = await signTrackingUrl(trackingId, secret);
  return signature === expectedSignature;
}

/**
 * Parse device info from user agent
 */
export function parseDeviceInfo(userAgent: string | null): Record<string, unknown> | null {
  if (!userAgent) return null;

  const ua = userAgent.toLowerCase();

  return {
    browser: ua.includes('chrome') ? 'Chrome' :
             ua.includes('firefox') ? 'Firefox' :
             ua.includes('safari') ? 'Safari' :
             ua.includes('edge') ? 'Edge' : 'Unknown',
    os: ua.includes('windows') ? 'Windows' :
        ua.includes('mac') ? 'macOS' :
        ua.includes('linux') ? 'Linux' :
        ua.includes('android') ? 'Android' :
        ua.includes('iphone') || ua.includes('ipad') ? 'iOS' : 'Unknown',
    isMobile: ua.includes('mobile') || ua.includes('android') || ua.includes('iphone'),
  };
}

/**
 * Anonymize IP address (truncate to /24 for IPv4)
 */
export function anonymizeIp(ip: string | null): string | null {
  if (!ip) return null;

  // IPv4
  if (ip.includes('.')) {
    const parts = ip.split('.');
    if (parts.length === 4) {
      return `${parts[0]}.${parts[1]}.${parts[2]}.0`;
    }
  }

  return ip;
}
