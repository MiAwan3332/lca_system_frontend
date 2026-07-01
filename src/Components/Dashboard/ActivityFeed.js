import React from "react";
import {
  GraduationCap,
  ClipboardList,
  BrainCircuit,
  UserRoundCheck,
  Bell,
  Clock,
} from "lucide-react";
import moment from "moment";

const TYPE_META = {
  enrollment: { icon: GraduationCap, color: "dash-text-accent bg-[#FFCB82]/30" },
  assignment: { icon: ClipboardList, color: "text-[#FF8A8A] bg-[#FF8A8A]/20" },
  quiz: { icon: BrainCircuit, color: "dash-text-accent bg-[#FFCB82]/30" },
  attendance: { icon: UserRoundCheck, color: "text-[#7AEF85] bg-[#7AEF85]/20" },
  notification: { icon: Bell, color: "text-[#82B4FF] bg-[#82B4FF]/20" },
  default: { icon: Clock, color: "dash-text-muted dash-surface-subtle" },
};

function formatTime(date) {
  if (!date) return "Recently";
  return moment(date).fromNow();
}

function ActivityFeed({ items = [], loading = false, title = "Recent Activity" }) {
  return (
    <div className="dash-surface-card p-5 h-full">
      <div className="mb-4">
        <h3 className="text-lg font-semibold dash-text">{title}</h3>
        <p className="text-sm dash-text-muted">Latest updates across your LMS</p>
      </div>

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-14 bg-gray-200 dark:bg-slate-600 rounded-xl animate-pulse" />
          ))}
        </div>
      ) : items.length === 0 ? (
        <div className="py-10 text-center dash-text-muted text-sm">
          No recent activity yet
        </div>
      ) : (
        <ul className="space-y-2 max-h-[360px] overflow-y-auto pr-1">
          {items.map((item, index) => {
            const meta = TYPE_META[item.type] || TYPE_META.default;
            const Icon = meta.icon;
            return (
              <li
                key={item.id || index}
                className="flex items-start gap-3 p-3 rounded-xl dash-hover-row transition-colors border border-transparent"
              >
                <div className={`shrink-0 p-2 rounded-lg ${meta.color}`}>
                  <Icon size={16} />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium dash-text line-clamp-2">
                    {item.title}
                  </p>
                  {item.subtitle && (
                    <p className="text-xs dash-text-muted mt-0.5 line-clamp-1">
                      {item.subtitle}
                    </p>
                  )}
                </div>
                <span className="shrink-0 text-xs dash-text-muted whitespace-nowrap">
                  {formatTime(item.time)}
                </span>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

export default ActivityFeed;
