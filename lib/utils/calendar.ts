import { RosterData, DutyEvent } from '@/lib/types';

/** Format a date+time as ICS DTSTART/DTEND string: 20260502T083000 */
function toICSDateTime(year: number, month: number, day: number, h: number, m: number): string {
  return (
    String(year) +
    String(month).padStart(2, '0') +
    String(day).padStart(2, '0') +
    'T' +
    String(h).padStart(2, '0') +
    String(m).padStart(2, '0') +
    '00'
  );
}

/** Format a date as all-day ICS date: 20260502 */
function toICSDate(year: number, month: number, day: number): string {
  return String(year) + String(month).padStart(2, '0') + String(day).padStart(2, '0');
}

/** Parse "HH:MM" safely, returns { h, m } defaulting to 0. */
function parseTime(timeStr?: string): { h: number; m: number } {
  if (!timeStr) return { h: 0, m: 0 };
  const parts = timeStr.split(':').map((p) => parseInt(p, 10));
  return {
    h: isNaN(parts[0]) ? 0 : parts[0],
    m: isNaN(parts[1]) ? 0 : parts[1],
  };
}

/** Escape ICS text values (commas, semicolons, backslashes, newlines). */
function icsEscape(str: string): string {
  return str
    .replace(/\\/g, '\\\\')
    .replace(/;/g, '\\;')
    .replace(/,/g, '\\,')
    .replace(/\n/g, '\\n');
}

/** Unique ID for each event */
function uid(event: DutyEvent): string {
  return `otarosta-${event.date}-${event.id ?? Math.random().toString(36).slice(2)}@otarosta.app`;
}

function buildSummary(event: DutyEvent): string {
  switch (event.type) {
    case 'FLIGHT':
      return [
        event.flightNumber,
        event.depPort && event.arrPort ? `(${event.depPort}-${event.arrPort})` : null,
      ].filter(Boolean).join(' ') || 'Flight';
    case 'LAYOVER':
      return event.hotel ? `Layover - ${event.hotel}` : `Layover${event.arrPort ? ` (${event.arrPort})` : ''}`;
    case 'STANDBY':
      return `Standby${event.description ? ` - ${event.description}` : ''}`;
    case 'OFF':
      return 'Day Off';
    default:
      return event.description || 'Duty';
  }
}

function buildDescription(event: DutyEvent): string {
  const lines: string[] = [];
  if (event.flightNumber) lines.push(`Flight: ${event.flightNumber}`);
  if (event.depPort && event.arrPort) lines.push(`Route: ${event.depPort} to ${event.arrPort}`);
  if (event.std) lines.push(`STD: ${event.std}`);
  if (event.sta) lines.push(`STA: ${event.sta}`);
  if (event.signOn) lines.push(`Sign-on: ${event.signOn}`);
  if (event.signOff) lines.push(`Sign-off: ${event.signOff}`);
  if (event.hotel) lines.push(`Hotel: ${event.hotel}`);
  if (event.description && event.type !== 'FLIGHT') lines.push(event.description);
  return lines.join('\\n');
}

function buildVEvent(event: DutyEvent): string {
  const dateParts = event.date.split('-').map(Number);
  const year = dateParts[0] ?? new Date().getFullYear();
  const month = dateParts[1] ?? 1;
  const day = dateParts[2] ?? 1;

  const startTimeStr = event.signOn || event.std;
  const endTimeStr = event.signOff || event.sta;

  let dtStart: string;
  let dtEnd: string;

  if (!startTimeStr && !endTimeStr) {
    // All-day event
    dtStart = `DTSTART;VALUE=DATE:${toICSDate(year, month, day)}`;
    dtEnd   = `DTEND;VALUE=DATE:${toICSDate(year, month, day)}`;
  } else {
    const { h: sH, m: sM } = parseTime(startTimeStr);
    const { h: eH, m: eM } = parseTime(endTimeStr || '23:59');

    // Handle midnight crossover
    let eYear = year, eMonth = month, eDay = day;
    if ((eH * 60 + eM) > 0 && (eH * 60 + eM) < (sH * 60 + sM)) {
      const d = new Date(year, month - 1, day);
      d.setDate(d.getDate() + 1);
      eYear = d.getFullYear();
      eMonth = d.getMonth() + 1;
      eDay = d.getDate();
    }

    dtStart = `DTSTART:${toICSDateTime(year, month, day, sH, sM)}`;
    dtEnd   = `DTEND:${toICSDateTime(eYear, eMonth, eDay, eH, eM)}`;
  }

  const summary     = icsEscape(buildSummary(event));
  const description = buildDescription(event); // already escaped inline
  const location    = event.arrPort ?? event.hotel ?? '';

  const lines = [
    'BEGIN:VEVENT',
    `UID:${uid(event)}`,
    dtStart,
    dtEnd,
    `SUMMARY:${summary}`,
    description ? `DESCRIPTION:${description}` : null,
    location ? `LOCATION:${icsEscape(location)}` : null,
    'STATUS:CONFIRMED',
    event.type === 'OFF' ? 'TRANSP:TRANSPARENT' : 'TRANSP:OPAQUE',
    'END:VEVENT',
  ].filter(Boolean) as string[];

  return lines.join('\r\n');
}

export function generateICS(roster: RosterData): string | null {
  if (!roster.events || roster.events.length === 0) return null;

  // Skip OFF days — they clutter the calendar
  const events = roster.events.filter((e) => e.type !== 'OFF');
  if (events.length === 0) return null;

  const vEvents = events.map(buildVEvent).join('\r\n');

  const calendar = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'CALSCALE:GREGORIAN',
    'PRODID:-//Otarosta//Roster//EN',
    'METHOD:PUBLISH',
    'X-WR-CALNAME:Otarosta Roster',
    `X-WR-CALDESC:${roster.month} ${roster.year} roster`,
    vEvents,
    'END:VCALENDAR',
  ].join('\r\n');

  return calendar;
}

export function downloadICS(content: string, filename: string) {
  const blob = new Blob([content], { type: 'text/calendar;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  setTimeout(() => {
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }, 100);
}
