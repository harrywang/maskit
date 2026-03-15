# Maskit

A free, privacy-focused image redaction tool. Blur, pixelate, or black out sensitive information in images — entirely in your browser. No uploads, no servers, 100% client-side.

## Features

- **Three masking modes:** Black, Pixelate, and Blur
- **Adjustable intensity:** 1–10 scale for blur and pixelate effects
- **Rectangle and circle selections** for flexible redaction shapes
- **Drag-and-drop, file picker, or clipboard paste** to load images
- **Zoom controls** for precise editing
- **Download** redacted images as PNG
- **Complete privacy:** all processing happens locally in your browser

## Getting Started

### Prerequisites

- Node.js 18+
- pnpm (recommended) or npm

### Installation

```bash
git clone https://github.com/harrywang/maskit.git
cd maskit
pnpm install
```

### Development

```bash
pnpm dev          # Start dev server at http://localhost:3000
pnpm dev:turbo    # Start with Turbopack for faster builds
```

### Production

```bash
pnpm build
pnpm start
```

## Usage

1. **Load an image** — drag and drop, click "Select image", or paste from clipboard (Ctrl/Cmd+V)
2. **Draw selections** — click and drag to create redaction regions
3. **Choose a mask type** — Black, Pixelate, or Blur from the toolbar
4. **Adjust intensity** — use the slider to control blur/pixelate strength
5. **Download** — save the redacted image as PNG

### Keyboard Shortcuts

| Key | Action |
|---|---|
| `Delete` / `Backspace` | Remove selected redaction |
| `Escape` | Deselect current redaction |

## Tech Stack

- [Next.js](https://nextjs.org/) (App Router)
- [React](https://react.dev/) 19
- [TypeScript](https://www.typescriptlang.org/)
- [Tailwind CSS](https://tailwindcss.com/)
- [Zustand](https://zustand.docs.pmnd.rs/) for state management
- [Shadcn/ui](https://ui.shadcn.com/) components
- Canvas API for image processing

## License

[MIT](LICENSE)
