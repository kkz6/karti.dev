import '@shared/../css/app.css';

import { createInertiaApp, router } from '@inertiajs/react';
import { initializeTheme } from '@shared/hooks/use-appearance';
import { formatDocumentTitle } from '@shared/lib/site-metadata';
import type { SiteSettings } from '@shared/types/site-settings';
import { resolvePageComponent } from 'laravel-vite-plugin/inertia-helpers';
import { createRoot } from 'react-dom/client';

let siteName = 'karti.dev';
let hasSeo = false;
router.on('navigate', ({ detail }) => {
    const props = detail.page.props;
    siteName = (props.site as SiteSettings).name;
    hasSeo = Boolean(props.seo);
});

createInertiaApp({
    title: (title) => formatDocumentTitle(title, siteName, hasSeo),
    resolve: (name) => {
        if (name.includes('::')) {
            const [module, page] = name.split('::');

            return resolvePageComponent(
                `../../modules/${module}/resources/js/pages/${page}.tsx`,
                import.meta.glob('../../modules/*/resources/js/pages/**/*.tsx'),
            );
        } else {
            return resolvePageComponent(`./pages/${name}.tsx`, import.meta.glob('./pages/**/*.tsx'));
        }
    },
    setup({ el, App, props }) {
        const shared = props.initialPage.props;
        siteName = (shared.site as SiteSettings).name;
        hasSeo = Boolean(shared.seo);
        const root = createRoot(el);

        root.render(<App {...props} />);
    },
    progress: {
        color: '#4B5563',
    },
});

// This will set light / dark mode on load...
initializeTheme();
