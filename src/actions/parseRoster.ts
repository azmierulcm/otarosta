'use server';

import { getDocumentProxy, extractText } from 'unpdf';
import { RosterData, DutyEvent } from '@/types';

export async function parseRoster(formData: FormData): Promise<RosterData> {
  const file = formData.get('file') as File;
  if (!file) throw new Error('No file uploaded');

  const arrayBuffer = await file.arrayBuffer();
  const buffer = new Uint8Array(arrayBuffer);
  
  try {
    const pdf = await getDocumentProxy(buffer);
    const { text } = await extractText(pdf, { mergePages: true });
    return parseRawText(text);
  } catch (err: any) {
    console.error('PDF Parse Error:', err);
    throw new Error(err.message || 'Could not read PDF roster.');
  }
}

function parseRawText(text: string): RosterData {
  const events: DutyEvent[] = [];
  
  // 1. Identify all Date Markers (e.g., 06-MAY-2026)
  const dateRegex = /(\d{2})-([A-Z]{3})-(\d{4})/gi;
  const matches = Array.from(text.matchAll(dateRegex));
  
  if (matches.length === 0) {
    throw new Error('No dates found in the roster. Please ensure this is a text-based Malaysia Airlines PDF.');
  }

  const months: Record<string, string> = {
    'JAN': '01', 'FEB': '02', 'MAR': '03', 'APR': '04', 'MAY': '05', 'JUN': '06',
    'JUL': '07', 'AUG': '08', 'SEP': '09', 'OCT': '10', 'NOV': '11', 'DEC': '12'
  };

  // 2. Extract chunks between dates
  for (let i = 0; i < matches.length; i++) {
    const match = matches[i];
    const day = match[1];
    const monthStr = match[2].toUpperCase();
    const year = match[3];
    const currentDate = `${year}-${months[monthStr] || '01'}-${day}`;

    // Get text from this date to the next date
    const startIdx = match.index! + match[0].length;
    const endIdx = matches[i + 1] ? matches[i + 1].index : text.length;
    const chunk = text.substring(startIdx, endIdx);

    // 3. Extract Flights within this chunk (MH \d+)
    const flightRegex = /MH\s*(\d+)/gi;
    const flightMatches = Array.from(chunk.matchAll(flightRegex));

    flightMatches.forEach((fMatch, fIdx) => {
      const flightNo = fMatch[1];
      const flightChunk = chunk.substring(fMatch.index!);
      
      const times = flightChunk.match(/\d{2}:\d{2}/g) || [];
      const ports = flightChunk.match(/\b[A-Z]{3}\b/g) || [];

      // We need to be smart about matching times/ports to this specific flight
      // Each flight usually has SignOn, STD, STA, SignOff (4 times) and Dep, Arr (2 ports)
      // Sometimes it's a multi-sector day, so we take the "next" relevant values
      
      const event: DutyEvent = {
        id: `MH${flightNo}-${currentDate}-${fIdx}`,
        type: 'FLIGHT',
        date: currentDate,
        flightNumber: `MH ${flightNo}`,
      };

      if (times.length >= 2 && ports.length >= 2) {
        // Basic heuristic: 
        // If first sector: [SignOn, STD, STA, SignOff]
        // If sub-sector: [STD, STA, SignOff]
        if (fIdx === 0 && times.length >= 4) {
          event.signOn = times[0];
          event.depPort = ports[0];
          event.std = times[1];
          event.arrPort = ports[1];
          event.sta = times[2];
          event.signOff = times[3];
        } else {
          event.depPort = ports[0];
          event.std = times[0];
          event.arrPort = ports[1];
          event.sta = times[1];
          event.signOff = times[2] || times[1];
        }
      } else if (times.length >= 1 && ports.length >= 1) {
          // Partial sector (long haul)
          event.signOn = times[0];
          event.depPort = ports[0];
          event.std = times[1] || times[0];
      }

      events.push(event);
    });

    // 4. Extract Standbys within this chunk (S\d+-\d+)
    const standbyRegex = /(S\d+-\d+)/gi;
    const standbyMatches = Array.from(chunk.matchAll(standbyRegex));

    standbyMatches.forEach((sMatch) => {
      const code = sMatch[1];
      const sChunk = chunk.substring(sMatch.index!);
      const times = sChunk.match(/\d{2}:\d{2}/g) || [];
      
      events.push({
        id: `${code}-${currentDate}`,
        type: 'STANDBY',
        date: currentDate,
        signOn: times[0] || '--:--',
        signOff: times[times.length - 1] || '--:--',
        description: code.toUpperCase(),
      });
    });

    // 5. Special case: Long haul arrival on the "next" day
    // If the last event of the previous day was a flight with no arrival port
    const lastEvent = events[events.length - 1];
    if (lastEvent && lastEvent.type === 'FLIGHT' && !lastEvent.arrPort) {
        const ports = chunk.match(/\b[A-Z]{3}\b/g) || [];
        const times = chunk.match(/\d{2}:\d{2}/g) || [];
        if (ports.length >= 1 && times.length >= 2) {
          lastEvent.arrPort = ports[0];
          lastEvent.sta = times[0];
          lastEvent.signOff = times[1];
        }
    }
  }

  // Filter out duplicates and sort
  const uniqueEvents = Array.from(new Map(events.map(e => [e.id, e])).values());
  const sortedEvents = uniqueEvents.sort((a, b) => {
    const timeA = a.signOn || a.std || '00:00';
    const timeB = b.signOn || b.std || '00:00';
    return new Date(`${a.date}T${timeA}`).getTime() - new Date(`${b.date}T${timeB}`).getTime();
  });

  return { 
    events: sortedEvents, 
    month: matches[0][2], 
    year: matches[0][3] 
  };
}
