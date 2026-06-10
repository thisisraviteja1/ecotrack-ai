import React from 'react';

export default function LoadingSkeleton() {
  return (
    <div className="space-y-6 animate-pulse max-w-4xl mx-auto pt-6 px-4">
      {/* Header Skeleton */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-white/5 pb-4">
        <div className="space-y-2 w-1/3">
          <div className="h-6 bg-white/10 rounded-lg w-full" />
          <div className="h-4 bg-white/5 rounded-md w-3/4" />
        </div>
        <div className="h-10 bg-white/10 rounded-xl w-32 shrink-0" />
      </div>

      {/* Primary Card Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {Array.from({ length: 4 }).map((_, idx) => (
          <div key={idx} className="glass-panel p-6 border-white/5 bg-gray-950/20 space-y-4">
            <div className="h-3 bg-white/5 rounded w-1/2" />
            <div className="h-8 bg-white/10 rounded-lg w-2/3" />
            <div className="h-3 bg-white/5 rounded w-3/4" />
          </div>
        ))}
      </div>

      {/* Large Content Section */}
      <div className="glass-panel p-8 border-white/5 bg-gray-950/20 space-y-4">
        <div className="h-4 bg-white/10 rounded-lg w-1/4" />
        <div className="h-3 bg-white/5 rounded w-full" />
        <div className="h-3 bg-white/5 rounded w-5/6" />
        <div className="h-3 bg-white/5 rounded w-4/5" />
      </div>
    </div>
  );
}
