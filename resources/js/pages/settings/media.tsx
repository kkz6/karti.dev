import { Head } from '@inertiajs/react';
import { IndexHeader } from '@shared/components/index-header';
import { PageContainer } from '@shared/components/page-container';
import { SiteSettingsTabs } from '@shared/components/site-settings-tabs';
import AppLayout from '@shared/layouts/app-layout';
import { Image } from 'lucide-react';
import { MediaSettingsForm, type CompressionDefaults, type ImagePreset } from './media-settings';

interface MediaSettingsPageProps {
    mediaSettings: {
        presets: ImagePreset[];
        builtInNames: string[];
        legacyConversions: { name: string; width: number }[];
        compression: CompressionDefaults;
    };
    mediaMessage?: string;
}

export default function MediaSettingsPage({ mediaSettings, mediaMessage }: MediaSettingsPageProps) {
    return (
        <AppLayout
            breadcrumbs={[
                { title: 'Site settings', href: route('admin.settings.edit') },
                { title: 'Media', href: route('admin.settings.media.edit') },
            ]}
        >
            <Head title="Media settings" />
            <PageContainer className="content-index space-y-8">
                <IndexHeader title="Media settings" icon={Image} />
                <SiteSettingsTabs section="media" />
                <div className="space-y-6">
                    <p className="text-muted-foreground mb-6 text-sm">
                        Manage generated image sizes and apply changes to existing uploads. Your originals stay unchanged.
                    </p>
                    <MediaSettingsForm {...mediaSettings} message={mediaMessage} />
                </div>
            </PageContainer>
        </AppLayout>
    );
}
