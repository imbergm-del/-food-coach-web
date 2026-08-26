import "./globals.css";

export const metadata = {
  title: "AI Food Coach",
  description: "Персональный ИИ-помощник по питанию"
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ru">
      <body>{children}</body>
    </html>
  );
}
