export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-[#EAF2FF] text-[#0C2340]">{children}</div>
  );
}
