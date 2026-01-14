'use client';

import { Square, Circle, EyeOff, Grid3X3, Droplets, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useEditorStore } from '@/stores/editor-store';
import type { ShapeType, MaskType } from '@/types/editor';

export function Toolbar() {
  const {
    currentShape,
    currentMask,
    activeSelectionId,
    setCurrentShape,
    setCurrentMask,
    removeSelection,
  } = useEditorStore();

  const shapes: { type: ShapeType; icon: typeof Square; label: string }[] = [
    { type: 'rectangle', icon: Square, label: 'Rectangle' },
    { type: 'circle', icon: Circle, label: 'Circle' },
  ];

  const masks: { type: MaskType; icon: typeof EyeOff; label: string }[] = [
    { type: 'black', icon: EyeOff, label: 'Black box' },
    { type: 'pixelate', icon: Grid3X3, label: 'Pixelate' },
    { type: 'blur', icon: Droplets, label: 'Blur' },
  ];

  const handleDelete = () => {
    if (activeSelectionId) {
      removeSelection(activeSelectionId);
    }
  };

  return (
    <div className="flex items-center gap-6 p-3 bg-card border rounded-lg shadow-sm">
      {/* Shape selection */}
      <div className="flex items-center gap-1">
        <span className="text-xs font-medium text-muted-foreground mr-2">SHAPE</span>
        {shapes.map(({ type, icon: Icon, label }) => (
          <Button
            key={type}
            variant={currentShape === type ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setCurrentShape(type)}
            title={label}
          >
            <Icon className="h-4 w-4" />
          </Button>
        ))}
      </div>

      {/* Divider */}
      <div className="h-6 w-px bg-border" />

      {/* Mask type selection */}
      <div className="flex items-center gap-1">
        <span className="text-xs font-medium text-muted-foreground mr-2">MASKING</span>
        {masks.map(({ type, icon: Icon, label }) => (
          <Button
            key={type}
            variant={currentMask === type ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setCurrentMask(type)}
            title={label}
          >
            <Icon className="h-4 w-4" />
          </Button>
        ))}
      </div>

      {/* Divider */}
      <div className="h-6 w-px bg-border" />

      {/* Actions */}
      <div className="flex items-center gap-1">
        <span className="text-xs font-medium text-muted-foreground mr-2">ACTIONS</span>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleDelete}
          disabled={!activeSelectionId}
          title="Delete selection"
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
