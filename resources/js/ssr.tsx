import { createInertiaApp } from '@inertiajs/react';
import createServer from '@inertiajs/react/server';
import { formatDocumentTitle } from '@shared/lib/site-metadata';
import type { SiteSettings } from '@shared/types/site-settings';
import { resolvePageComponent } from 'laravel-vite-plugin/inertia-helpers';
import ReactDOMServer from 'react-dom/server';
import { type RouteName, route } from 'ziggy-js';

createServer((page) =>
    createInertiaApp({
        page,
        render: ReactDOMServer.renderToString,
        title: (title) => formatDocumentTitle(title, (page.props.site as SiteSettings).name, Boolean(page.props.seo)),
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
        setup: ({ App, props }) => {
            /* eslint-disable */
            // @ts-expect-error
            global.route<RouteName> = (name, params, absolute) =>
                route(name, params as any, absolute, {
                    // @ts-expect-error
                    ...page.props.ziggy,
                    // @ts-expect-error
                    location: new URL(page.props.ziggy.location),
                });
            /* eslint-enable */

            return <App {...props} />;
        },
    }),
);
