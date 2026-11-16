import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { getCalendarEvents } from "../services/calendarService";
import type { CalendarEvent, CalendarView, Resource, TimeSlot } from "../types/resource";
import "./Calendar.css";

const DAY_START_HOUR = 6;
const DAY_END_HOUR = 22;
const SLOT_MINUTES = 30;
const SLOT_HEIGHT_PX = 60;

function formatTime(date: Date): string {
  return date.toLocaleTimeString("ro-RO", { hour: "2-digit", minute: "2-digit", hour12: false });
}
function formatDayHeader(date: Date): string {
  return date.toLocaleDateString("ro-RO", { weekday: "short", day: "numeric" });
}
function formatMonthYear(date: Date): string {
  return date.toLocaleDateString("ro-RO", { month: "long", year: "numeric" });
}
function addDays(date: Date, days: number): Date { const r = new Date(date); r.setDate(r.getDate() + days); return r; }
function startOfDay(date: Date): Date { const r = new Date(date); r.setHours(0,0,0,0); return r; }
function startOfWeek(date: Date): Date { const r = startOfDay(date); const d = r.getDay(); const off = (d + 6) % 7; r.setDate(r.getDate() - off); return r; }
function generateTimeSlots(): TimeSlot[] {
  const slots: TimeSlot[] = [];
  for (let h = DAY_START_HOUR; h < DAY_END_HOUR; h++) { for (const m of [0, 30]) {
    const start = new Date(); start.setHours(h, m, 0, 0);
    const end = new Date(start); end.setMinutes(end.getMinutes() + SLOT_MINUTES);
    slots.push({ label: `${String(h).padStart(2,"0")}:${String(m).padStart(2,"0")}`, start, end });
  } }
  return slots;
}
function timeToSlotOffset(date: Date): number {
  const sod = startOfDay(date);
  const mins = (date.getHours() * 60 + date.getMinutes()) - (DAY_START_HOUR * 60);
  return (mins / SLOT_MINUTES) * SLOT_HEIGHT_PX;
}
function isSameDay(a: Date, b: Date): boolean { return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate(); }
function eventsOnDay(events: CalendarEvent[], day: Date): CalendarEvent[] {
  const ds = startOfDay(day); const de = new Date(ds); de.setDate(de.getDate() + 1);
  return events.filter((e) => new Date(e.startsAt) < de && new Date(e.endsAt) > ds);
}
function isTimeSlotFree(slotStart: Date, slotEnd: Date, dayEvents: CalendarEvent[]): boolean {
  return !dayEvents.some((e) => new Date(e.startsAt) < slotEnd && new Date(e.endsAt) > slotStart);
}

type CalendarProps = {
  onBook: (preset?: { resourceId: string; startsAt: string; endsAt: string }) => void;
  onSelectResource: (resourceId: string) => void;
  userRole: "user" | "manager" | "administrator";
};

export default function Calendar({ onBook, onSelectResource, userRole }: CalendarProps) {
  const [view, setView] = useState<CalendarView>("week");
  const [selectedResource, setSelectedResource] = useState<Resource | null>(null);
  const [viewDate, setViewDate] = useState(startOfWeek(new Date()));
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState<{ start: Date; end: Date; day: Date } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const timeSlots = useMemo(() => generateTimeSlots(), []);
  const isAdministratorOrManager = userRole === "administrator" || userRole === "manager";
  const viewStart = useMemo(() => {
    if (view === "day") return startOfDay(viewDate);
    if (view === "week") return startOfWeek(viewDate);
    return startOfDay(new Date(viewDate.getFullYear(), viewDate.getMonth(), 1));
  }, [view, viewDate]);
  const viewEnd = useMemo(() => {
    if (view === "day") { const e = new Date(viewStart); e.setDate(e.getDate() + 1); return e; }
    if (view === "week") { const e = new Date(viewStart); e.setDate(e.getDate() + 7); return e; }
    return new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 1);
  }, [view, viewDate, viewStart]);
  useEffect(() => {
    if (!selectedResource) { setEvents([]); return; }
    setLoading(true); setError(null);
    const controller = new AbortController();
    getCalendarEvents({ start: viewStart.toISOString(), end: viewEnd.toISOString(), resourceId: selectedResource.id }, controller.signal)
      .then((data) => { setEvents(data); setLoading(false); })
      .catch((err: unknown) => { if ((err as { name?: string }).name === "AbortError") return; setError(err instanceof Error ? err.message : "Nu am putut încărca evenimentele."); setLoading(false); });
    return () => controller.abort();
  }, [selectedResource, viewStart, viewEnd]);
  const handlePrev = useCallback(() => { setViewDate((d) => { if (view === "day") return addDays(d, -1); if (view === "week") return addDays(d, -7); return addDays(d, -30); }); }, [view]);
  const handleNext = useCallback(() => { setViewDate((d) => { if (view === "day") return addDays(d, 1); if (view === "week") return addDays(d, 7); return addDays(d, 30); }); }, [view]);
  const handleToday = useCallback(() => { setViewDate(startOfWeek(new Date())); }, []);
  const handleDayClick = useCallback((day: Date, slotIndex: number | null) => {
    if (!selectedResource) return;
    const slot = slotIndex !== null ? timeSlots[slotIndex] : null;
    const start = slot ? new Date(day.getFullYear(), day.getMonth(), day.getDate(), slot.start.getHours(), slot.start.getMinutes()) : startOfDay(day);
    const end = slot ? new Date(day.getFullYear(), day.getMonth(), day.getDate(), slot.end.getHours(), slot.end.getMinutes()) : new Date(day.getFullYear(), day.getMonth(), day.getDate() + 1);
    setSelectedSlot({ start, end, day });
    onBook({ resourceId: selectedResource.id, startsAt: start.toISOString(), endsAt: end.toISOString() });
  }, [selectedResource, timeSlots, onBook]);
  const isSelectedSlot = useCallback((day: Date, slotIndex: number | null) => {
    if (!selectedSlot) return false;
    const slotStart = slotIndex !== null ? timeSlots[slotIndex]?.start : null;
    return isSameDay(day, selectedSlot.day) && (!slotStart || slotStart.getTime() === selectedSlot.start.getTime());
  }, [selectedSlot, timeSlots]);
  const dayColumns = useMemo(() => {
    if (view === "day") return [startOfDay(viewDate)];
    if (view === "week") { const days: Date[] = []; for (let i = 0; i < 7; i++) days.push(addDays(startOfWeek(viewDate), i)); return days; }
    const days: Date[] = [];
    const first = startOfDay(new Date(viewDate.getFullYear(), viewDate.getMonth(), 1));
    const start = startOfWeek(first);
    const end = new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 0);
    let current = start; while (current <= end) { days.push(new Date(current)); current = addDays(current, 1); }
    return days;
  }, [view, viewDate]);
  const isCurrentMonth = useCallback((day: Date) => day.getMonth() === viewDate.getMonth() && day.getFullYear() === viewDate.getFullYear(), [viewDate]);
  return (
    <div className="calendar-page">
      <div className="calendar-header">
        <div className="calendar-header-left">
          <button className="icon-button" onClick={handlePrev} aria-label="Interval anterior"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M15 18l-6-6 6-6"/></svg></button>
          <h2 className="calendar-title">{view === "day" ? formatDayHeader(viewDate) : view === "week" ? `${formatDayHeader(viewStart)} – ${formatDayHeader(addDays(viewEnd, -1))}` : formatMonthYear(viewDate)}</h2>
          <button className="icon-button" onClick={handleNext} aria-label="Interval următor"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 18l6-6-6-6"/></svg></button>
          <button className="icon-button icon-button-today" onClick={handleToday}>Azi</button>
        </div>
        <div className="calendar-header-center">
          <div className="view-toggle" role="group" aria-label="Vizualizare calendar">
            {(["day", "week", "month"] as CalendarView[]).map((v) => (<button key={v} className={`view-btn ${view === v ? "active" : ""}`} onClick={() => setView(v)} aria-pressed={view === v}>{v === "day" ? "Zi" : v === "week" ? "Săptămână" : "Lună"}</button>))}
          </div>
        </div>
        <div className="calendar-header-right">
          <label className="resource-selector-label">Resursă</label>
          <select className="resource-select" value={selectedResource?.id ?? ""} onChange={(e) => {
            const id = e.target.value;
            if (!id) { setSelectedResource(null); return; }
            const resource = allResources.find((r) => r.id === id);
            if (resource) setSelectedResource(resource);
          }}>
            <option value="">Selectează o resursă</option>
          </select>
          {isAdministratorOrManager && (<button className="maintenance-btn" title="Gestionare mentenanță">⚠</button>)}
        </div>
      </div>
      {error && <div className="calendar-error">{error}</div>}
      {!selectedResource ? (<div className="calendar-empty"><p>Selectează o resursă pentru a vedea disponibilitatea.</p></div>) : (
        <>
          {view === "day" && <DayView resource={selectedResource} day={startOfDay(viewDate)} events={events} timeSlots={timeSlots} loading={loading} onDayClick={handleDayClick} isSelectedSlot={isSelectedSlot} />}
          {view === "week" && <WeekView resource={selectedResource} days={dayColumns as Date[]} events={events} timeSlots={timeSlots} loading={loading} onDayClick={handleDayClick} isSelectedSlot={isSelectedSlot} />}
          {view === "month" && <MonthView days={dayColumns as Date[]} events={events} isCurrentMonth={isCurrentMonth} onDayClick={(day) => handleDayClick(day, null)} />}
        </>
      )}
    </div>
  );
}

// Resources for the selector – populated by the parent page via a module-level callback.
let allResources: Resource[] = [];
export function setCalendarResources(resources: Resource[]) { allResources = resources; }

function DayView({
  resource,
  day,
  events,
  timeSlots,
  loading,
  onDayClick,
  isSelectedSlot,
}: {
  resource: Resource;
  day: Date;
  events: CalendarEvent[];
  timeSlots: TimeSlot[];
  loading: boolean;
  onDayClick: (day: Date, slotIndex: number | null) => void;
  isSelectedSlot: (day: Date, slotIndex: number | null) => boolean;
}) {
  const dayEvents = useMemo(() => eventsOnDay(events, day), [events, day]);
  if (loading) {
    return <div className="calendar-loading">Se încarcă evenimentele…</div>;
  }
  const totalHeight = timeSlots.length * SLOT_HEIGHT_PX;
  return (
    <div className="calendar-day-view">
      <div className="day-view-grid">
        <div className="time-axis">
          {timeSlots.map((slot) => (
            <div key={slot.label} className="time-slot-label">{slot.label}</div>
          ))}
        </div>
        <div className="day-view-body" style={{ height: `${totalHeight}px` }}>
          {timeSlots.map((slot, index) => {
            const slotStart = new Date(day.getFullYear(), day.getMonth(), day.getDate(), slot.start.getHours(), slot.start.getMinutes());
            const slotEnd = new Date(day.getFullYear(), day.getMonth(), day.getDate(), slot.end.getHours(), slot.end.getMinutes());
            const free = isTimeSlotFree(slotStart, slotEnd, dayEvents);
            const selected = isSelectedSlot(day, index);
            return (
              <div
                key={index}
                className={`free-slot ${free ? "free" : "occupied"} ${selected ? "selected" : ""}`}
                style={{ top: `${index * SLOT_HEIGHT_PX}px`, height: `${SLOT_HEIGHT_PX}px` }}
                onClick={free ? () => onDayClick(day, index) : undefined}
              />
            );
          })}
          {dayEvents.map((event) => {
            const evStart = new Date(event.startsAt);
            const evEnd = new Date(event.endsAt);
            const top = timeToSlotOffset(evStart);
            const height = Math.max(SLOT_HEIGHT_PX, ((evEnd.getTime() - evStart.getTime()) / (SLOT_MINUTES * 60000)) * SLOT_HEIGHT_PX);
            const isMaintenance = event.type === "maintenance";
            return (
              <div
                key={event.id}
                className={`calendar-event ${isMaintenance ? "event-maintenance" : "event-reservation"}`}
                style={{ top: `${top}px`, height: `${height}px` }}
                title={`${event.title} — ${formatTime(evStart)}–${formatTime(evEnd)}${event.reason ? `\n${event.reason}` : ""}`}
              >
                <div className="event-title">{event.title}</div>
                <div className="event-time">{formatTime(evStart)} – {formatTime(evEnd)}</div>
                {isMaintenance && event.reason && <div className="event-reason">{event.reason}</div>}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function WeekView({
  resource,
  days,
  events,
  timeSlots,
  loading,
  onDayClick,
  isSelectedSlot,
}: {
  resource: Resource;
  days: Date[];
  events: CalendarEvent[];
  timeSlots: TimeSlot[];
  loading: boolean;
  onDayClick: (day: Date, slotIndex: number | null) => void;
  isSelectedSlot: (day: Date, slotIndex: number | null) => boolean;
}) {
  if (loading) {
    return <div className="calendar-loading">Se încarcă evenimentele…</div>;
  }
  const totalHeight = timeSlots.length * SLOT_HEIGHT_PX;
  const eventsByDay = useMemo(() => {
    const map = new Map<string, CalendarEvent[]>();
    days.forEach((d) => { map.set(d.toDateString(), eventsOnDay(events, d)); });
    return map;
  }, [events, days]);
  return (
    <div className="calendar-week-view">
      <div className="week-view-grid">
        <div className="time-axis">
          {timeSlots.map((slot) => (
            <div key={slot.label} className="time-slot-label">{slot.label}</div>
          ))}
        </div>
        {days.map((day) => {
          const dayEvents = eventsByDay.get(day.toDateString()) || [];
          return (
            <div key={day.toDateString()} className="day-column">
              <div className="day-column-header">{formatDayHeader(day)} <span>{day.getDate()}</span></div>
              <div className="day-column-body" style={{ height: `${totalHeight}px` }}>
                {timeSlots.map((slot, index) => {
                  const slotStart = new Date(day.getFullYear(), day.getMonth(), day.getDate(), slot.start.getHours(), slot.start.getMinutes());
                  const slotEnd = new Date(day.getFullYear(), day.getMonth(), day.getDate(), slot.end.getHours(), slot.end.getMinutes());
                  const free = isTimeSlotFree(slotStart, slotEnd, dayEvents);
                  const selected = isSelectedSlot(day, index);
                  return (
                    <div
                      key={index}
                      className={`free-slot ${free ? "free" : "occupied"} ${selected ? "selected" : ""}`}
                      style={{ top: `${index * SLOT_HEIGHT_PX}px`, height: `${SLOT_HEIGHT_PX}px` }}
                      onClick={free ? () => onDayClick(day, index) : undefined}
                    />
                  );
                })}
                {dayEvents.map((event) => {
                  const evStart = new Date(event.startsAt);
                  const evEnd = new Date(event.endsAt);
                  const top = timeToSlotOffset(evStart);
                  const height = Math.max(SLOT_HEIGHT_PX, ((evEnd.getTime() - evStart.getTime()) / (SLOT_MINUTES * 60000)) * SLOT_HEIGHT_PX);
                  const isMaintenance = event.type === "maintenance";
                  return (
                    <div
                      key={event.id}
                      className={`calendar-event ${isMaintenance ? "event-maintenance" : "event-reservation"}`}
                      style={{ top: `${top}px`, height: `${height}px` }}
                      title={`${event.title} — ${formatTime(evStart)}–${formatTime(evEnd)}${event.reason ? `\n${event.reason}` : ""}`}
                    >
                      <div className="event-title">{event.title}</div>
                      <div className="event-time">{formatTime(evStart)} – {formatTime(evEnd)}</div>
                      {isMaintenance && event.reason && <div className="event-reason">{event.reason}</div>}
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
function MonthView({
  days,
  events,
  isCurrentMonth,
  onDayClick,
}: {
  days: Date[];
  events: CalendarEvent[];
  isCurrentMonth: (day: Date) => boolean;
  onDayClick: (day: Date) => void;
}) {
  const weeks = useMemo(() => {
    const result: Date[][] = [];
    let week: Date[] = [];
    days.forEach((day, i) => {
      week.push(day);
      if (week.length === 7 || i === days.length - 1) { result.push(week); week = []; }
    });
    return result;
  }, [days]);
  return (
    <div className="calendar-month-view">
      <div className="month-grid">
        {["Lun", "Mar", "Mie", "Joi", "Vin", "Sâm", "Dum"].map((label, i) => (
          <div key={i} className="month-weekday">{label}</div>
        ))}
        {weeks.map((week, wi) => (
          <div key={wi} className="month-week">
            {week.map((day) => {
              const dayEvents = eventsOnDay(events, day);
              const today = isSameDay(day, new Date());
              const current = isCurrentMonth(day);
              return (
                <div
                  key={day.toDateString()}
                  className={`month-cell ${!current ? "other-month" : ""} ${today ? "today" : ""} ${dayEvents.length > 0 ? "has-events" : ""}`}
                  onClick={() => onDayClick(day)}
                >
                  <span className="month-day-number">{day.getDate()}</span>
                  {dayEvents.map((e) => (
                    <span key={e.id} className={`month-event-dot ${e.type === "maintenance" ? "event-maintenance" : "event-reservation"}`} />
                  ))}
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}


