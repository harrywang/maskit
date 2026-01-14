'use client';

import { useEffect, useCallback } from 'react';
import { Download, RotateCcw, Square, Circle, EyeOff, Grid3X3, Droplets, Trash2, ZoomIn, ZoomOut, Shield } from 'lucide-react';
import { useEditorStore } from '@/stores/editor-store';
import { DropZone } from './drop-zone';
import { Canvas } from './canvas';
import { applyMask } from '@/lib/canvas-utils';
import type { ShapeType, MaskType } from '@/types/editor';

export function ImageEditor() {
  const {
    image,
    selections,
    activeSelectionId,
    currentShape,
    currentMask,
    concealLevel,
    zoom,
    showBorders,
    clearImage,
    removeSelection,
    setActiveSelection,
    setCurrentShape,
    setCurrentMask,
    setConcealLevel,
    setZoom,
    setShowBorders,
  } = useEditorStore();

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Delete' || e.key === 'Backspace') {
        if (activeSelectionId && document.activeElement === document.body) {
          e.preventDefault();
          removeSelection(activeSelectionId);
        }
      }
      if (e.key === 'Escape') {
        setActiveSelection(null);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeSelectionId, removeSelection, setActiveSelection]);

  // Download the edited image
  const handleDownload = useCallback(() => {
    if (!image) return;

    const canvas = document.createElement('canvas');
    canvas.width = image.width;
    canvas.height = image.height;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.drawImage(image, 0, 0);

    const sourceCanvas = document.createElement('canvas');
    sourceCanvas.width = image.width;
    sourceCanvas.height = image.height;
    const sourceCtx = sourceCanvas.getContext('2d');
    if (sourceCtx) {
      sourceCtx.drawImage(image, 0, 0);
    }

    selections.forEach((selection) => {
      applyMask(ctx, sourceCanvas, selection, image.width, image.height, concealLevel);
    });

    canvas.toBlob((blob) => {
      if (!blob) return;
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'masked-image.png';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }, 'image/png');
  }, [image, selections, concealLevel]);

  const shapes: { type: ShapeType; icon: typeof Square; label: string }[] = [
    { type: 'rectangle', icon: Square, label: 'Rectangle' },
    { type: 'circle', icon: Circle, label: 'Circle' },
  ];

  const masks: { type: MaskType; icon: typeof EyeOff; label: string }[] = [
    { type: 'black', icon: EyeOff, label: 'Black' },
    { type: 'pixelate', icon: Grid3X3, label: 'Pixelate' },
    { type: 'blur', icon: Droplets, label: 'Blur' },
  ];

  // Landing page - no image loaded
  if (!image) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex flex-col">
        {/* Header */}
        <header className="p-6">
          <div className="max-w-4xl mx-auto flex items-center justify-between">
            <h1 className="text-2xl font-bold bg-gradient-to-r from-slate-800 to-slate-600 bg-clip-text text-transparent">
              Maskit
            </h1>
            <div className="flex items-center gap-2 text-sm text-slate-500">
              <Shield className="w-4 h-4" />
              <span>100% Private</span>
            </div>
          </div>
        </header>

        {/* Main content */}
        <main className="flex-1 flex items-center justify-center p-6">
          <div className="w-full max-w-2xl">
            {/* Hero text */}
            <div className="text-center mb-10">
              <h2 className="text-4xl font-bold text-slate-800 mb-4">
                Mask sensitive info in images
              </h2>
              <p className="text-lg text-slate-500 max-w-md mx-auto">
                Blur, pixelate, or black out any part of your image.
                Everything happens in your browser — nothing is uploaded.
              </p>
            </div>

            {/* Drop zone */}
            <DropZone />

            {/* Features */}
            <div className="mt-10 grid grid-cols-3 gap-6 text-center">
              <div className="p-4">
                <div className="w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center mx-auto mb-3">
                  <EyeOff className="w-5 h-5 text-slate-600" />
                </div>
                <h3 className="font-medium text-slate-700 mb-1">Black out</h3>
                <p className="text-sm text-slate-500">Solid black mask</p>
              </div>
              <div className="p-4">
                <div className="w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center mx-auto mb-3">
                  <Grid3X3 className="w-5 h-5 text-slate-600" />
                </div>
                <h3 className="font-medium text-slate-700 mb-1">Pixelate</h3>
                <p className="text-sm text-slate-500">Mosaic effect</p>
              </div>
              <div className="p-4">
                <div className="w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center mx-auto mb-3">
                  <Droplets className="w-5 h-5 text-slate-600" />
                </div>
                <h3 className="font-medium text-slate-700 mb-1">Blur</h3>
                <p className="text-sm text-slate-500">Gaussian blur</p>
              </div>
            </div>
          </div>
        </main>
      </div>
    );
  }

  // Editor page - image loaded
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex flex-col">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-sm border-b border-slate-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <h1 className="text-xl font-bold bg-gradient-to-r from-slate-800 to-slate-600 bg-clip-text text-transparent">
            Maskit
          </h1>

          <div className="flex items-center gap-2">
            <button
              onClick={clearImage}
              className="flex items-center gap-2 px-3 py-2 text-sm text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors"
            >
              <RotateCcw className="w-4 h-4" />
              New Image
            </button>
            <button
              onClick={handleDownload}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors"
            >
              <Download className="w-4 h-4" />
              Download
            </button>
          </div>
        </div>
      </header>

      {/* Toolbar */}
      <div className="bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 py-2 flex items-center justify-center gap-6 flex-wrap">
          {/* Shape tools */}
          <div className="flex items-center gap-1">
            <span className="text-xs font-medium text-slate-400 mr-2 uppercase tracking-wide">Shape</span>
            {shapes.map(({ type, icon: Icon, label }) => (
              <button
                key={type}
                onClick={() => setCurrentShape(type)}
                className={`p-2 rounded-lg transition-colors ${
                  currentShape === type
                    ? 'bg-slate-800 text-white'
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
                title={label}
              >
                <Icon className="w-4 h-4" />
              </button>
            ))}
          </div>

          <div className="w-px h-6 bg-slate-200" />

          {/* Mask tools */}
          <div className="flex items-center gap-1">
            <span className="text-xs font-medium text-slate-400 mr-2 uppercase tracking-wide">Effect</span>
            {masks.map(({ type, icon: Icon, label }) => (
              <button
                key={type}
                onClick={() => setCurrentMask(type)}
                className={`p-2 rounded-lg transition-colors ${
                  currentMask === type
                    ? 'bg-slate-800 text-white'
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
                title={label}
              >
                <Icon className="w-4 h-4" />
              </button>
            ))}
          </div>

          <div className="w-px h-6 bg-slate-200" />

          {/* Intensity */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-medium text-slate-400 uppercase tracking-wide">Intensity</span>
            <input
              type="range"
              min={1}
              max={10}
              value={concealLevel}
              onChange={(e) => setConcealLevel(Number(e.target.value))}
              className="w-24 h-1.5 bg-slate-200 rounded-full appearance-none cursor-pointer accent-slate-800"
            />
            <span className="text-xs font-medium text-slate-600 w-4">{concealLevel}</span>
          </div>

          <div className="w-px h-6 bg-slate-200" />

          {/* Zoom */}
          <div className="flex items-center gap-1">
            <button
              onClick={() => setZoom(Math.max(0.5, zoom - 0.1))}
              className="p-2 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
              title="Zoom out"
            >
              <ZoomOut className="w-4 h-4" />
            </button>
            <span className="text-xs font-medium text-slate-600 w-10 text-center">
              {Math.round(zoom * 100)}%
            </span>
            <button
              onClick={() => setZoom(Math.min(2, zoom + 0.1))}
              className="p-2 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
              title="Zoom in"
            >
              <ZoomIn className="w-4 h-4" />
            </button>
          </div>

          <div className="w-px h-6 bg-slate-200" />

          {/* Borders toggle */}
          <button
            onClick={() => setShowBorders(!showBorders)}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
              showBorders
                ? 'bg-slate-800 text-white'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            Borders
          </button>

          <div className="w-px h-6 bg-slate-200" />

          {/* Delete */}
          <button
            onClick={() => activeSelectionId && removeSelection(activeSelectionId)}
            disabled={!activeSelectionId}
            className="p-2 text-slate-600 hover:bg-red-50 hover:text-red-600 rounded-lg transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
            title="Delete selection"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Canvas area */}
      <main className="flex-1 p-6 flex items-center justify-center overflow-auto">
        <div className="bg-white rounded-2xl shadow-lg p-4 inline-block">
          <Canvas />
        </div>
      </main>
    </div>
  );
}
