'use client';

import React, { useState } from 'react';
import { Share2, Loader2 } from 'lucide-react';

const ExportButton = ({ targetId, filename }: { targetId: string; filename: string }) => {
  const [isExporting, setIsExporting] = useState(false);

  const handleExport = async () => {
    const element = document.getElementById(targetId);
    if (!element) return;

    setIsExporting(true);
    try {
      // Dynamic import — html-to-image (~120KB) only loaded on first click
      const { toPng } = await import('html-to-image');
      const dataUrl = await toPng(element, { quality: 0.95, pixelRatio: 2 });
      const link = document.createElement('a');
      link.download = `${filename}.png`;
      link.href = dataUrl;
      link.click();
    } catch (err) {
      console.error('Export failed:', err);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <button
      onClick={handleExport}
      disabled={isExporting}
      aria-label={isExporting ? 'Generating export…' : 'Export to Instagram Story'}
      className="bg-black text-white px-8 py-4 rounded-2xl font-bold flex items-center gap-3 shadow-xl hover:scale-105 transition-all active:scale-95 disabled:opacity-50"
    >
      {isExporting ? (
        <>
          <Loader2 className="w-5 h-5 animate-spin" aria-hidden="true" />
          Generating…
        </>
      ) : (
        <>
          <Share2 className="w-5 h-5" aria-hidden="true" />
          Export to Instagram Story
        </>
      )}
    </button>
  );
};

export default ExportButton;
