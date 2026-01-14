'use client';

import { useCallback, useState, useEffect } from 'react';
import { Upload } from 'lucide-react';
import { useEditorStore } from '@/stores/editor-store';

export function DropZone() {
  const [isDragging, setIsDragging] = useState(false);
  const setImage = useEditorStore((state) => state.setImage);

  const loadImage = useCallback((file: File) => {
    if (!file.type.startsWith('image/')) {
      alert('Please select an image file');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const dataUrl = e.target?.result as string;
      const img = new Image();
      img.onload = () => {
        setImage(img, dataUrl);
      };
      img.src = dataUrl;
    };
    reader.readAsDataURL(file);
  }, [setImage]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    const file = e.dataTransfer.files[0];
    if (file) {
      loadImage(file);
    }
  }, [loadImage]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      loadImage(file);
    }
  }, [loadImage]);

  // Handle paste from clipboard
  useEffect(() => {
    const handlePaste = (e: ClipboardEvent) => {
      const items = e.clipboardData?.items;
      if (!items) return;

      for (const item of items) {
        if (item.type.startsWith('image/')) {
          const file = item.getAsFile();
          if (file) {
            loadImage(file);
            break;
          }
        }
      }
    };

    window.addEventListener('paste', handlePaste);
    return () => window.removeEventListener('paste', handlePaste);
  }, [loadImage]);

  return (
    <div
      onDrop={handleDrop}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      className={`
        flex flex-col items-center justify-center gap-4 p-12
        border-2 border-dashed rounded-xl cursor-pointer
        transition-colors duration-200
        ${isDragging
          ? 'border-slate-400 bg-slate-50'
          : 'border-slate-300 hover:border-slate-400 hover:bg-slate-50'
        }
      `}
    >
      <Upload className="w-12 h-12 text-slate-400" />
      <div className="text-center">
        <p className="text-lg font-medium text-slate-700">Drop/paste your image here</p>
        <p className="text-sm text-slate-500 mt-1">
          or{' '}
          <label className="text-slate-800 font-medium hover:underline cursor-pointer">
            Select image
            <input
              type="file"
              accept="image/*"
              onChange={handleFileSelect}
              className="hidden"
            />
          </label>
        </p>
      </div>
      <p className="text-xs text-slate-400">
        Your image stays in your browser. Nothing is uploaded.
      </p>
    </div>
  );
}
