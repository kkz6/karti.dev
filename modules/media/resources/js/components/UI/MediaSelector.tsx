import React, { useRef } from 'react';
import { Selector } from './Selector';
import { MediaAsset } from '../types/media';

interface MediaSelectorProps {
  open: boolean;
  container?: string;
  canEdit?: boolean;
  onClosed: () => void;
  onSelected: (asset: MediaAsset) => void;
}

export const MediaSelector: React.FC<MediaSelectorProps> = ({
  open,
  container = "main",
  canEdit = false,
  onClosed,
  onSelected
}) => {
  const selectorRef = useRef<any>(null);

  const handleSelectedAsset = () => {
    if (selectorRef.current) {
      // Get the selected asset from the selector
      const asset = selectorRef.current.getSelectedAsset();
      if (asset) {
        onSelected(asset);
      }
    }
  };

  if (!open) {
    return null;
  }

  return (
    <Selector
      ref={selectorRef}
      container={container}
      folder="/"
      restrictNavigation={false}
      selected={[]}
      viewMode="grid"
      maxFiles={1}
      canEdit={canEdit}
      onClosed={onClosed}
      onSelected={handleSelectedAsset}
    />
  );
};
