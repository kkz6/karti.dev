import React, { useState, useRef, useCallback, useEffect } from 'react';
import { NodeViewWrapper, NodeViewProps } from '@tiptap/react';
import { Button } from '@shared/components/ui/button';
import { 
  AlignLeft, 
  AlignCenter, 
  AlignRight, 
  RotateCw, 
  Maximize2, 
  Minimize2,
  Trash2
} from 'lucide-react';
import './resizable-image.scss';

export const ResizableImageComponent: React.FC<NodeViewProps> = ({
  node,
  selected,
  updateAttributes,
  deleteNode,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);
  const [isResizing, setIsResizing] = useState(false);
  const [showControls, setShowControls] = useState(false);
  const [aspectRatio, setAspectRatio] = useState<number | null>(null);
  
  const { src, alt, title, width, height, alignment } = node.attrs;

  useEffect(() => {
    if (imgRef.current && !aspectRatio) {
      const img = imgRef.current;
      if (img.naturalWidth && img.naturalHeight) {
        setAspectRatio(img.naturalWidth / img.naturalHeight);
      }
    }
  }, [src, aspectRatio]);

  const handleResize = useCallback(
    (e: React.MouseEvent, direction: string) => {
      e.preventDefault();
      e.stopPropagation();

      const startX = e.clientX;
      const startY = e.clientY;
      const startWidth = imgRef.current?.offsetWidth || 0;
      const startHeight = imgRef.current?.offsetHeight || 0;

      const handleMouseMove = (e: MouseEvent) => {
        let newWidth = startWidth;
        let newHeight = startHeight;

        if (direction.includes('right')) {
          newWidth = startWidth + (e.clientX - startX);
        }
        if (direction.includes('left')) {
          newWidth = startWidth - (e.clientX - startX);
        }
        if (direction.includes('bottom')) {
          newHeight = startHeight + (e.clientY - startY);
        }
        if (direction.includes('top')) {
          newHeight = startHeight - (e.clientY - startY);
        }

        // Maintain aspect ratio if shift key is held
        if (e.shiftKey && aspectRatio) {
          if (direction.includes('right') || direction.includes('left')) {
            newHeight = newWidth / aspectRatio;
          } else {
            newWidth = newHeight * aspectRatio;
          }
        }

        // Minimum size constraints
        newWidth = Math.max(50, newWidth);
        newHeight = Math.max(50, newHeight);

        updateAttributes({
          width: Math.round(newWidth),
          height: Math.round(newHeight),
        });
      };

      const handleMouseUp = () => {
        setIsResizing(false);
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };

      setIsResizing(true);
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    },
    [aspectRatio, updateAttributes]
  );

  const handleAlignment = (newAlignment: 'left' | 'center' | 'right') => {
    updateAttributes({ alignment: newAlignment });
  };

  const handleRotate = () => {
    if (imgRef.current) {
      const currentRotation = imgRef.current.style.transform 
        ? parseInt(imgRef.current.style.transform.replace(/[^0-9-]/g, '')) 
        : 0;
      const newRotation = (currentRotation + 90) % 360;
      imgRef.current.style.transform = `rotate(${newRotation}deg)`;
    }
  };

  const handleFitToContainer = () => {
    if (containerRef.current && imgRef.current) {
      const containerWidth = containerRef.current.offsetWidth;
      const img = imgRef.current;
      
      if (aspectRatio) {
        updateAttributes({
          width: containerWidth - 40, // Padding
          height: Math.round((containerWidth - 40) / aspectRatio),
        });
      }
    }
  };

  const handleResetSize = () => {
    if (imgRef.current) {
      updateAttributes({
        width: imgRef.current.naturalWidth,
        height: imgRef.current.naturalHeight,
      });
    }
  };

  return (
    <NodeViewWrapper 
      className={`resizable-image-wrapper ${selected ? 'selected' : ''}`}
      style={{ textAlign: alignment }}
      ref={containerRef}
      onMouseEnter={() => setShowControls(true)}
      onMouseLeave={() => !selected && setShowControls(false)}
    >
      <div className="resizable-image-container" style={{ display: 'inline-block', position: 'relative' }}>
        {(selected || showControls) && (
          <div className="image-controls">
            <div className="control-group">
              <Button
                size="sm"
                variant="ghost"
                onClick={() => handleAlignment('left')}
                className={alignment === 'left' ? 'active' : ''}
                title="Align left"
              >
                <AlignLeft className="w-4 h-4" />
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => handleAlignment('center')}
                className={alignment === 'center' ? 'active' : ''}
                title="Align center"
              >
                <AlignCenter className="w-4 h-4" />
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => handleAlignment('right')}
                className={alignment === 'right' ? 'active' : ''}
                title="Align right"
              >
                <AlignRight className="w-4 h-4" />
              </Button>
            </div>
            
            <div className="control-group">
              <Button
                size="sm"
                variant="ghost"
                onClick={handleRotate}
                title="Rotate 90°"
              >
                <RotateCw className="w-4 h-4" />
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={handleFitToContainer}
                title="Fit to container"
              >
                <Maximize2 className="w-4 h-4" />
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={handleResetSize}
                title="Reset to original size"
              >
                <Minimize2 className="w-4 h-4" />
              </Button>
            </div>

            <div className="control-group">
              <Button
                size="sm"
                variant="ghost"
                onClick={deleteNode}
                title="Delete image"
                className="text-destructive"
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>

            {width && height && (
              <div className="size-indicator">
                {width} × {height}
              </div>
            )}
          </div>
        )}

        <img
          ref={imgRef}
          src={src}
          alt={alt || ''}
          title={title || ''}
          width={width}
          height={height}
          className={`resizable-image ${isResizing ? 'resizing' : ''}`}
          draggable={false}
        />

        {selected && (
          <>
            <div
              className="resize-handle top-left"
              onMouseDown={(e) => handleResize(e, 'top-left')}
            />
            <div
              className="resize-handle top-right"
              onMouseDown={(e) => handleResize(e, 'top-right')}
            />
            <div
              className="resize-handle bottom-left"
              onMouseDown={(e) => handleResize(e, 'bottom-left')}
            />
            <div
              className="resize-handle bottom-right"
              onMouseDown={(e) => handleResize(e, 'bottom-right')}
            />
            <div
              className="resize-handle top"
              onMouseDown={(e) => handleResize(e, 'top')}
            />
            <div
              className="resize-handle right"
              onMouseDown={(e) => handleResize(e, 'right')}
            />
            <div
              className="resize-handle bottom"
              onMouseDown={(e) => handleResize(e, 'bottom')}
            />
            <div
              className="resize-handle left"
              onMouseDown={(e) => handleResize(e, 'left')}
            />
          </>
        )}
      </div>
    </NodeViewWrapper>
  );
};