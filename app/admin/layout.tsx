export default function AdminRootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-full bg-stone-50 text-stone-900 antialiased">
      {children}
    </div>
  );
}
