<script lang="ts">
  import reports from '#lib/data/reports-4471.json';
  import notes from '#lib/data/desk-notes.json';
  import type { Report } from '#lib/kb/causes';
  import { tenantOf } from '#lib/kb/locales';
  import { splitTicket, TICKET_REPO, TICKETS } from '#lib/kb/split';

  let { ticket }: { ticket: number } = $props();

  const split = $derived(splitTicket(reports as Report[], ticket, tenantOf, notes.oneDayMove));
</script>

<p class="sum">
  <strong>{split.merged}</strong> reports merged into #{ticket} ({split.rows} export rows; the pages overlap) ·
  <strong>{split.groups.length}</strong>
  {split.groups.length === 1 ? 'cause' : 'causes'} · counted as the desk's view counts them
</p>

<table>
  <thead>
    <tr><th>cause</th><th>reports</th><th>tenants</th><th>seen</th><th>ticket</th></tr>
  </thead>
  <tbody>
    {#each split.groups as g (g.cause)}
      <tr class:wrong={g.ticket === null}>
        <td><code>{g.cause}</code></td>
        <td>{g.reports}{#if g.filedUnder}<sup>*</sup>{/if}</td>
        <td>{g.tenants}</td>
        <td>{g.firstSeen} → {g.lastSeen}</td>
        <td>
          {#if g.ticket !== null}
            <a href="{TICKET_REPO}/issues/{g.ticket}">#{g.ticket}</a> {TICKETS[g.cause as keyof typeof TICKETS].title}
          {:else}
            no cause found: read these by hand
          {/if}
        </td>
      </tr>
    {/each}
  </tbody>
</table>

{#each split.groups.filter((g) => g.filedUnder) as g (g.cause)}
  <p class="note">* The {g.reports} <code>{g.cause}</code> reports are also counted under <code>{g.filedUnder}</code>, where the desk files them by tenant.</p>
{/each}

<style>
  .sum { font-size: 1.1rem; }
  .note { color: var(--muted); font-size: 0.85em; }
  .wrong td { background: var(--warn-bg); color: var(--warn); }
</style>
