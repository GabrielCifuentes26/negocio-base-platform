import { Skeleton } from "@/components/ui/skeleton";

export function ModuleLoader() {
  return (
    <div className="space-y-4">
      <Skeleton className="h-8 w-56 rounded-full" />
      <div className="grid gap-4 md:grid-cols-3">
        <Skeleton className="h-32 rounded-[1.75rem]" />
        <Skeleton className="h-32 rounded-[1.75rem]" />
        <Skeleton className="h-32 rounded-[1.75rem]" />
      </div>
      <Skeleton className="h-72 rounded-[2rem]" />
    </div>
  );
}
