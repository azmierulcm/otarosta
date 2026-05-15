import React from 'react';
import { useRoster } from '@/lib/contexts/RosterContext';
import { motion } from 'framer-motion';
import { Plane } from 'lucide-react';

const DutyCalendar = () => {
  const { roster } = useRoster();
  if (!roster) return null;

  const eventsByDate = roster.events.reduce((acc, event) => {
    acc[event.date] = event;
    return acc;
  }, {} as Record<string, any>);

  // Determine month/year
  const [firstEvent] = roster.events;
  const dateObj = new Date(firstEvent?.date || `${roster.year}-${roster.month}-01`);
  const year = dateObj.getFullYear();
  const month = dateObj.getMonth();

  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDayOfMonth = new Date(year, month, 1).getDay();

  const days = Array.from({ length: daysInMonth }, (_, i) => {
    const d = (i + 1).toString().padStart(2, '0');
    const m = (month + 1).toString().padStart(2, '0');
    const dateStr = `${year}-${m}-${d}`;
    return {
      date: dateStr,
      dayNum: i + 1,
      event: eventsByDate[dateStr]
    };
  });

  const calendarPadding = Array.from({ length: firstDayOfMonth }, (_, i) => i);

  return (
    <div className="bg-bg rounded-[2rem] p-8 shadow-xl border border-border">
      <div className="flex items-center justify-between mb-8">
        <h3 className="text-xl font-bold text-text">Duty Calendar</h3>
        <div className="flex items-center gap-4 text-xs font-bold uppercase tracking-wider text-text-subtle">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-accent/10 border border-accent/20" />
            Duty
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-surface border border-border" />
            Off
          </div>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-2">
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
          <div key={d} className="text-center text-[10px] font-bold text-text-subtle uppercase py-2">
            {d}
          </div>
        ))}
        
        {calendarPadding.map(i => <div key={`pad-${i}`} />)}

        {days.map(day => (
          <motion.div
            key={day.date}
            whileHover={{ scale: 1.05 }}
            className={`
              aspect-square rounded-2xl flex flex-col items-center justify-center relative cursor-pointer
              transition-all duration-200
              ${day.event 
                ? 'bg-accent/5 border-2 border-accent/20 text-accent' 
                : 'bg-bg border border-border text-text-subtle hover:border-gray-300'}
            `}
          >
            <span className="text-sm font-bold">{day.dayNum}</span>
            {day.event && (
              <div className="absolute bottom-2">
                <div className="w-1 h-1 rounded-full bg-accent" />
              </div>
            )}
          </motion.div>
        ))}
      </div>
    </div>
  );
};

export default DutyCalendar;
