/** Map legacy statuses to active/inactive. */
export const normalizeInterviewPanelStatus = (status) => {
  const value = String(status || "active")
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "_");

  if (value === "active" || value === "inactive") return value;
  if (["scheduled", "in_progress", "in-progress"].includes(value)) {
    return "active";
  }
  if (["completed", "cancelled", "canceled"].includes(value)) {
    return "inactive";
  }
  return "active";
};

export const INTERVIEW_PANEL_STATUSES = [
  { value: "active", label: "Active", colorScheme: "green" },
  { value: "inactive", label: "Inactive", colorScheme: "gray" },
];

export const getInterviewPanelStatusMeta = (status) => {
  const normalized = normalizeInterviewPanelStatus(status);
  return (
    INTERVIEW_PANEL_STATUSES.find((item) => item.value === normalized) || {
      value: "active",
      label: "Active",
      colorScheme: "green",
    }
  );
};

export const DEFAULT_MEMBER_ROLE = "Panelist";

/** Roles a person can hold on an interview panel. */
export const PANEL_MEMBER_ROLES = [
  "Chairperson",
  "Co-Chair",
  "Panelist",
  "Subject Expert",
  "Observer",
];

/** Resolve start/end time from panel (supports legacy `time` field). */
export const getPanelTimeRange = (panel) => {
  const start = panel?.start_time || panel?.time || "";
  const end = panel?.end_time || "";
  return { start_time: start, end_time: end };
};

export const createEmptyMemberRow = (index = 0) => ({
  id: `member_${Date.now()}_${index}_${Math.random().toString(36).slice(2, 6)}`,
  panelist_id: "",
  name: "",
  role: DEFAULT_MEMBER_ROLE,
  description: "",
});

export const membersToFormRows = (members = []) => {
  if (!Array.isArray(members) || members.length === 0) {
    return [createEmptyMemberRow(0)];
  }
  return members.map((item, index) => ({
    id: `existing_${String(item.name || "m").replace(/\s+/g, "_")}_${index}`,
    panelist_id: item.panelist_id
      ? String(item.panelist_id._id || item.panelist_id)
      : "",
    name: item.name || "",
    role: item.role || DEFAULT_MEMBER_ROLE,
    description: item.description || "",
  }));
};

export const formRowsToMembersPayload = (rows = []) =>
  (rows || [])
    .map((row) => ({
      panelist_id: row.panelist_id || undefined,
      name: String(row.name || "").trim(),
      role: String(row.role || "").trim() || DEFAULT_MEMBER_ROLE,
      description: String(row.description || "").trim(),
    }))
    .filter((row) => row.name || row.description || row.panelist_id);

/** Returns an error message if any member is incomplete; otherwise null. */
export const getMembersValidationError = (rows = []) => {
  const filled = (rows || []).filter(
    (row) =>
      String(row.panelist_id || "").trim() ||
      String(row.name || "").trim() ||
      String(row.description || "").trim()
  );
  if (filled.length === 0) {
    return "Add at least one panelist";
  }
  for (const row of filled) {
    if (!String(row.panelist_id || "").trim() && !String(row.name || "").trim()) {
      return "Select a panelist for each member row";
    }
    if (!String(row.name || "").trim()) {
      return "Each panel member requires a name";
    }
    if (!String(row.role || "").trim()) {
      return "Select a role for each panel member";
    }
    if (!String(row.description || "").trim()) {
      return "Each panelist member requires a description";
    }
  }
  const ids = filled
    .map((row) => String(row.panelist_id || "").trim())
    .filter(Boolean);
  if (ids.length !== new Set(ids).size) {
    return "The same panelist cannot be added twice";
  }
  return null;
};

export const createEmptyScheduleRow = (index = 0, defaults = {}) => ({
  id: `schedule_${Date.now()}_${index}_${Math.random().toString(36).slice(2, 6)}`,
  date: defaults.date || "",
  start_time: defaults.start_time || "",
  end_time: defaults.end_time || "",
  venue: defaults.venue || "",
  notes: defaults.notes || "",
  booking_status: defaults.booking_status || "available",
  booked_for: defaults.booked_for || "",
  booked_phone: defaults.booked_phone || "",
  booked_notes: defaults.booked_notes || "",
  booked_user_id: defaults.booked_user_id || null,
  booked_at: defaults.booked_at || null,
});

/** Build schedule form rows from panel (falls back to primary date/time). */
export const panelToScheduleRows = (panel) => {
  const existing = Array.isArray(panel?.schedules) ? panel.schedules : [];
  if (existing.length > 0) {
    return existing.map((item, index) => ({
      id: `existing_schedule_${index}`,
      date: item.date || "",
      start_time: item.start_time || item.time || "",
      end_time: item.end_time || "",
      venue: item.venue || "",
      notes: item.notes || "",
      booking_status:
        String(item.booking_status || "available").toLowerCase() === "booked"
          ? "booked"
          : "available",
      booked_for: item.booked_for || "",
      booked_phone: item.booked_phone || "",
      booked_notes: item.booked_notes || "",
      booked_user_id: item.booked_user_id
        ? String(item.booked_user_id)
        : null,
      booked_at: item.booked_at || null,
      booked_qualifier_id: item.booked_qualifier_id
        ? String(item.booked_qualifier_id._id || item.booked_qualifier_id)
        : null,
      interview_status: item.interview_status || "not_started",
      interview_started_at: item.interview_started_at || null,
      schedule_array_index: Number.isInteger(Number(item.schedule_array_index))
        ? Number(item.schedule_array_index)
        : index,
    }));
  }

  const range = getPanelTimeRange(panel);
  if (panel?.date || range.start_time || range.end_time || panel?.venue) {
    return [
      createEmptyScheduleRow(0, {
        date: panel?.date || "",
        start_time: range.start_time,
        end_time: range.end_time,
        venue: panel?.venue || "",
      }),
    ];
  }

  return [createEmptyScheduleRow(0)];
};

export const formRowsToSchedulesPayload = (rows = []) =>
  (rows || [])
    .map((row) => {
      const bookingStatus =
        String(row.booking_status || "available").toLowerCase() === "booked"
          ? "booked"
          : "available";
      return {
        date: String(row.date || "").trim(),
        start_time: String(row.start_time || "").trim(),
        end_time: String(row.end_time || "").trim(),
        venue: String(row.venue || "").trim(),
        notes: String(row.notes || "").trim(),
        booking_status: bookingStatus,
        booked_for:
          bookingStatus === "booked"
            ? String(row.booked_for || "").trim()
            : "",
        booked_phone:
          bookingStatus === "booked"
            ? String(row.booked_phone || "").trim()
            : "",
        booked_notes:
          bookingStatus === "booked"
            ? String(row.booked_notes || "").trim()
            : "",
        booked_user_id:
          bookingStatus === "booked" && row.booked_user_id
            ? row.booked_user_id
            : null,
        booked_at: bookingStatus === "booked" ? row.booked_at || new Date() : null,
      };
    })
    .filter(
      (row) =>
        row.date ||
        row.start_time ||
        row.end_time ||
        row.venue ||
        row.notes ||
        row.booking_status === "booked"
    );

export const getSchedulesValidationError = (rows = []) => {
  const filled = formRowsToSchedulesPayload(rows);
  if (filled.length === 0) {
    return "Add at least one schedule with a date";
  }
  for (const row of filled) {
    if (!row.date) {
      return "Each schedule requires a date";
    }
    if (row.start_time && row.end_time && row.end_time <= row.start_time) {
      return "Schedule end time must be after start time";
    }
  }
  return null;
};

export const getPanelScheduleCount = (panel) => {
  const schedules = Array.isArray(panel?.schedules) ? panel.schedules : [];
  if (schedules.length > 0) return schedules.length;
  return panel?.date ? 1 : 0;
};

/** Flatten all schedules from panels into one list (for board page). */
export const flattenAllPanelSchedules = (panels = []) => {
  const rows = [];
  (panels || []).forEach((panel) => {
    if (!panel) return;
    const members = Array.isArray(panel.members)
      ? panel.members
          .map((member) => ({
            name: String(member?.name || "").trim(),
            role: String(member?.role || "").trim() || "Panelist",
            description: String(member?.description || "").trim(),
          }))
          .filter((member) => member.name)
      : [];
    const slots = panelToScheduleRows(panel);
    slots.forEach((slot, index) => {
      if (!slot.date && !slot.start_time && !slot.end_time) return;
      const originalIndex = Number.isInteger(Number(slot.schedule_array_index))
        ? Number(slot.schedule_array_index)
        : index;
      rows.push({
        id: `${panel._id}_${originalIndex}_${slot.date || "na"}`,
        panel_id: panel._id,
        panel_title: panel.title || "Untitled panel",
        panel_status: panel.status,
        panel_venue: panel.venue || "",
        members,
        schedule_index: originalIndex + 1,
        schedule_array_index: originalIndex,
        date: slot.date || "",
        start_time: slot.start_time || "",
        end_time: slot.end_time || "",
        venue: slot.venue || panel.venue || "",
        notes: slot.notes || "",
        booking_status:
          String(slot.booking_status || "available").toLowerCase() === "booked"
            ? "booked"
            : "available",
        booked_for: slot.booked_for || "",
        booked_phone: slot.booked_phone || "",
        booked_notes: slot.booked_notes || "",
        booked_user_id: slot.booked_user_id || null,
        booked_at: slot.booked_at || null,
        booked_qualifier_id: slot.booked_qualifier_id || null,
        interview_status: slot.interview_status || "not_started",
        interview_started_at: slot.interview_started_at || null,
      });
    });
  });

  return rows.sort((a, b) => {
    const dateCmp = String(a.date).localeCompare(String(b.date));
    if (dateCmp !== 0) return dateCmp;
    return String(a.start_time).localeCompare(String(b.start_time));
  });
};
