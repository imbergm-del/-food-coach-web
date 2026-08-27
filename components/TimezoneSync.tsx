"use client";

import { useEffect } from "react";
import { syncTimezone } from "@/app/(app)/actions";

// Тихо определяет часовой пояс браузера и сохраняет его в профиль, если он
// отличается от того, что уже сохранено — без этого сервер не знает, что
// "сейчас" у пользователя, и путает даты/приветствие с сервером (обычно UTC).
export function TimezoneSync() {
  useEffect(() => {
    try {
      const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
      if (tz) syncTimezone(tz).catch(() => {});
    } catch {
      // Intl недоступен или упал — молча пропускаем, останемся на дефолте сервера
    }
  }, []);

  return null;
}
