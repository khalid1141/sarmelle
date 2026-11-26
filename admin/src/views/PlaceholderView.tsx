import React from 'react';

interface PlaceholderViewProps {
  title: string;
}

export default function PlaceholderView({ title }: PlaceholderViewProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 bg-white rounded-lg border border-amber-200/60 shadow-xs text-center">
      <div className="w-16 h-16 rounded-full bg-amber-50 text-amber-700 flex items-center justify-center mb-4 border border-amber-200">
        <svg className="w-8 h-8" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
          <path d="M14.7 6.3a1 1 0 000 1.4l1.6 1.6a1 1 0 001.4 0l3.77-3.77a6 6 0 01-7.94 7.94l-6.91 6.91a2.12 2.12 0 01-3-3l6.91-6.91a6 6 0 017.94-7.94l-3.76 3.76z" />
        </svg>
      </div>
      <h2 className="text-xl font-bold text-stone-900 mb-2">{title}</h2>
      <p className="text-stone-500 text-sm max-w-sm mb-6">
        This section is part of the full store administration suite and is not built yet in this pilot.
      </p>
      <a
        href="#/inventory"
        className="px-4 py-2 bg-stone-900 hover:bg-stone-800 text-white text-sm font-medium rounded-md transition-colors shadow-sm"
      >
        Return to Inventory Dashboard
      </a>
    </div>
  );
}
