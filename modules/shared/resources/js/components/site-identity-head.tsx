import { Head, usePage } from '@inertiajs/react';
import type { SharedData } from '@shared/types';

export function SiteIdentityHead() {
    const { site } = usePage<SharedData>().props;
    return (
        <Head>
            <link head-key="site-favicon" rel="icon" href={site.favicon} sizes="any" />
        </Head>
    );
}
