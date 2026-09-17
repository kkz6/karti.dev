import type { DragEvent, HTMLAttributes } from 'react';
import { createContext, useContext } from 'react';

export const MEDIA_DRAG_TYPE = 'application/x-media-assets';
export const normalizeFolder = (path: string) => path.replace(/^\/+|\/+$/g, '') || '/';

export const MediaMoveContext = createContext<{
    moving: boolean;
    start: (event: DragEvent, id: string) => void;
    end: () => void;
    open: (ids: string[]) => void;
    folderProps: (path: string) => HTMLAttributes<HTMLElement> & { 'data-drop-target'?: boolean };
} | null>(null);

export const useMediaMove = () => useContext(MediaMoveContext);
