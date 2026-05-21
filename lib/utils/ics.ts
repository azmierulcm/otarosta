import type { DutyEvent } from '@/lib/types';

function toICSDateTime(date: string, time: string): string {
  // date: YYYY-MM-DD, time: HH:MM → 20260501T063000
  const d = date.replace(/-/g, '');
  const t = time.replace(':', '') + '00';
  return `${d}T${t}`;
}

export function generateICS(events: DutyEvent[], crewName: string, month: string, year: string): string {
  const calName = `${crewName} · ${month} ${year} Roster`;
  const vevents: string[] = [];

  for (const event of events) {
    if (event.type === 'FLIGHT' && event.date && event.std && event.sta && event.depPort && event.arrPort) {
      const descParts: string[] = [];
      if (event.signOn) descParts.push(`Sign on: ${event.signOn}`);
      if (event.signOff) descParts.push(`Sign off: ${event.signOff}`);
      vevents.push([
        'BEGIN:VEVENT',
        `UID:${event.id}@otarosta.app`,
        `DTSTART;TZID=Asia/Kuala_Lumpur:${toICSDateTime(event.date, event.std)}`,
        `DTEND;TZID=Asia/Kuala_Lumpur:${toICSDateTime(event.date, event.sta)}`,
        `SUMMARY:${event.flightNumber ?? 'Flight'} ${event.depPort}→${event.arrPort}`,
        ...(descParts.length ? [`DESCRIPTION:${descParts.join('\\n')}`] : []),
        `LOCATION:${event.depPort}`,
        'CATEGORIES:FLIGHT',
        'END:VEVENT',
      ].join('\r\n'));
    }
    if (event.type === 'STANDBY' && event.date) {
      const on = event.signOn ?? '08:00';
      const off = event.signOff ?? '16:00';
      vevents.push([
        'BEGIN:VEVENT',
        `UID:${event.id}@otarosta.app`,
        `DTSTART;TZID=Asia/Kuala_Lumpur:${toICSDateTime(event.date, on)}`,
        `DTEND;TZID=Asia/Kuala_Lumpur:${toICSDateTime(event.date, off)}`,
        `SUMMARY:${event.description ?? 'Standby'}`,
        'CATEGORIES:STANDBY',
        'END:VEVENT',
      ].join('\r\n'));
    }
  }

  return [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Otarosta//Crew Roster//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    `X-WR-CALNAME:${calName}`,
    'X-WR-TIMEZONE:Asia/Kuala_Lumpur',
    ...vevents,
    'END:VCALENDAR',
  ].join('\r\n');
}
