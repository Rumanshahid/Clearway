"use client";

import { useState } from "react";
import Modal from "@/components/Modal";
import { updateDashboardLayoutAction } from "./actions";
import type { WidgetDef } from "@/lib/dashboardWidgets";

export default function DashboardCustomizer({
  registry,
  initialOrder,
  initialHidden,
}: {
  registry: WidgetDef[];
  initialOrder: string[];
  initialHidden: string[];
}) {
  const [open, setOpen] = useState(false);
  const [order, setOrder] = useState(initialOrder);
  const [hidden, setHidden] = useState<Set<string>>(new Set(initialHidden));
  const titleByKey = new Map(registry.map((w) => [w.key, w.title]));

  function move(key: string, dir: -1 | 1) {
    setOrder((prev) => {
      const idx = prev.indexOf(key);
      const swapIdx = idx + dir;
      if (swapIdx < 0 || swapIdx >= prev.length) return prev;
      const next = [...prev];
      [next[idx], next[swapIdx]] = [next[swapIdx], next[idx]];
      return next;
    });
  }

  function toggle(key: string) {
    setHidden((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }

  return (
    <>
      <button type="button" className="btn btn-outline btn-sm flex-shrink-0" onClick={() => setOpen(true)}>
        Customize
      </button>
      <Modal open={open} onClose={() => setOpen(false)} title="Customize dashboard">
        <form action={updateDashboardLayoutAction} className="flex flex-col gap-4">
          <input type="hidden" name="layout" value={JSON.stringify({ order, hidden: Array.from(hidden) })} />
          <p className="text-[12.5px] text-gray-400 -mt-1">Show or hide panels, and reorder them with the arrows.</p>
          <div className="flex flex-col gap-1.5 max-h-[360px] overflow-y-auto">
            {order.map((key, i) => (
              <div key={key} className="flex items-center gap-2 text-[13.5px] rounded-lg px-2.5 py-1.5" style={{ background: "var(--gray-50)" }}>
                <input type="checkbox" checked={!hidden.has(key)} onChange={() => toggle(key)} className="w-4 h-4" />
                <span className="flex-1">{titleByKey.get(key) || key}</span>
                <button
                  type="button"
                  className="text-btn text-[13px] text-gray-400 disabled:opacity-30"
                  disabled={i === 0}
                  onClick={() => move(key, -1)}
                  aria-label="Move up"
                >
                  ↑
                </button>
                <button
                  type="button"
                  className="text-btn text-[13px] text-gray-400 disabled:opacity-30"
                  disabled={i === order.length - 1}
                  onClick={() => move(key, 1)}
                  aria-label="Move down"
                >
                  ↓
                </button>
              </div>
            ))}
          </div>
          <div className="flex gap-2">
            <button type="submit" className="btn btn-primary btn-sm">Save</button>
            <button type="button" className="btn btn-outline btn-sm" onClick={() => setOpen(false)}>Cancel</button>
          </div>
        </form>
      </Modal>
    </>
  );
}
