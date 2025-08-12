import { Container } from '@frontend/components/Container';
import PublicLayout from '@frontend/layouts/public-layout';
import { Head } from '@inertiajs/react';

export default function Terms() {
    return (
        <PublicLayout>
            <Head title="Terms of Service" />
            <Container className="mt-16 sm:mt-32">
                <header className="max-w-2xl">
                    <h1 className="text-4xl font-bold tracking-tight text-zinc-800 sm:text-5xl dark:text-zinc-100">Terms of Service</h1>
                    <p className="mt-6 text-base text-zinc-600 dark:text-zinc-400">
                        Last updated: {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
                    </p>
                </header>
                <div className="mt-16 sm:mt-20">
                    <div className="prose prose-zinc dark:prose-invert max-w-none">
                        <h2 className="mt-10 mb-4 text-2xl font-bold tracking-tight text-zinc-800 dark:text-zinc-100">1. Acceptance of Terms</h2>
                        <p className="text-base text-zinc-600 dark:text-zinc-400">
                            By accessing and using this website, you accept and agree to be bound by the terms and provision of this agreement. If you
                            do not agree to abide by the above, please do not use this service.
                        </p>

                        <h2 className="mt-10 mb-4 text-2xl font-bold tracking-tight text-zinc-800 dark:text-zinc-100">2. Use License</h2>
                        <p className="text-base text-zinc-600 dark:text-zinc-400">
                            Permission is granted to temporarily download one copy of the materials on our website for personal, non-commercial
                            transitory viewing only. This is the grant of a license, not a transfer of title, and under this license you may not:
                        </p>
                        <ul className="mt-4 list-disc space-y-2 pl-6 text-base text-zinc-600 dark:text-zinc-400">
                            <li>Modify or copy the materials</li>
                            <li>Use the materials for any commercial purpose or for any public display</li>
                            <li>Attempt to reverse engineer any software contained on our website</li>
                            <li>Remove any copyright or other proprietary notations from the materials</li>
                        </ul>

                        <h2 className="mt-10 mb-4 text-2xl font-bold tracking-tight text-zinc-800 dark:text-zinc-100">3. Disclaimer</h2>
                        <p className="text-base text-zinc-600 dark:text-zinc-400">
                            The materials on our website are provided on an 'as is' basis. We make no warranties, expressed or implied, and hereby
                            disclaim and negate all other warranties including, without limitation, implied warranties or conditions of
                            merchantability, fitness for a particular purpose, or non-infringement of intellectual property or other violation of
                            rights.
                        </p>

                        <h2 className="mt-10 mb-4 text-2xl font-bold tracking-tight text-zinc-800 dark:text-zinc-100">4. Limitations</h2>
                        <p className="text-base text-zinc-600 dark:text-zinc-400">
                            In no event shall our company or its suppliers be liable for any damages (including, without limitation, damages for loss
                            of data or profit, or due to business interruption) arising out of the use or inability to use the materials on our
                            website, even if we or our authorized representative has been notified orally or in writing of the possibility of such
                            damage. Because some jurisdictions do not allow limitations on implied warranties, or limitations of liability for
                            consequential or incidental damages, these limitations may not apply to you.
                        </p>

                        <h2 className="mt-10 mb-4 text-2xl font-bold tracking-tight text-zinc-800 dark:text-zinc-100">5. Revisions and Errata</h2>
                        <p className="text-base text-zinc-600 dark:text-zinc-400">
                            The materials appearing on our website could include technical, typographical, or photographic errors. We do not warrant
                            that any of the materials on its website are accurate, complete, or current. We may make changes to the materials
                            contained on its website at any time without notice. However, we do not make any commitment to update the materials.
                        </p>

                        <h2 className="mt-10 mb-4 text-2xl font-bold tracking-tight text-zinc-800 dark:text-zinc-100">6. Governing Law</h2>
                        <p className="text-base text-zinc-600 dark:text-zinc-400">
                            These terms and conditions are governed by and construed in accordance with the laws of the United States and you
                            irrevocably submit to the exclusive jurisdiction of the courts in that State or location.
                        </p>

                        <h2 className="mt-10 mb-4 text-2xl font-bold tracking-tight text-zinc-800 dark:text-zinc-100">7. Contact Information</h2>
                        <p className="text-base text-zinc-600 dark:text-zinc-400">
                            If you have any questions about these Terms of Service, please contact us at legal@example.com.
                        </p>
                    </div>
                </div>
            </Container>
        </PublicLayout>
    );
}
