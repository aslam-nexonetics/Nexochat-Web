import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <div className="flex h-screen w-full overflow-hidden bg-background">
      {/* Workspace rail skeleton */}
      <div className="w-16 border-r border-border p-3 flex flex-col items-center gap-4 bg-slate-50">
        <Skeleton className="h-10 w-10 rounded-xl" />
        <div className="w-8 h-px bg-border my-1" />
        <Skeleton className="h-10 w-10 rounded-full" />
        <Skeleton className="h-10 w-10 rounded-full" />
        <Skeleton className="h-10 w-10 rounded-full" />
      </div>

      {/* Sidebar skeleton */}
      <div className="w-64 border-r border-border p-4 hidden md:flex flex-col gap-4">
        <Skeleton className="h-8 w-3/4 rounded" />
        <div className="space-y-2 mt-4">
          <Skeleton className="h-9 w-full rounded-md" />
          <Skeleton className="h-9 w-full rounded-md" />
          <Skeleton className="h-9 w-full rounded-md" />
          <Skeleton className="h-9 w-full rounded-md" />
        </div>
      </div>

      {/* Main content skeleton */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <div className="h-14 border-b border-border px-6 flex items-center justify-between">
          <Skeleton className="h-8 w-64 rounded-md" />
          <div className="flex items-center gap-3">
            <Skeleton className="h-8 w-8 rounded-full" />
            <Skeleton className="h-8 w-8 rounded-full" />
          </div>
        </div>
        <div className="flex-1 p-6 space-y-6 overflow-y-auto">
          <div className="flex justify-between items-center">
            <div className="space-y-2">
              <Skeleton className="h-7 w-48 rounded" />
              <Skeleton className="h-4 w-72 rounded" />
            </div>
            <Skeleton className="h-9 w-28 rounded-md" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Skeleton className="h-32 rounded-xl" />
            <Skeleton className="h-32 rounded-xl" />
            <Skeleton className="h-32 rounded-xl" />
          </div>
          <Skeleton className="h-72 rounded-xl" />
        </div>
      </div>
    </div>
  );
}
