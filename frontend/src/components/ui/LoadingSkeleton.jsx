import { Skeleton } from './skeleton';

export const ChatSkeleton = () => (
  <div className="space-y-4 p-4">
    <div className="flex gap-3">
      <Skeleton className="w-8 h-8 rounded-full" />
      <div className="space-y-2 flex-1">
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-4 w-1/2" />
      </div>
    </div>
    <div className="flex gap-3 justify-end">
      <div className="space-y-2">
        <Skeleton className="h-4 w-48" />
      </div>
      <Skeleton className="w-8 h-8 rounded-full" />
    </div>
  </div>
);

export const TableSkeleton = ({ rows = 5 }) => (
  <div className="space-y-3">
    <Skeleton className="h-10 w-full" />
    {[...Array(rows)].map((_, i) => (
      <Skeleton key={i} className="h-14 w-full" />
    ))}
  </div>
);

export const CardSkeleton = () => (
  <div className="bg-white rounded-lg border border-slate-200 p-6 space-y-4">
    <Skeleton className="h-6 w-1/3" />
    <Skeleton className="h-4 w-full" />
    <Skeleton className="h-4 w-2/3" />
  </div>
);

export const ChartSkeleton = () => (
  <div className="bg-white rounded-lg border border-slate-200 p-6">
    <Skeleton className="h-6 w-1/4 mb-6" />
    <Skeleton className="h-48 w-full" />
  </div>
);

export const MapSkeleton = () => (
  <div className="w-full h-full bg-slate-100 rounded-lg flex items-center justify-center">
    <div className="text-center space-y-2">
      <Skeleton className="h-12 w-12 rounded-full mx-auto" />
      <Skeleton className="h-4 w-24" />
    </div>
  </div>
);
