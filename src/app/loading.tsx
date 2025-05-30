import { LoadingSpinner } from "@/components/ui/loading-spinner";

export default function Loading() {
  return (
    <div className="flex h-screen flex-col items-center justify-center gap-4">
      <LoadingSpinner size={48} />
      <p className="text-lg text-muted-foreground">Загрузка страницы...</p>
    </div>
  );
}
