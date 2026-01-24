import { useOnline } from "@/hooks/use-online";

export function OfflineBanner() {
  const { online, pendingCount, syncing } = useOnline();

  if (online && !syncing && pendingCount === 0) return null;

  return (
    <div
      className="fixed top-0 left-0 right-0 z-50 px-4 py-2 text-center text-sm font-medium text-white"
      style={{
        backgroundColor: !online
          ? "#DC2626"
          : syncing
            ? "#2563EB"
            : "#F59E0B",
      }}
    >
      {!online
        ? "You're offline. Changes will sync when back online."
        : syncing
          ? "Syncing..."
          : pendingCount > 0
            ? `${pendingCount} pending change(s) in queue. Will retry when back online.`
            : null}
    </div>
  );
}
