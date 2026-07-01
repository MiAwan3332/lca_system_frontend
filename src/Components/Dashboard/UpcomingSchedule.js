import React from "react";
import { CalendarClock, ClipboardList, BrainCircuit, Presentation } from "lucide-react";
import moment from "moment";

const EVENT_META = {
  class: { icon: CalendarClock, accent: "border-l-[#82B4FF]" },
  assignment: { icon: ClipboardList, accent: "border-l-[#FF8A8A]" },
  quiz: { icon: BrainCircuit, accent: "border-l-[#FFCB82]" },
  event: { icon: Presentation, accent: "border-l-[#7AEF85]" },
};

function formatEventDate(date) {
  if (!date) return "TBD";
  return moment(date).format("MMM D, h:mm A");
}

function UpcomingSchedule({ events = [], loading = false }) {
  return (
    <div className="dash-surface-card p-5 h-full">
      <div className="mb-4">
        <h3 className="text-lg font-semibold dash-text">Upcoming Schedule</h3>
        <p className="text-sm dash-text-muted">Classes, deadlines, and events</p>
      </div>

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-16 bg-gray-200 dark:bg-slate-600 rounded-xl animate-pulse" />
          ))}
        </div>
      ) : events.length === 0 ? (
        <div className="py-10 text-center dash-text-muted text-sm">
          No upcoming events scheduled
        </div>
      ) : (
        <div className="relative pl-4 border-l-2 border-[var(--dash-border)] space-y-4 max-h-[360px] overflow-y-auto">
          {events.map((event, index) => {
            const meta = EVENT_META[event.type] || EVENT_META.event;
            const Icon = meta.icon;
            return (
              <div
                key={event.id || index}
                className={`relative pl-4 py-3 pr-3 rounded-xl dash-surface-subtle border border-[var(--dash-border)] border-l-4 ${meta.accent}`}
              >
                <span className="absolute -left-[9px] top-4 w-3 h-3 rounded-full bg-[#FFCB82] ring-4 ring-[var(--dash-surface)]" />
                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-lg bg-[#d69e2e]/30 shrink-0">
                    <Icon size={16} className="text-[var(--dash-icon)]" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold dash-text line-clamp-1">
                      {event.title}
                    </p>
                    {event.subtitle && (
                      <p className="text-xs dash-text-muted mt-0.5">
                        {event.subtitle}
                      </p>
                    )}
                    <p className="text-xs font-medium dash-text-accent mt-1">
                      {formatEventDate(event.date)}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default UpcomingSchedule;
