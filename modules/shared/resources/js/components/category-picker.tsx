import { Button } from '@shared/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@shared/components/ui/dialog';
import { Input } from '@shared/components/ui/input';
import { Label } from '@shared/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@shared/components/ui/select';
import axios from 'axios';
import { FolderPlus, LoaderCircle, Plus, X } from 'lucide-react';
import { type ComponentProps, type FormEvent, useId, useImperativeHandle, useRef, useState } from 'react';
import slugify from 'slug';
import { toast } from 'sonner';

interface CategoryOption {
    id: number;
    name: string;
}

/** Inline creation preserves the parent draft; FormControl props/ref target the picker trigger. */
export function CategoryPicker({
    categories,
    createUrl,
    value,
    onChange,
    allowNone = false,
    disabled,
    ref,
    ...triggerProps
}: Omit<ComponentProps<typeof SelectTrigger>, 'value' | 'onChange'> & {
    categories: CategoryOption[];
    createUrl: string;
    value?: string;
    onChange: (value: string) => void;
    allowNone?: boolean;
}) {
    const id = useId();
    const triggerRef = useRef<HTMLButtonElement>(null);
    const createRef = useRef<HTMLButtonElement>(null);
    const [created, setCreated] = useState<CategoryOption[]>([]);
    const options = [...categories, ...created.filter((item) => !categories.some((existing) => existing.id === item.id))];
    useImperativeHandle(ref, () => (options.length ? triggerRef.current : createRef.current)!);
    const [open, setOpen] = useState(false);
    const [name, setName] = useState('');
    const [slug, setSlug] = useState('');
    const [slugEdited, setSlugEdited] = useState(false);
    const [saving, setSaving] = useState(false);
    const submitting = useRef(false);
    const [errors, setErrors] = useState<Record<string, string>>({});

    function startCreate() {
        setName('');
        setSlug('');
        setSlugEdited(false);
        setErrors({});
        setOpen(true);
    }

    async function createCategory(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();
        // Dialogs are portalled but React events still bubble to the editor form.
        event.stopPropagation();
        if (submitting.current) return;
        submitting.current = true;
        setSaving(true);
        setErrors({});
        try {
            const response = await axios.post<{ category: CategoryOption }>(
                createUrl,
                {
                    name: name.trim(),
                    slug: slug.trim(),
                    description: null,
                    meta_title: null,
                    meta_description: null,
                },
                { headers: { Accept: 'application/json' } },
            );
            const category = response.data.category;
            setCreated((current) => [...current, category]);
            onChange(String(category.id));
            setOpen(false);
            toast.success('Category created and selected');
        } catch (error) {
            if (axios.isAxiosError(error) && error.response?.status === 422) {
                const validation = error.response.data.errors as Record<string, string[]>;
                setErrors(Object.fromEntries(Object.entries(validation).map(([field, messages]) => [field, messages[0]])));
            } else {
                setErrors({ form: 'Could not create the category. Please try again.' });
            }
        } finally {
            submitting.current = false;
            setSaving(false);
        }
    }

    return (
        <div className="space-y-2">
            <div className="grid grid-cols-[minmax(0,1fr)_auto]">
                <Select
                    value={value || (allowNone && options.length ? 'none' : '')}
                    onValueChange={(next) => onChange(next === 'none' ? '' : next)}
                    disabled={disabled || options.length === 0}
                >
                    <SelectTrigger {...triggerProps} ref={triggerRef} className="relative min-w-0 rounded-r-none border-r-0 focus-visible:z-10">
                        <SelectValue placeholder={options.length ? 'Select a category' : 'No categories yet'} />
                    </SelectTrigger>
                    <SelectContent>
                        {allowNone && <SelectItem value="none">None</SelectItem>}
                        {options.map((category) => (
                            <SelectItem key={category.id} value={String(category.id)}>
                                {category.name}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
                <Button
                    ref={createRef}
                    variant="control"
                    className="relative w-9 shrink-0 justify-center rounded-l-none p-0 focus-visible:z-10"
                    onClick={startCreate}
                    disabled={disabled}
                    aria-label="Create category"
                    aria-haspopup="dialog"
                    aria-expanded={open}
                    title="Create category"
                >
                    <Plus className="size-4" />
                </Button>
            </div>
            <Dialog
                open={open}
                onOpenChange={(next) => {
                    if (!submitting.current) setOpen(next);
                }}
            >
                <DialogContent
                    onCloseAutoFocus={(event) => {
                        event.preventDefault();
                        createRef.current?.focus();
                    }}
                >
                    <DialogHeader>
                        <DialogTitle>Create category</DialogTitle>
                        <DialogDescription>Add a category and select it for this entry. Your unsaved changes will stay here.</DialogDescription>
                    </DialogHeader>
                    <form onSubmit={createCategory} className="space-y-4" aria-busy={saving}>
                        <div className="space-y-2">
                            <Label htmlFor={`${id}-name`}>Name</Label>
                            <Input
                                id={`${id}-name`}
                                value={name}
                                required
                                maxLength={255}
                                disabled={saving}
                                aria-invalid={!!errors.name}
                                aria-describedby={errors.name ? `${id}-name-error` : undefined}
                                onChange={(event) => {
                                    setName(event.target.value);
                                    if (!slugEdited) setSlug(slugify(event.target.value));
                                }}
                            />
                            {errors.name && (
                                <p id={`${id}-name-error`} className="text-destructive text-sm" role="alert">
                                    {errors.name}
                                </p>
                            )}
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor={`${id}-slug`}>Slug</Label>
                            <Input
                                id={`${id}-slug`}
                                value={slug}
                                required
                                maxLength={255}
                                disabled={saving}
                                aria-invalid={!!errors.slug}
                                aria-describedby={`${id}-slug-help${errors.slug ? ` ${id}-slug-error` : ''}`}
                                onChange={(event) => {
                                    setSlugEdited(true);
                                    setSlug(event.target.value);
                                }}
                            />
                            <p id={`${id}-slug-help`} className="text-muted-foreground text-xs">
                                Generated from the name. You can change it if needed.
                            </p>
                            {errors.slug && (
                                <p id={`${id}-slug-error`} className="text-destructive text-sm" role="alert">
                                    {errors.slug}
                                </p>
                            )}
                        </div>
                        {errors.form && (
                            <p className="text-destructive text-sm" role="alert">
                                {errors.form}
                            </p>
                        )}
                        <DialogFooter>
                            <Button variant="outline" disabled={saving} onClick={() => setOpen(false)}>
                                <X />
                                Cancel
                            </Button>
                            <Button type="submit" disabled={saving || !name.trim() || !slug.trim()}>
                                {saving ? <LoaderCircle className="animate-spin" /> : <FolderPlus />}
                                {saving ? 'Creating…' : 'Create category'}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </div>
    );
}
