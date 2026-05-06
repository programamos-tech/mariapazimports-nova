export default function AdminRootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-full bg-zinc-100 text-zinc-900 antialiased">
      {children}
    </div>
  );
}
