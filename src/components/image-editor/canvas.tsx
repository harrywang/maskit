'use client';

import { useRef, useEffect, useCallback, useState } from 'react';
import { useEditorStore } from '@/stores/editor-store';
import {
  applyMask,
  drawSelectionOverlay,
  hitTestSelection,
} from '@/lib/canvas-utils';
import type { DragMode, ResizeHandle, Point, Selection } from '@/types/editor';

export function Canvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const sourceCanvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const [dragMode, setDragMode] = useState<DragMode>('none');
  const [dragStart, setDragStart] = useState<Point | null>(null);
  const [resizeHandle, setResizeHandle] = useState<ResizeHandle>(null);
  const [initialSelection, setInitialSelection] = useState<Selection | null>(null);

  const {
    image,
    selections,
    activeSelectionId,
    currentShape,
    currentMask,
    concealLevel,
    zoom,
    showBorders,
    addSelection,
    updateSelection,
    setActiveSelection,
    setZoom,
  } = useEditorStore();

  // Auto-fit image to viewport on first load
  useEffect(() => {
    if (!image) return;

    // Calculate zoom to fit image within max dimensions
    const maxWidth = window.innerWidth - 100; // padding
    const maxHeight = window.innerHeight - 250; // header + toolbar + footer

    const scaleX = maxWidth / image.width;
    const scaleY = maxHeight / image.height;
    const fitZoom = Math.min(scaleX, scaleY, 1); // Don't scale up, only down

    setZoom(Math.max(0.5, Math.min(2, fitZoom)));
  }, [image, setZoom]);

  // Render the canvas
  const render = useCallback(() => {
    const canvas = canvasRef.current;
    const sourceCanvas = sourceCanvasRef.current;
    if (!canvas || !sourceCanvas || !image) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas size based on image and zoom
    const displayWidth = image.width * zoom;
    const displayHeight = image.height * zoom;
    canvas.width = displayWidth;
    canvas.height = displayHeight;
    sourceCanvas.width = image.width;
    sourceCanvas.height = image.height;

    // Draw original image to source canvas (for reading pixel data)
    const sourceCtx = sourceCanvas.getContext('2d');
    if (sourceCtx) {
      sourceCtx.drawImage(image, 0, 0);
    }

    // Clear and draw image to display canvas
    ctx.clearRect(0, 0, displayWidth, displayHeight);
    ctx.save();
    ctx.scale(zoom, zoom);
    ctx.drawImage(image, 0, 0);

    // Apply masks to all selections
    selections.forEach((selection) => {
      applyMask(ctx, sourceCanvas, selection, image.width, image.height, concealLevel);
    });

    // Draw selection overlays only if showBorders is enabled
    if (showBorders) {
      selections.forEach((selection) => {
        drawSelectionOverlay(
          ctx,
          selection,
          image.width,
          image.height,
          selection.id === activeSelectionId
        );
      });
    }

    ctx.restore();
  }, [image, selections, activeSelectionId, concealLevel, zoom, showBorders]);

  // Re-render when dependencies change
  useEffect(() => {
    render();
  }, [render]);

  // Get mouse position relative to image (normalized 0-1)
  const getImagePosition = useCallback(
    (e: React.MouseEvent): Point | null => {
      const canvas = canvasRef.current;
      if (!canvas || !image) return null;

      const rect = canvas.getBoundingClientRect();
      const x = (e.clientX - rect.left) / zoom / image.width;
      const y = (e.clientY - rect.top) / zoom / image.height;

      return { x, y };
    },
    [image, zoom]
  );

  // Get pixel position for hit testing
  const getPixelPosition = useCallback(
    (e: React.MouseEvent): Point | null => {
      const canvas = canvasRef.current;
      if (!canvas || !image) return null;

      const rect = canvas.getBoundingClientRect();
      const x = (e.clientX - rect.left) / zoom;
      const y = (e.clientY - rect.top) / zoom;

      return { x, y };
    },
    [image, zoom]
  );

  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      const pos = getImagePosition(e);
      const pixelPos = getPixelPosition(e);
      if (!pos || !pixelPos || !image) return;

      // Check if clicking on existing selection
      for (let i = selections.length - 1; i >= 0; i--) {
        const selection = selections[i];
        const hit = hitTestSelection(
          pixelPos.x,
          pixelPos.y,
          selection,
          image.width,
          image.height
        );

        if (hit) {
          setActiveSelection(selection.id);

          if (hit === 'inside') {
            setDragMode('move');
            setDragStart(pos);
            setInitialSelection({ ...selection });
          } else {
            setDragMode('resize');
            setResizeHandle(hit);
            setDragStart(pos);
            setInitialSelection({ ...selection });
          }
          return;
        }
      }

      // Start drawing new selection
      setActiveSelection(null);
      setDragMode('draw');
      setDragStart(pos);
    },
    [image, selections, getImagePosition, getPixelPosition, setActiveSelection]
  );

  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      const pos = getImagePosition(e);
      if (!pos || !dragStart || dragMode === 'none') return;

      if (dragMode === 'draw') {
        // Update cursor during draw
        return;
      }

      if (dragMode === 'move' && initialSelection && activeSelectionId) {
        const dx = pos.x - dragStart.x;
        const dy = pos.y - dragStart.y;

        updateSelection(activeSelectionId, {
          x: Math.max(0, Math.min(1 - initialSelection.width, initialSelection.x + dx)),
          y: Math.max(0, Math.min(1 - initialSelection.height, initialSelection.y + dy)),
        });
      }

      if (dragMode === 'resize' && initialSelection && activeSelectionId && resizeHandle) {
        let newX = initialSelection.x;
        let newY = initialSelection.y;
        let newWidth = initialSelection.width;
        let newHeight = initialSelection.height;

        const dx = pos.x - dragStart.x;
        const dy = pos.y - dragStart.y;

        switch (resizeHandle) {
          case 'nw':
            newX = Math.min(initialSelection.x + initialSelection.width - 0.01, initialSelection.x + dx);
            newY = Math.min(initialSelection.y + initialSelection.height - 0.01, initialSelection.y + dy);
            newWidth = initialSelection.width - dx;
            newHeight = initialSelection.height - dy;
            break;
          case 'ne':
            newY = Math.min(initialSelection.y + initialSelection.height - 0.01, initialSelection.y + dy);
            newWidth = initialSelection.width + dx;
            newHeight = initialSelection.height - dy;
            break;
          case 'sw':
            newX = Math.min(initialSelection.x + initialSelection.width - 0.01, initialSelection.x + dx);
            newWidth = initialSelection.width - dx;
            newHeight = initialSelection.height + dy;
            break;
          case 'se':
            newWidth = initialSelection.width + dx;
            newHeight = initialSelection.height + dy;
            break;
        }

        // Ensure minimum size and bounds
        if (newWidth > 0.01 && newHeight > 0.01) {
          updateSelection(activeSelectionId, {
            x: Math.max(0, newX),
            y: Math.max(0, newY),
            width: Math.min(1 - Math.max(0, newX), Math.max(0.01, newWidth)),
            height: Math.min(1 - Math.max(0, newY), Math.max(0.01, newHeight)),
          });
        }
      }
    },
    [
      dragMode,
      dragStart,
      initialSelection,
      activeSelectionId,
      resizeHandle,
      getImagePosition,
      updateSelection,
    ]
  );

  const handleMouseUp = useCallback(
    (e: React.MouseEvent) => {
      const pos = getImagePosition(e);

      if (dragMode === 'draw' && dragStart && pos) {
        const width = Math.abs(pos.x - dragStart.x);
        const height = Math.abs(pos.y - dragStart.y);

        // Only create selection if it's large enough
        if (width > 0.01 && height > 0.01) {
          addSelection({
            shape: currentShape,
            mask: currentMask,
            x: Math.min(dragStart.x, pos.x),
            y: Math.min(dragStart.y, pos.y),
            width,
            height,
          });
        }
      }

      setDragMode('none');
      setDragStart(null);
      setResizeHandle(null);
      setInitialSelection(null);
    },
    [dragMode, dragStart, currentShape, currentMask, addSelection, getImagePosition]
  );

  // Draw preview during drag
  useEffect(() => {
    if (dragMode !== 'draw' || !dragStart) return;

    const canvas = canvasRef.current;
    if (!canvas || !image) return;

    const handlePreview = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      const currentX = (e.clientX - rect.left) / zoom / image.width;
      const currentY = (e.clientY - rect.top) / zoom / image.height;

      render();

      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      ctx.save();
      ctx.scale(zoom, zoom);
      ctx.strokeStyle = '#3b82f6';
      ctx.lineWidth = 2 / zoom;
      ctx.setLineDash([4 / zoom, 4 / zoom]);

      const x = Math.min(dragStart.x, currentX) * image.width;
      const y = Math.min(dragStart.y, currentY) * image.height;
      const w = Math.abs(currentX - dragStart.x) * image.width;
      const h = Math.abs(currentY - dragStart.y) * image.height;

      if (currentShape === 'circle') {
        ctx.beginPath();
        ctx.ellipse(x + w / 2, y + h / 2, w / 2, h / 2, 0, 0, Math.PI * 2);
        ctx.stroke();
      } else {
        ctx.strokeRect(x, y, w, h);
      }

      ctx.restore();
    };

    window.addEventListener('mousemove', handlePreview);
    return () => window.removeEventListener('mousemove', handlePreview);
  }, [dragMode, dragStart, currentShape, image, zoom, render]);

  // Update cursor based on hover state
  const getCursor = useCallback(() => {
    if (dragMode === 'draw') return 'crosshair';
    if (dragMode === 'move') return 'move';
    if (dragMode === 'resize') {
      if (resizeHandle === 'nw' || resizeHandle === 'se') return 'nwse-resize';
      if (resizeHandle === 'ne' || resizeHandle === 'sw') return 'nesw-resize';
    }
    return 'crosshair';
  }, [dragMode, resizeHandle]);

  if (!image) return null;

  return (
    <div
      ref={containerRef}
      className="relative overflow-auto bg-[repeating-conic-gradient(#e5e5e5_0_90deg,#f5f5f5_90deg_180deg)_0_0/20px_20px] rounded-lg"
      style={{ maxHeight: 'calc(100vh - 200px)' }}
    >
      <canvas
        ref={canvasRef}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        style={{ cursor: getCursor() }}
        className="block"
      />
      <canvas ref={sourceCanvasRef} className="hidden" />
    </div>
  );
}
