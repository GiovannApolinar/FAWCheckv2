import AppNavbar from '@/components/AppNavbar';
import OfflineMobileSupport from '@/components/OfflineMobileSupport';

export default function AuthenticatedShell({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="min-h-screen bg-[color:var(--background)] text-[color:var(--foreground)]">
      {/* Offline sync support is disabled; this only clears any previously registered worker/cache. */}
      <OfflineMobileSupport />
      <AppNavbar />
      {children}
    </div>
  );
}
