"use client";

import { useTransition } from "react";
import { setGroceryBought } from "./actions";

export function GroceryCheckbox({ id, initialBought }: { id: number; initialBought: boolean }) {
  const [isPending, startTransition] = useTransition();

  function toggle(e: React.ChangeEvent<HTMLInputElement>) {
    const formData = new FormData();
    formData.set("id", String(id));
    formData.set("bought", String(e.target.checked));
    startTransition(() => setGroceryBought(formData));
  }

  return (
    <input
      type="checkbox"
      defaultChecked={initialBought}
      disabled={isPending}
      onChange={toggle}
      style={{ width: 19, height: 19, flexShrink: 0 }}
    />
  );
}
