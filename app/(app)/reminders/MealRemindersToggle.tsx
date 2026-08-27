"use client";

import { useTransition } from "react";
import { setMealRemindersEnabled } from "./actions";

export function MealRemindersToggle({ initialEnabled }: { initialEnabled: boolean }) {
  const [isPending, startTransition] = useTransition();

  function toggle(e: React.ChangeEvent<HTMLInputElement>) {
    const formData = new FormData();
    formData.set("enabled", String(e.target.checked));
    startTransition(() => setMealRemindersEnabled(formData));
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
