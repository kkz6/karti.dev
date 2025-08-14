import React from 'react';
import { AlertCircle, X } from 'lucide-react';
import { Button } from '@shared/components/ui/button';
import { FileIcon } from './FileIcon';
import { LoadingGraphic } from './LoadingGraphic';

interface UploadProps {
  extension: string;
  basename: string;
  percent: number;
  error?: string | null;
  onClear: () => void;
}

export const Upload: React.FC<UploadProps> = ({
  extension,
  basename,
  percent,
  error,
  onClear
}) => {
  const getStatus = () => {
    if (error) {
      return "error";
    } else if (percent === 100) {
      return "pending";
    } else {
      return "uploading";
    }
  };

  const status = getStatus();

  return (
    <tr className={`upload-row ${status}`}>
      <td className="column-status p-2">
        {status === 'error' ? (
          <AlertCircle className="h-4 w-4 text-red-500" />
        ) : (
          <LoadingGraphic text="" />
        )}
      </td>
      
      <td className="column-thumbnail p-2">
        <div className="w-8 h-8 flex items-center justify-center">
          <FileIcon extension={extension} className="w-6 h-6" />
        </div>
      </td>

      <td className="column-filename p-2">
        <span className="filename font-medium">{basename}</span>
      </td>

      {status === 'error' ? (
        <td className="column-error p-2 text-red-600 text-sm">
          {error}
        </td>
      ) : (
        <td className="column-progress p-2">
          <div className="w-full bg-gray-200 rounded-full">
            <div
              className="bg-blue-600 text-xs font-medium text-blue-100 text-center p-0.5 leading-none rounded-full transition-all"
              style={{ width: `${percent}%` }}
            >
              {percent}%
            </div>
          </div>
        </td>
      )}

      <td className="w-8 p-2">
        {status === 'error' && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onClear}
            className="h-6 w-6 p-0 hover:bg-red-100"
          >
            <X className="h-4 w-4 text-red-500" />
          </Button>
        )}
      </td>
    </tr>
  );
};
