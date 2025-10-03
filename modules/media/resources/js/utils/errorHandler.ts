import { toast } from 'sonner';

const isDebugMode = (): boolean => {
    return import.meta.env.DEV || window.location.hostname === 'localhost';
};

export const handleError = (error: unknown, userMessage?: string): void => {
    const errorMessage = error instanceof Error ? error.message : String(error);

    console.error('Error:', errorMessage);

    if (isDebugMode()) {
        console.error('Full error details:', error);
    }

    toast.error(userMessage || errorMessage);
};

export const handleSuccess = (message: string): void => {
    toast.success(message);
};
