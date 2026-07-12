// Registry of Overview-dashboard widgets, plus the logic to turn a user's
// saved dashboard_layout (order + hidden keys) into a concrete render order.
// "sm" widgets are compact KPI tiles (the top stat row); "lg" widgets are
// full content panels (Today's Schedule, Needs Attention, Staff).

export type WidgetSize = "sm" | "lg";

export interface WidgetDef {
  key: string;
  title: string;
  size: WidgetSize;
}

// "Tasks" (a staff to-do count) and "Today's Schedule" (today's actual
// appointments) used to both exist as separate widgets, but read as
// duplicates of each other on a "what's happening today" dashboard --
// Schedule already covers that ground with real detail, so Tasks was
// dropped rather than kept as a redundant, detail-free count.
export const WIDGET_REGISTRY: WidgetDef[] = [
  { key: "pa_requests", title: "PA Requests", size: "sm" },
  { key: "patients", title: "Patients", size: "sm" },
  { key: "appeals", title: "Appeals", size: "sm" },
  { key: "billing", title: "Plan usage", size: "sm" },
  { key: "schedule", title: "Today's Schedule", size: "lg" },
  { key: "attention", title: "Needs Attention", size: "lg" },
  { key: "staff", title: "Staff", size: "lg" },
];

const VALID_KEYS = new Set(WIDGET_REGISTRY.map((w) => w.key));
const DEFAULT_ORDER = WIDGET_REGISTRY.map((w) => w.key);

export interface DashboardLayout {
  order: string[];
  hidden: string[];
}

export function resolveDashboardLayout(saved: { order?: string[]; hidden?: string[] } | null | undefined): {
  order: string[];
  hiddenSet: Set<string>;
} {
  const savedOrder = Array.isArray(saved?.order) ? saved!.order!.filter((k) => VALID_KEYS.has(k)) : [];
  // Any widget not in a saved order (new widgets added after the user last
  // customized) falls back to appearing at the end, in registry order.
  const order = [...savedOrder, ...DEFAULT_ORDER.filter((k) => !savedOrder.includes(k))];
  const hiddenSet = new Set(Array.isArray(saved?.hidden) ? saved!.hidden!.filter((k) => VALID_KEYS.has(k)) : []);
  return { order, hiddenSet };
}
