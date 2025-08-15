import React from 'react';

interface SvgIconProps {
  name: string;
  type?: 'svg' | 'div';
  className?: string;
}

export const SvgIcon: React.FC<SvgIconProps> = ({ 
  name, 
  type = 'svg',
  className = 'svg-icon'
}) => {
  const imageSrc = `/svg/${name}.svg`;

  if (type === 'div') {
    return (
      <div
        className={className}
        style={{ backgroundImage: `url('${imageSrc}')` }}
      />
    );
  }

  return (
    <img 
      src={imageSrc} 
      alt={name}
      className={className}
    />
  );
};
