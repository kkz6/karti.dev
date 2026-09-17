import { router, useForm } from '@inertiajs/react';
import { Button } from '@shared/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@shared/components/ui/dialog';
import { Input } from '@shared/components/ui/input';
import { Label } from '@shared/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@shared/components/ui/select';
import { Crop, Image, Maximize, Pencil, Plus, RefreshCw, Save, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { ImageProcessingDefaults, ServerCompressionDefaults } from './image-processing-defaults';

export interface ImagePreset {
    name: string;
    width: number;
    height: number | null;
    fit: string;
    format: string;
    quality: number;
}

export interface CompressionDefaults {
    enabled: boolean;
    encodingQuality: number;
    optimizers: { name: string; options: string[] }[];
}

const formats: Record<string, string> = { webp: 'WebP', jpg: 'JPEG', png: 'PNG' };
const blank: ImagePreset = { name: '', width: 960, height: null, fit: 'contain', format: 'webp', quality: 80 };

export function MediaSettingsForm({
    presets,
    builtInNames,
    compression,
    message,
}: {
    presets: ImagePreset[];
    builtInNames: string[];
    compression: CompressionDefaults;
    message?: string;
}) {
    const form = useForm({ presets });
    const [editor, setEditor] = useState<{ index: number; originalName: string; draft: ImagePreset } | null>(null);
    const [rebuilding, setRebuilding] = useState(false);
    const [removing, setRemoving] = useState(false);
    const [requestError, setRequestError] = useState('');
    const errors = form.errors as Record<string, string>;
    const builtIn = Boolean(editor && builtInNames.includes(editor.originalName));
    const customPresets = form.data.presets.map((preset, index) => ({ preset, index })).filter(({ preset }) => !builtInNames.includes(preset.name));
    const errorFor = (key: keyof ImagePreset) => (editor ? errors[`presets.${editor.index}.${key}`] : undefined);
    const edit = (index: number) => {
        if (builtInNames.includes(form.data.presets[index]?.name)) return;
        form.clearErrors();
        setRemoving(false);
        setEditor({ index, originalName: form.data.presets[index]?.name ?? '', draft: { ...(form.data.presets[index] ?? blank) } });
    };
    const update = (value: Partial<ImagePreset>) => {
        if (editor) setEditor({ ...editor, draft: { ...editor.draft, ...value } });
        form.clearErrors();
    };
    const save = (next: ImagePreset[]) => {
        form.transform(() => ({ presets: next }));
        form.put(route('admin.settings.media.update'), {
            preserveScroll: true,
            onSuccess: (page) => {
                const saved = (page.props.mediaSettings as { presets: ImagePreset[] }).presets;
                form.setData({ presets: saved });
                form.setDefaults({ presets: saved });
                setEditor(null);
                setRemoving(false);
            },
        });
    };

    return (
        <section aria-labelledby="image-defaults-heading">
            <ImageProcessingDefaults presets={form.data.presets.filter((preset) => builtInNames.includes(preset.name))} />
            <div className="border-border/70 mt-7 border-t pt-7">
                <div className="flex flex-wrap items-center justify-between gap-4 pb-3">
                    <div className="space-y-1.5">
                        <h2 id="image-sizes-heading" className="text-sm font-semibold">
                            Custom sizes
                        </h2>
                    </div>
                    <Button type="button" variant="outline" onClick={() => edit(form.data.presets.length)} disabled={form.data.presets.length >= 12}>
                        <Plus />
                        Add custom size
                    </Button>
                </div>
                <ul className="divide-border/60 divide-y">
                    {customPresets.map(({ preset, index }) => (
                        <li
                            key={preset.name}
                            className="group grid grid-cols-[2.5rem_minmax(0,1fr)_auto] items-center gap-x-4 gap-y-2 py-5 sm:grid-cols-[2.5rem_minmax(0,1fr)_auto_auto]"
                        >
                            <span
                                aria-hidden="true"
                                className="bg-muted/50 text-muted-foreground flex size-10 items-center justify-center rounded-md"
                            >
                                {preset.fit === 'cover' ? <Crop className="size-4" /> : <Image className="size-4" />}
                            </span>
                            <div className="min-w-0">
                                <p className="truncate text-sm font-medium">{preset.name}</p>
                                <p className="text-muted-foreground mt-1 text-xs leading-relaxed">Available to website templates</p>
                            </div>
                            <div className="col-start-2 row-start-2 text-xs sm:col-start-auto sm:row-start-auto sm:px-6 sm:text-right">
                                <p className="font-mono tabular-nums">
                                    {preset.width}
                                    {preset.height ? ` × ${preset.height}` : ' × auto'} px
                                </p>
                                <p className="text-muted-foreground mt-1">
                                    {formats[preset.format]} · {preset.fit === 'cover' ? 'Crop' : 'Fit'}
                                    {preset.format !== 'png' && ` · ${preset.quality}%`}
                                </p>
                            </div>
                            <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                className="col-start-3 row-start-1 sm:col-start-4"
                                aria-label={`Edit ${preset.name}`}
                                onClick={() => edit(index)}
                            >
                                <Pencil className="size-3.5" />
                                <span className="hidden sm:inline">Edit</span>
                            </Button>
                        </li>
                    ))}
                </ul>
                {customPresets.length === 0 && <p className="text-muted-foreground py-3 text-sm">No custom sizes added.</p>}
                <div className="border-border/70 mt-3 flex flex-wrap items-center justify-between gap-4 border-t pt-5">
                    <div className="max-w-xl space-y-1">
                        <p className="text-sm font-medium">Update existing images</p>
                        <p className="text-muted-foreground text-xs leading-relaxed">Rebuild to apply size changes to older uploads.</p>
                    </div>
                    <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        disabled={rebuilding || form.processing}
                        onClick={() => {
                            setRebuilding(true);
                            setRequestError('');
                            router.post(
                                route('admin.settings.media.rebuild'),
                                {},
                                {
                                    preserveScroll: true,
                                    onError: () => setRequestError('Could not request a rebuild. Please try again.'),
                                    onFinish: () => setRebuilding(false),
                                },
                            );
                        }}
                    >
                        <RefreshCw className={rebuilding ? 'motion-safe:animate-spin' : ''} />
                        {rebuilding ? 'Requesting…' : 'Rebuild images'}
                    </Button>
                </div>
                {(message || requestError) && (
                    <p role={requestError ? 'alert' : 'status'} className="text-muted-foreground mt-4 text-sm">
                        {requestError || message}
                    </p>
                )}
            </div>

            <div className="mt-6">
                <ServerCompressionDefaults compression={compression} />
            </div>

            <Dialog
                open={editor !== null}
                onOpenChange={(open) => {
                    if (!open && !form.processing) setEditor(null);
                }}
            >
                <DialogContent className="max-h-[90dvh] overflow-y-auto sm:max-w-lg">
                    <DialogHeader>
                        <DialogTitle>
                            {removing ? 'Remove this image size?' : editor?.originalName ? 'Edit image size' : 'Add image size'}
                        </DialogTitle>
                        <DialogDescription>
                            {removing
                                ? 'Future uploads will no longer generate this size. Existing images and originals will stay in your library.'
                                : 'Choose the dimensions and how this size should be generated.'}
                        </DialogDescription>
                    </DialogHeader>
                    {editor &&
                        (removing ? (
                            <>
                                <p className="font-mono text-sm">{editor.originalName}</p>
                                {errors.presets && (
                                    <p role="alert" className="text-destructive text-sm">
                                        {errors.presets}
                                    </p>
                                )}
                                <DialogFooter>
                                    <Button variant="outline" disabled={form.processing} onClick={() => setRemoving(false)}>
                                        Keep size
                                    </Button>
                                    <Button
                                        variant="destructive"
                                        disabled={form.processing}
                                        onClick={() => save(form.data.presets.filter((_, index) => index !== editor.index))}
                                    >
                                        <Trash2 />
                                        {form.processing ? 'Removing…' : 'Remove size'}
                                    </Button>
                                </DialogFooter>
                            </>
                        ) : (
                            <form
                                className="space-y-6"
                                onSubmit={(event) => {
                                    event.preventDefault();
                                    const next = [...form.data.presets];
                                    next[editor.index] = editor.draft;
                                    save(next);
                                }}
                            >
                                <div className="space-y-2">
                                    <Label htmlFor="image-size-name">Size name</Label>
                                    <Input
                                        id="image-size-name"
                                        value={editor.draft.name}
                                        readOnly={builtIn}
                                        placeholder="e.g. hero-wide"
                                        required
                                        maxLength={40}
                                        autoComplete="off"
                                        onChange={(event) => update({ name: event.target.value })}
                                        aria-invalid={Boolean(errorFor('name'))}
                                        aria-describedby="image-size-name-help"
                                    />
                                    <p
                                        id="image-size-name-help"
                                        className={errorFor('name') ? 'text-destructive text-xs' : 'text-muted-foreground text-xs'}
                                    >
                                        {errorFor('name') ||
                                            (builtIn
                                                ? 'This name is used by the site and cannot be changed.'
                                                : 'A unique key for your templates: lowercase letters, numbers and hyphens.')}
                                    </p>
                                </div>
                                <div className="space-y-3">
                                    <div className="grid grid-cols-2 gap-4">
                                        {(['width', 'height'] as const).map((key) => (
                                            <div className="space-y-2" key={key}>
                                                <Label htmlFor={`image-size-${key}`}>
                                                    {key === 'width' ? 'Width' : 'Height'}{' '}
                                                    <span className="text-muted-foreground font-normal">px</span>
                                                </Label>
                                                <Input
                                                    id={`image-size-${key}`}
                                                    type="number"
                                                    min={32}
                                                    max={builtIn && editor.originalName === 'thumb' && key === 'width' ? 640 : 2560}
                                                    required={key === 'width' || editor.draft.fit === 'cover'}
                                                    placeholder="Auto"
                                                    value={editor.draft[key] ?? ''}
                                                    onChange={(event) =>
                                                        update({ [key]: event.target.value === '' ? null : Number(event.target.value) })
                                                    }
                                                    aria-invalid={Boolean(errorFor(key))}
                                                    aria-describedby={`image-size-${key}-help`}
                                                />
                                                <p id={`image-size-${key}-help`} className="text-destructive text-xs">
                                                    {errorFor(key)}
                                                </p>
                                            </div>
                                        ))}
                                    </div>
                                    <p className="text-muted-foreground text-xs">
                                        Leave height empty to keep the original proportions. Small images are never enlarged.
                                    </p>
                                </div>
                                <fieldset className="space-y-2">
                                    <legend className="text-sm font-medium">How to resize</legend>
                                    <div className="grid grid-cols-2 gap-3">
                                        {[
                                            { value: 'contain', label: 'Fit inside', help: 'Keep the entire image', Icon: Maximize },
                                            { value: 'cover', label: 'Crop to fill', help: 'Fill both dimensions', Icon: Crop },
                                        ].map(({ value, label, help, Icon }) => (
                                            <button
                                                key={value}
                                                type="button"
                                                aria-pressed={editor.draft.fit === value}
                                                onClick={() => update({ fit: value })}
                                                className={`focus-visible:outline-ring flex cursor-pointer items-start gap-3 rounded-md border p-3 text-left transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 ${editor.draft.fit === value ? 'border-foreground/30 bg-muted/60' : 'border-border/60 hover:bg-muted/30'}`}
                                            >
                                                <Icon className="text-muted-foreground mt-0.5 size-4 shrink-0" />
                                                <span>
                                                    <span className="block text-sm font-medium">{label}</span>
                                                    <span className="text-muted-foreground mt-1 block text-xs">{help}</span>
                                                </span>
                                            </button>
                                        ))}
                                    </div>
                                </fieldset>
                                <div className="grid grid-cols-2 items-start gap-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="image-size-format">File format</Label>
                                        <Select value={editor.draft.format} onValueChange={(format) => update({ format })}>
                                            <SelectTrigger id="image-size-format">
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {Object.entries(formats).map(([value, label]) => (
                                                    <SelectItem key={value} value={value}>
                                                        {label}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="image-size-quality">
                                            Quality <span className="text-muted-foreground font-normal">%</span>
                                        </Label>
                                        <Input
                                            id="image-size-quality"
                                            type="number"
                                            min={40}
                                            max={95}
                                            required
                                            disabled={editor.draft.format === 'png'}
                                            value={editor.draft.quality}
                                            onChange={(event) => update({ quality: Number(event.target.value) })}
                                            aria-invalid={Boolean(errorFor('quality'))}
                                        />
                                        <p className="text-muted-foreground text-xs">
                                            {errorFor('quality') ||
                                                (editor.draft.format === 'png' ? 'PNG is always lossless.' : '80 is a good starting point.')}
                                        </p>
                                    </div>
                                </div>
                                {errors.presets && (
                                    <p role="alert" className="text-destructive text-sm">
                                        {errors.presets}
                                    </p>
                                )}
                                <DialogFooter className="border-border/60 flex-row items-center border-t pt-4 sm:justify-between">
                                    <div>
                                        {editor.originalName && !builtIn && (
                                            <Button
                                                type="button"
                                                variant="ghost"
                                                size="icon"
                                                aria-label="Remove image size"
                                                disabled={form.processing}
                                                onClick={() => setRemoving(true)}
                                            >
                                                <Trash2 className="size-4" />
                                            </Button>
                                        )}
                                    </div>
                                    <div className="ml-auto flex gap-2">
                                        <Button type="button" variant="outline" disabled={form.processing} onClick={() => setEditor(null)}>
                                            Cancel
                                        </Button>
                                        <Button type="submit" disabled={form.processing}>
                                            <Save />
                                            {form.processing ? 'Saving…' : editor.originalName ? 'Save changes' : 'Create size'}
                                        </Button>
                                    </div>
                                </DialogFooter>
                            </form>
                        ))}
                </DialogContent>
            </Dialog>
        </section>
    );
}
