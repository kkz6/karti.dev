import React from 'react';
import { Loader2 } from 'lucide-react';

interface LoadingGraphicProps {
  text?: string;
  className?: string;
}

export const LoadingGraphic: React.FC<LoadingGraphicProps> = ({ 
  text = 'Loading',
  className = ''
}) => {
  return (
    <div className={`loading flex items-center gap-2 ${className}`}>
      <Loader2 className="h-4 w-4 animate-spin" />
      {text}
    </div>
  );
};
