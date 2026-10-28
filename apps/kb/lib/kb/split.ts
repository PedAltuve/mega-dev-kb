// #4471 split by cause, one ticket each. Builds on causes.ts and adds the cause it cannot see:
// a booking that moves by one day is not a day/month swap, whatever the tenant.
import { causeOf, groupByCause, uniqueById, type Report, type Tenant } from '#lib/kb/causes';

export type SplitCause = 'parser' | 'hint' | 'one-day' | 'unplaced';

export const TICKET_REPO = 'https://github.com/PedAltuve/mega-dev-kb';

// Where each cause is tracked now. `unplaced` has no ticket: it means a report we cannot place.
export const TICKETS: Record<Exclude<SplitCause, 'unplaced'>, { number: number; title: string }> = {
  parser: { number: 1, title: 'Shared date parser reads day-first dates month first' },
  hint: { number: 2, title: 'booking-v3 form hint says MM/DD/YYYY but the form reads day first' },
  'one-day': { number: 3, title: 'Bookings move by one day, not a day/month swap' },
};

export type SplitGroup = {
  cause: SplitCause;
  reports: number;
  tenants: number;
  firstSeen: string;
  lastSeen: string;
  ticket: number | null;
  // For one-day: the desk's view files these under another cause, by tenant. Counted there too.
  filedUnder?: string;
};

// Counts as the desk's own view counts them (groupByCause in causes.ts): each report under the cause
// of its tenant and channel. The one-day moves stay counted where the desk files them, and also get
// a row of their own, because they are a different bug with their own ticket.
export function splitTicket(
  all: Report[],
  ticket: number,
  tenantOf: (r: Report) => Tenant | undefined,
  oneDayMove: readonly string[],
): { rows: number; merged: number; groups: SplitGroup[] } {
  const merged = uniqueById(all).filter((r) => r.mergedInto === ticket);
  const summary = (cause: SplitCause, rs: Report[]): SplitGroup => {
    const days = rs.map((r) => r.receivedAt.slice(0, 10)).sort();
    return {
      cause,
      reports: rs.length,
      tenants: new Set(rs.map((r) => r.tenant)).size,
      firstSeen: days[0],
      lastSeen: days[days.length - 1],
      ticket: cause === 'unplaced' ? null : TICKETS[cause].number,
    };
  };
  const groups = groupByCause(merged, tenantOf).map((g) => summary(g.cause, g.reports));
  const moved = merged.filter((r) => oneDayMove.includes(r.id));
  if (moved.length) {
    const under = [...new Set(moved.map((r) => causeOf(r, tenantOf(r)) ?? 'unplaced'))].join(', ');
    groups.push({ ...summary('one-day', moved), filedUnder: under });
  }
  return { rows: all.filter((r) => r.mergedInto === ticket).length, merged: merged.length, groups };
}
