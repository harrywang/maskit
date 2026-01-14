export type ShapeType = 'rectangle' | 'circle';
export type MaskType = 'black' | 'pixelate' | 'blur';

export interface Selection {
  id: string;
  shape: ShapeType;
  mask: MaskType;
  // Normalized coordinates (0-1 relative to image dimensions)
  x: number;
  y: number;
  width: number;
  height: number;
}

export type ResizeHandle = 'nw' | 'ne' | 'sw' | 'se' | null;
export type DragMode = 'none' | 'draw' | 'move' | 'resize';

export interface Point {
  x: number;
  y: number;
}
