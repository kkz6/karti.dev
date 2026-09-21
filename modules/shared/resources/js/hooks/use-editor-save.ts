import type { Page } from '@inertiajs/core';
import { router } from '@inertiajs/react';
import { continueWithoutUnsavedChangesPrompt } from '@shared/components/unsaved-changes-guard';
import { adminTabUrl } from '@shared/lib/admin-tab';
import { useState, type BaseSyntheticEvent } from 'react';
import type { FieldValues, Path, UseFormReturn } from 'react-hook-form';

export function editorSaveOptions(event: Pick<BaseSyntheticEvent, 'nativeEvent'> | undefined, backHref: string, onSaved?: () => void) {
    const submitter = (event?.nativeEvent as SubmitEvent | undefined)?.submitter;
    const close = submitter instanceof HTMLButtonElement && submitter.value === 'save-and-close';
    const tab = new URL(window.location.href).searchParams.get('tab');
    return {
        preserveScroll: true,
        onSuccess: (page: Page) => {
            onSaved?.();
            if (close) continueWithoutUnsavedChangesPrompt(() => router.visit(backHref));
            else if (tab) router.replace({ url: adminTabUrl(page.url, tab), preserveState: true, preserveScroll: true });
        },
    };
}

export function useEditorSave<T extends FieldValues>(
    form: Pick<UseFormReturn<T>, 'clearErrors' | 'getValues' | 'reset' | 'setError'>,
    backHref: string,
) {
    const [saving, setSaving] = useState(false);

    const save = (method: 'post' | 'put', url: string, data: Parameters<typeof router.post>[1], event?: BaseSyntheticEvent) => {
        form.clearErrors();
        router[method](url, data, {
            ...editorSaveOptions(event, backHref, () => form.reset(form.getValues())),
            onStart: () => setSaving(true),
            onFinish: () => setSaving(false),
            onError: (errors) => {
                Object.entries(errors).forEach(([field, message]) => {
                    form.setError(field as Path<T>, { type: 'server', message });
                });
            },
        });
    };

    return { saving, save };
}
