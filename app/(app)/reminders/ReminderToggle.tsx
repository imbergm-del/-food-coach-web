"use client";

import { useTransition } from "react";
import { setReminderEnabled } from "./actions";

export function ReminderToggle({ initialEnabled }: { initialEnabled: boolean }) {
  const [isPending, startTransition] = useTransition();

  function toggle(e: React.ChangeEvent<HTMLInputElement>) {
    const formData = new FormData();
    formData.set("enabled", String(e.target.checked));
    startTransition(() => setReminderEnabled(formData));
  }

  return (
    <input
      type="checkbox"
      defaultChecked={initialEnabled}
      disabled={isPending}
      onChange={toggle}
      style={{ width: 18, height: 18 }}
    />
  );
}
