import { create } from 'zustand';
import { v4 as uuidv4 } from 'uuid';
import type { Selection, ShapeType, MaskType } from '@/types/editor';

interface EditorState {
  // Image state
  image: HTMLImageElement | null;
  imageDataUrl: string | null;

  // Selections
  selections: Selection[];
  activeSelectionId: string | null;

  // Tool settings
  currentShape: ShapeType;
  currentMask: MaskType;
  concealLevel: number; // 1-10
  zoom: number; // 0.5-2
  showBorders: boolean; // Show selection borders

  // Actions
  setImage: (image: HTMLImageElement, dataUrl: string) => void;
  clearImage: () => void;
  addSelection: (selection: Omit<Selection, 'id'>) => string;
  updateSelection: (id: string, updates: Partial<Selection>) => void;
  removeSelection: (id: string) => void;
  setActiveSelection: (id: string | null) => void;
  setCurrentShape: (shape: ShapeType) => void;
  setCurrentMask: (mask: MaskType) => void;
  setConcealLevel: (level: number) => void;
  setZoom: (zoom: number) => void;
  setShowBorders: (show: boolean) => void;
  applyMaskToSelection: (id: string, mask: MaskType) => void;
}

export const useEditorStore = create<EditorState>((set, get) => ({
  // Initial state
  image: null,
  imageDataUrl: null,
  selections: [],
  activeSelectionId: null,
  currentShape: 'rectangle',
  currentMask: 'black',
  concealLevel: 5,
  zoom: 1,
  showBorders: true,

  // Actions
  setImage: (image, dataUrl) => set({
    image,
    imageDataUrl: dataUrl,
    selections: [],
    activeSelectionId: null
  }),

  clearImage: () => set({
    image: null,
    imageDataUrl: null,
    selections: [],
    activeSelectionId: null
  }),

  addSelection: (selection) => {
    const id = uuidv4();
    set((state) => ({
      selections: [...state.selections, { ...selection, id }],
      activeSelectionId: id,
    }));
    return id;
  },

  updateSelection: (id, updates) => set((state) => ({
    selections: state.selections.map((s) =>
      s.id === id ? { ...s, ...updates } : s
    ),
  })),

  removeSelection: (id) => set((state) => ({
    selections: state.selections.filter((s) => s.id !== id),
    activeSelectionId: state.activeSelectionId === id ? null : state.activeSelectionId,
  })),

  setActiveSelection: (id) => set({ activeSelectionId: id }),

  setCurrentShape: (shape) => set({ currentShape: shape }),

  setCurrentMask: (mask) => {
    const { activeSelectionId, selections } = get();
    // Also update active selection's mask type
    if (activeSelectionId) {
      set((state) => ({
        currentMask: mask,
        selections: state.selections.map((s) =>
          s.id === activeSelectionId ? { ...s, mask } : s
        ),
      }));
    } else {
      set({ currentMask: mask });
    }
  },

  setConcealLevel: (level) => set({ concealLevel: Math.max(1, Math.min(10, level)) }),

  setZoom: (zoom) => set({ zoom: Math.max(0.5, Math.min(2, zoom)) }),

  setShowBorders: (show) => set({ showBorders: show }),

  applyMaskToSelection: (id, mask) => set((state) => ({
    selections: state.selections.map((s) =>
      s.id === id ? { ...s, mask } : s
    ),
  })),
}));
