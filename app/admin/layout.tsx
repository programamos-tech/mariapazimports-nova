export default function AdminRootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-full bg-white text-zinc-900 antialiased">
      {children}
    </div>
  );
}
