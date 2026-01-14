'use client';

import { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { Slider } from '@/components/ui/slider';
import { useEditorStore } from '@/stores/editor-store';

export function SettingsPanel() {
  const [isOpen, setIsOpen] = useState(true);
  const { concealLevel, zoom, showBorders, setConcealLevel, setZoom, setShowBorders } = useEditorStore();

  return (
    <div className="bg-card border rounded-lg shadow-sm overflow-hidden">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between p-3 hover:bg-muted/50 transition-colors"
      >
        <span className="text-sm font-medium">Settings</span>
        {isOpen ? (
          <ChevronUp className="h-4 w-4 text-muted-foreground" />
        ) : (
          <ChevronDown className="h-4 w-4 text-muted-foreground" />
        )}
      </button>

      {isOpen && (
        <div className="p-3 pt-0 space-y-4">
          {/* Conceal Level */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">Conceal level:</span>
              <span className="text-xs font-medium">{concealLevel}</span>
            </div>
            <Slider
              value={[concealLevel]}
              onValueChange={([value]) => setConcealLevel(value)}
              min={1}
              max={10}
              step={1}
              className="w-full"
            />
          </div>

          {/* Zoom Level */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">Zoom level:</span>
              <span className="text-xs font-medium">{Math.round(zoom * 100)}%</span>
            </div>
            <Slider
              value={[zoom]}
              onValueChange={([value]) => setZoom(value)}
              min={0.5}
              max={2}
              step={0.1}
              className="w-full"
            />
          </div>

          {/* Show Borders Toggle */}
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">Show borders:</span>
            <button
              onClick={() => setShowBorders(!showBorders)}
              className={`relative w-10 h-5 rounded-full transition-colors ${
                showBorders ? 'bg-primary' : 'bg-muted'
              }`}
            >
              <span
                className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${
                  showBorders ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
