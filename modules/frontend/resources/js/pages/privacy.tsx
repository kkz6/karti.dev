import { Head } from '@inertiajs/react'
import PublicLayout from '../layouts/public-layout';
import { Container } from '../components/Container';

export default function Privacy() {
  return (
    <PublicLayout>
      <Head title="Privacy Policy" />
      <Container className="mt-16 sm:mt-32">
        <header className="max-w-2xl">
          <h1 className="text-4xl font-bold tracking-tight text-zinc-800 dark:text-zinc-100 sm:text-5xl">
            Privacy Policy
          </h1>
          <p className="mt-6 text-base text-zinc-600 dark:text-zinc-400">
            Last updated: {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
        </header>
        <div className="mt-16 sm:mt-20">
          <div className="prose prose-zinc dark:prose-invert max-w-none">
            <h2 className="text-2xl font-bold tracking-tight text-zinc-800 dark:text-zinc-100 mt-10 mb-4">
              Introduction
            </h2>
            <p className="text-base text-zinc-600 dark:text-zinc-400">
              We respect your privacy and are committed to protecting your personal data. This privacy policy will inform you about how we look after your personal data when you visit our website and tell you about your privacy rights and how the law protects you.
            </p>

            <h2 className="text-2xl font-bold tracking-tight text-zinc-800 dark:text-zinc-100 mt-10 mb-4">
              Information We Collect
            </h2>
            <p className="text-base text-zinc-600 dark:text-zinc-400">
              We may collect, use, store and transfer different kinds of personal data about you which we have grouped together as follows:
            </p>
            <ul className="list-disc pl-6 mt-4 space-y-2 text-base text-zinc-600 dark:text-zinc-400">
              <li>Identity Data includes first name, last name, username or similar identifier.</li>
              <li>Contact Data includes email address and telephone numbers.</li>
              <li>Technical Data includes internet protocol (IP) address, browser type and version, time zone setting and location.</li>
              <li>Usage Data includes information about how you use our website and services.</li>
            </ul>

            <h2 className="text-2xl font-bold tracking-tight text-zinc-800 dark:text-zinc-100 mt-10 mb-4">
              How We Use Your Information
            </h2>
            <p className="text-base text-zinc-600 dark:text-zinc-400">
              We will only use your personal data when the law allows us to. Most commonly, we will use your personal data in the following circumstances:
            </p>
            <ul className="list-disc pl-6 mt-4 space-y-2 text-base text-zinc-600 dark:text-zinc-400">
              <li>To provide and maintain our Service</li>
              <li>To notify you about changes to our Service</li>
              <li>To provide customer support</li>
              <li>To gather analysis or valuable information so that we can improve our Service</li>
            </ul>

            <h2 className="text-2xl font-bold tracking-tight text-zinc-800 dark:text-zinc-100 mt-10 mb-4">
              Data Security
            </h2>
            <p className="text-base text-zinc-600 dark:text-zinc-400">
              We have put in place appropriate security measures to prevent your personal data from being accidentally lost, used or accessed in an unauthorized way, altered or disclosed. In addition, we limit access to your personal data to those employees, agents, contractors and other third parties who have a business need to know.
            </p>

            <h2 className="text-2xl font-bold tracking-tight text-zinc-800 dark:text-zinc-100 mt-10 mb-4">
              Contact Us
            </h2>
            <p className="text-base text-zinc-600 dark:text-zinc-400">
              If you have any questions about this Privacy Policy, please contact us at privacy@example.com.
            </p>
          </div>
        </div>
      </Container>
    </PublicLayout>
  )
}