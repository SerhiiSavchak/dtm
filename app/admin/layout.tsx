import { NextStudioLayout } from "next-sanity/studio";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
  params: Promise<object>;
}) {
  return <NextStudioLayout>{children}</NextStudioLayout>;
}
