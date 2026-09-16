import { Button } from '@shared/components/ui/button';
import { cn } from '@shared/lib/utils';
import { CircleAlert, CircleCheck, FileUp, X } from 'lucide-react';
import { useId } from 'react';
import type { MediaUpload } from '../../types/media';
import { uploadPresentation } from '../../utils/upload-status';

interface UploadProps {
    upload: MediaUpload;
    onClear?: () => void;
}

export function Upload({ upload, onClear }: UploadProps) {
    const descriptionId = useId();
    const { failed, completed, progress, label, message } = uploadPresentation(upload);
    const Icon = failed ? CircleAlert : completed ? CircleCheck : FileUp;

    return (
        <li className="upload-row grid grid-cols-[2rem_minmax(0,1fr)_auto] items-start gap-x-3 px-4 py-4 sm:px-5">
            <div
                className={cn(
                    'bg-muted text-muted-foreground flex size-8 items-center justify-center rounded-md',
                    failed && 'bg-destructive/10 text-destructive',
                    completed && 'bg-primary/10 text-primary',
                )}
            >
                <Icon className="size-4" aria-hidden="true" />
            </div>
            <div className="min-w-0 pt-0.5">
                <div className="flex min-w-0 flex-wrap items-baseline gap-x-3 gap-y-1">
                    <span className="text-foreground min-w-0 text-sm font-medium break-all">{upload.name}</span>
                    <span className={cn('text-muted-foreground text-xs tabular-nums', failed && 'text-destructive', completed && 'text-primary')}>
                        {label}
                    </span>
                </div>
                {message && (
                    <p
                        id={descriptionId}
                        role={failed ? 'alert' : undefined}
                        className="text-muted-foreground mt-1 max-w-prose text-xs leading-relaxed break-words"
                    >
                        {message}
                    </p>
                )}
                {!failed && !completed && (
                    <div
                        role="progressbar"
                        aria-label={`Uploading ${upload.name}`}
                        aria-valuemin={0}
                        aria-valuemax={100}
                        aria-valuenow={progress}
                        aria-valuetext={label}
                        className="bg-muted mt-2.5 h-1 overflow-hidden rounded-full"
                    >
                        <div
                            className="bg-primary h-full origin-left transition-transform duration-200 motion-reduce:transition-none"
                            style={{ transform: `scaleX(${progress / 100})` }}
                        />
                    </div>
                )}
            </div>
            {onClear && (failed || completed) ? (
                <Button
                    variant="ghost"
                    size="icon"
                    onClick={onClear}
                    aria-label={`Dismiss ${upload.name} upload status`}
                    aria-describedby={message ? descriptionId : undefined}
                    className="text-muted-foreground -mr-1 shrink-0"
                >
                    <X className="size-4" aria-hidden="true" />
                </Button>
            ) : (
                <span className="size-8" aria-hidden="true" />
            )}
        </li>
    );
}
