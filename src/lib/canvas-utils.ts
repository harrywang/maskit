import type { Selection, MaskType } from '@/types/editor';

/**
 * Apply black box effect to a region
 */
export function applyBlackBox(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  shape: 'rectangle' | 'circle'
) {
  ctx.save();
  ctx.fillStyle = '#000000';

  if (shape === 'circle') {
    ctx.beginPath();
    ctx.ellipse(
      x + width / 2,
      y + height / 2,
      width / 2,
      height / 2,
      0,
      0,
      Math.PI * 2
    );
    ctx.fill();
  } else {
    ctx.fillRect(x, y, width, height);
  }

  ctx.restore();
}

/**
 * Apply pixelate effect to a region
 */
export function applyPixelate(
  ctx: CanvasRenderingContext2D,
  sourceCanvas: HTMLCanvasElement,
  x: number,
  y: number,
  width: number,
  height: number,
  blockSize: number,
  shape: 'rectangle' | 'circle'
) {
  if (width <= 0 || height <= 0) return;

  // Get the source image data
  const sourceCtx = sourceCanvas.getContext('2d');
  if (!sourceCtx) return;

  // Clamp coordinates to canvas bounds
  const sx = Math.max(0, Math.floor(x));
  const sy = Math.max(0, Math.floor(y));
  const sw = Math.min(Math.ceil(width), sourceCanvas.width - sx);
  const sh = Math.min(Math.ceil(height), sourceCanvas.height - sy);

  if (sw <= 0 || sh <= 0) return;

  const imageData = sourceCtx.getImageData(sx, sy, sw, sh);
  const data = imageData.data;

  // Calculate center for circle check
  const centerX = width / 2;
  const centerY = height / 2;
  const radiusX = width / 2;
  const radiusY = height / 2;

  // Process each block
  for (let by = 0; by < sh; by += blockSize) {
    for (let bx = 0; bx < sw; bx += blockSize) {
      // Get the center pixel of the block
      const sampleX = Math.min(bx + Math.floor(blockSize / 2), sw - 1);
      const sampleY = Math.min(by + Math.floor(blockSize / 2), sh - 1);
      const sampleIdx = (sampleY * sw + sampleX) * 4;

      const r = data[sampleIdx];
      const g = data[sampleIdx + 1];
      const b = data[sampleIdx + 2];

      // Fill the block with the sampled color
      for (let py = by; py < Math.min(by + blockSize, sh); py++) {
        for (let px = bx; px < Math.min(bx + blockSize, sw); px++) {
          // For circle shape, check if pixel is inside ellipse
          if (shape === 'circle') {
            const dx = (px - centerX) / radiusX;
            const dy = (py - centerY) / radiusY;
            if (dx * dx + dy * dy > 1) continue;
          }

          const idx = (py * sw + px) * 4;
          data[idx] = r;
          data[idx + 1] = g;
          data[idx + 2] = b;
        }
      }
    }
  }

  // Apply clip path for circle shape
  ctx.save();
  if (shape === 'circle') {
    ctx.beginPath();
    ctx.ellipse(
      x + width / 2,
      y + height / 2,
      width / 2,
      height / 2,
      0,
      0,
      Math.PI * 2
    );
    ctx.clip();
  }

  // Create temporary canvas to put the modified data
  const tempCanvas = document.createElement('canvas');
  tempCanvas.width = sw;
  tempCanvas.height = sh;
  const tempCtx = tempCanvas.getContext('2d');
  if (tempCtx) {
    tempCtx.putImageData(imageData, 0, 0);
    ctx.drawImage(tempCanvas, sx, sy);
  }

  ctx.restore();
}

/**
 * Apply blur effect to a region
 */
export function applyBlur(
  ctx: CanvasRenderingContext2D,
  sourceCanvas: HTMLCanvasElement,
  x: number,
  y: number,
  width: number,
  height: number,
  blurRadius: number,
  shape: 'rectangle' | 'circle'
) {
  if (width <= 0 || height <= 0) return;

  // Clamp coordinates
  const sx = Math.max(0, Math.floor(x));
  const sy = Math.max(0, Math.floor(y));
  const sw = Math.min(Math.ceil(width), sourceCanvas.width - sx);
  const sh = Math.min(Math.ceil(height), sourceCanvas.height - sy);

  if (sw <= 0 || sh <= 0) return;

  // Create temporary canvas with blur filter
  const tempCanvas = document.createElement('canvas');
  // Add padding for blur overflow
  const padding = blurRadius * 2;
  tempCanvas.width = sw + padding * 2;
  tempCanvas.height = sh + padding * 2;

  const tempCtx = tempCanvas.getContext('2d');
  if (!tempCtx) return;

  // Apply blur filter and draw the region
  tempCtx.filter = `blur(${blurRadius}px)`;
  tempCtx.drawImage(
    sourceCanvas,
    Math.max(0, sx - padding),
    Math.max(0, sy - padding),
    sw + padding * 2,
    sh + padding * 2,
    0,
    0,
    sw + padding * 2,
    sh + padding * 2
  );

  // Draw back to main canvas with clip
  ctx.save();
  if (shape === 'circle') {
    ctx.beginPath();
    ctx.ellipse(
      x + width / 2,
      y + height / 2,
      width / 2,
      height / 2,
      0,
      0,
      Math.PI * 2
    );
    ctx.clip();
  } else {
    ctx.beginPath();
    ctx.rect(x, y, width, height);
    ctx.clip();
  }

  ctx.drawImage(
    tempCanvas,
    padding,
    padding,
    sw,
    sh,
    sx,
    sy,
    sw,
    sh
  );

  ctx.restore();
}

/**
 * Apply mask effect to a selection
 */
export function applyMask(
  ctx: CanvasRenderingContext2D,
  sourceCanvas: HTMLCanvasElement,
  selection: Selection,
  imageWidth: number,
  imageHeight: number,
  concealLevel: number
) {
  // Convert normalized coordinates to pixel coordinates
  const x = selection.x * imageWidth;
  const y = selection.y * imageHeight;
  const width = selection.width * imageWidth;
  const height = selection.height * imageHeight;

  switch (selection.mask) {
    case 'black':
      applyBlackBox(ctx, x, y, width, height, selection.shape);
      break;
    case 'pixelate':
      // Block size: 4-40 pixels based on conceal level
      const blockSize = Math.max(4, concealLevel * 4);
      applyPixelate(ctx, sourceCanvas, x, y, width, height, blockSize, selection.shape);
      break;
    case 'blur':
      // Blur radius: 2-20 pixels based on conceal level
      const blurRadius = Math.max(2, concealLevel * 2);
      applyBlur(ctx, sourceCanvas, x, y, width, height, blurRadius, selection.shape);
      break;
  }
}

/**
 * Draw selection border and handles
 */
export function drawSelectionOverlay(
  ctx: CanvasRenderingContext2D,
  selection: Selection,
  imageWidth: number,
  imageHeight: number,
  isActive: boolean
) {
  const x = selection.x * imageWidth;
  const y = selection.y * imageHeight;
  const width = selection.width * imageWidth;
  const height = selection.height * imageHeight;

  ctx.save();

  // Draw dashed border for all selections (like redacted.app)
  ctx.strokeStyle = isActive ? '#3b82f6' : '#64748b';
  ctx.lineWidth = 1.5;
  ctx.setLineDash([5, 5]);

  if (selection.shape === 'circle') {
    ctx.beginPath();
    ctx.ellipse(
      x + width / 2,
      y + height / 2,
      width / 2,
      height / 2,
      0,
      0,
      Math.PI * 2
    );
    ctx.stroke();
  } else {
    ctx.strokeRect(x, y, width, height);
  }

  // Draw resize handles for active selection only
  if (isActive) {
    const handleSize = 8;
    ctx.fillStyle = '#3b82f6';
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 1;
    ctx.setLineDash([]);

    const handles = [
      { x: x - handleSize / 2, y: y - handleSize / 2 }, // NW
      { x: x + width - handleSize / 2, y: y - handleSize / 2 }, // NE
      { x: x - handleSize / 2, y: y + height - handleSize / 2 }, // SW
      { x: x + width - handleSize / 2, y: y + height - handleSize / 2 }, // SE
    ];

    handles.forEach((handle) => {
      ctx.fillRect(handle.x, handle.y, handleSize, handleSize);
      ctx.strokeRect(handle.x, handle.y, handleSize, handleSize);
    });
  }

  ctx.restore();
}

/**
 * Check which part of a selection is under the cursor
 */
export function hitTestSelection(
  x: number,
  y: number,
  selection: Selection,
  imageWidth: number,
  imageHeight: number
): 'inside' | 'nw' | 'ne' | 'sw' | 'se' | null {
  const sx = selection.x * imageWidth;
  const sy = selection.y * imageHeight;
  const sw = selection.width * imageWidth;
  const sh = selection.height * imageHeight;

  const handleSize = 12; // Slightly larger hit area

  // Check corners first (resize handles)
  if (Math.abs(x - sx) < handleSize && Math.abs(y - sy) < handleSize) return 'nw';
  if (Math.abs(x - (sx + sw)) < handleSize && Math.abs(y - sy) < handleSize) return 'ne';
  if (Math.abs(x - sx) < handleSize && Math.abs(y - (sy + sh)) < handleSize) return 'sw';
  if (Math.abs(x - (sx + sw)) < handleSize && Math.abs(y - (sy + sh)) < handleSize) return 'se';

  // Check if inside selection
  if (selection.shape === 'circle') {
    const cx = sx + sw / 2;
    const cy = sy + sh / 2;
    const rx = sw / 2;
    const ry = sh / 2;
    const dx = (x - cx) / rx;
    const dy = (y - cy) / ry;
    if (dx * dx + dy * dy <= 1) return 'inside';
  } else {
    if (x >= sx && x <= sx + sw && y >= sy && y <= sy + sh) return 'inside';
  }

  return null;
}
