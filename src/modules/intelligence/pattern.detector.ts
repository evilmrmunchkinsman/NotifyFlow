import prisma from '../../lib/prisma';

// This describes what a detected problem looks like
export type FailurePattern = {
  type: 'BOUNCE_CLUSTER' | 'PROVIDER_OUTAGE' | 'RATE_LIMIT_HIT';
  severity: 'critical' | 'high' | 'medium';
  description: string;
  evidence: string[];
};

export const detectPatterns = async (workspaceId: string): Promise<FailurePattern[]> => {
  
  // This is the list we'll add problems to and return at the end
  const patterns: FailurePattern[] = [];

  // Helper: get a date from X minutes ago
  const minutesAgo = (mins: number) => new Date(Date.now() - mins * 60 * 1000);

  // ── RULE 1: BOUNCE CLUSTER ──────────────────────────────────────────────
  // Problem: Too many emails bouncing from the same domain (e.g. gmail.com)
  // This usually means your email list has bad/old addresses
  // Trigger: more than 20 bounces from one domain in the last 60 minutes

  // Step 1: Get all bounced events, grouped by recipient domain
  const bouncedByDomain = await prisma.deliveryEvent.groupBy({
    by: ['recipientDomain'],
    where: {
      notification: { workspaceId },  // only this workspace
      status: 'bounced',              // only bounced events
      createdAt: { gte: minutesAgo(60) }, // in the last hour
      recipientDomain: { not: null }, // ignore events with no domain
    },
    _count: {
      recipientDomain: true, // count how many bounces per domain
    },
  });

  // Step 2: Check if any domain crossed our threshold
  for (const row of bouncedByDomain) {
    const bounceCount = row._count.recipientDomain;
    const domain = row.recipientDomain;

    if (bounceCount > 20) {
      patterns.push({
        type: 'BOUNCE_CLUSTER',
        severity: 'critical',
        description: `High bounce rate detected for domain: ${domain}`,
        evidence: [
          `${bounceCount} bounces from ${domain} in the last hour`,
          'Likely cause: stale or invalid email addresses',
        ],
      });
    }
  }

  // ── RULE 2: PROVIDER OUTAGE ─────────────────────────────────────────────
  // Problem: More than half of recent messages on a channel are failing
  // This usually means the provider (Resend, Fast2SMS) is having issues
  // Trigger: >50% failure rate on email or sms in the last 15 minutes

  // Step 1: Get a count of events grouped by channel AND status
  // e.g. { channel: 'email', status: 'sent', count: 40 }
  //      { channel: 'email', status: 'failed', count: 30 }
  const recentByChannelAndStatus = await prisma.deliveryEvent.groupBy({
    by: ['channel', 'status'],
    where: {
      notification: { workspaceId },
      createdAt: { gte: minutesAgo(15) }, // last 15 minutes only
      channel: { not: null },
    },
    _count: { id: true },
  });

  // Step 2: Combine the counts into a simple object per channel
  // channelStats['email'] = { total: 70, failed: 30 }
  const channelStats: Record<string, { total: number; failed: number }> = {};

  for (const row of recentByChannelAndStatus) {
    const ch = row.channel as string;

    // Create entry for this channel if it doesn't exist yet
    if (!channelStats[ch]) {
      channelStats[ch] = { total: 0, failed: 0 };
    }

    // Add to total count for this channel
    channelStats[ch]!.total += row._count.id;

    // If this row is for failed events, add to failed count too
    if (row.status === 'failed') {
      channelStats[ch]!.failed += row._count.id;
    }
  }

  // Step 3: Check each channel's failure rate
  for (const [channel, stats] of Object.entries(channelStats)) {
    
    // Need at least 10 events to avoid false alarms on low volume
    if (stats.total < 10) continue;

    const failureRate = stats.failed / stats.total;

    if (failureRate > 0.5) {
      patterns.push({
        type: 'PROVIDER_OUTAGE',
        severity: 'critical',
        description: `Provider outage detected on ${channel} channel`,
        evidence: [
          `${stats.failed} out of ${stats.total} messages failed in the last 15 minutes`,
          `Failure rate: ${Math.round(failureRate * 100)}%`,
        ],
      });
    }
  }

  // ── RULE 3: RATE LIMIT HIT ──────────────────────────────────────────────
  // Problem: Provider is rejecting requests because we're sending too fast
  // Providers return error code 429 when this happens
  // Trigger: any 429 errors in the last hour

  const rateLimitErrorCount = await prisma.deliveryEvent.count({
    where: {
      notification: { workspaceId },
      errorCode: '429',
      createdAt: { gte: minutesAgo(60) },
    },
  });

  if (rateLimitErrorCount > 0) {
    patterns.push({
      type: 'RATE_LIMIT_HIT',
      severity: 'high',
      description: 'API rate limit hit with notification provider',
      evidence: [
        `${rateLimitErrorCount} rate limit errors in the last hour`,
        'Sending has likely been throttled — slow down request rate',
      ],
    });
  }

  // Return all detected patterns (empty array if everything is healthy)
  return patterns;
};