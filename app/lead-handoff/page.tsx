import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "DTM",
  robots: { index: false, follow: false },
};

export default async function LeadHandoffPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const { status } = await searchParams;
  const failed = status === "error";

  return (
    <main className="flex min-h-dvh items-center justify-center bg-ink-deep px-6 text-paper">
      <p className="max-w-sm text-center text-base leading-relaxed">
        {failed
          ? "Не вдалося відкрити Telegram. Поверніться на сайт і натисніть «Відкрити Telegram»."
          : "Відправляємо заявку… Після підтвердження тут відкриється Telegram."}
      </p>
    </main>
  );
}
