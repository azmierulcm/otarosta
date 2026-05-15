'use server';

import { getDocumentProxy, extractText } from 'unpdf';
import { parseRosterText } from '@/lib/parser';
import { RosterData, DutyEvent } from '@/lib/types';

export async function parseRoster(formData: FormData): Promise<RosterData> {
  const file = formData.get('file') as File;
  if (!file) throw new Error('No file uploaded');

  const arrayBuffer = await file.arrayBuffer();
  const buffer = new Uint8Array(arrayBuffer);
  
  try {
    const pdf = await getDocumentProxy(buffer);
    const { text } = await extractText(pdf, { mergePages: true });
    
    const parsed = parseRosterText(text);
    
    // Map ParsedRoster to RosterData (legacy support during transition)
    const events: DutyEvent[] = parsed.duties.map(d => ({
      id: d.id,
      type: d.type as any,
      date: d.date,
      flightNumber: d.flight?.flightNumber,
      depPort: d.flight?.depPort,
      arrPort: d.flight?.arrPort,
      std: d.flight?.std,
      sta: d.flight?.sta,
      signOn: d.signOn || d.flight?.signOn,
      signOff: d.signOff || d.flight?.signOff,
      hotel: d.flight?.hotel,
      description: d.description,
    }));

    return {
      events,
      month: parsed.month,
      year: parsed.year,
      crewName: parsed.crewName,
    };
  } catch (err: any) {
    console.error('PDF Parse Error:', err);
    throw new Error(err.message || 'Could not read PDF roster.');
  }
}
