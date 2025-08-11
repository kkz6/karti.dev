import { Head } from '@inertiajs/react'
import PublicLayout from '../layouts/public-layout';
import { Container } from '../components/Container';
import { Button } from '@shared/components/ui/button';
import { Card } from '@shared/components/ui/card';

function MailIcon(props: React.ComponentPropsWithoutRef<'svg'>) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      {...props}
    >
      <path
        d="M2.75 7.75a3 3 0 0 1 3-3h12.5a3 3 0 0 1 3 3v8.5a3 3 0 0 1-3 3H5.75a3 3 0 0 1-3-3v-8.5Z"
        className="fill-zinc-100 stroke-zinc-400 dark:fill-zinc-100/10 dark:stroke-zinc-500"
      />
      <path
        d="m4 6 6.024 5.479a2.915 2.915 0 0 0 3.952 0L20 6"
        className="stroke-zinc-400 dark:stroke-zinc-500"
      />
    </svg>
  );
}

export default function Contact() {
  return (
    <PublicLayout>
      <Head title="Contact" />
      <Container className="mt-16 sm:mt-32">
        <header className="max-w-2xl">
          <h1 className="text-4xl font-bold tracking-tight text-zinc-800 dark:text-zinc-100 sm:text-5xl">
            Get in touch
          </h1>
          <p className="mt-6 text-base text-zinc-600 dark:text-zinc-400">
            I'd love to hear from you. Whether you have a question about features, trials, pricing, need a demo, or anything else, I'm ready to answer all your questions.
          </p>
        </header>
        <div className="mt-16 sm:mt-20">
          <div className="grid grid-cols-1 gap-8 sm:grid-cols-2">
            <Card className="p-6">
              <div className="flex items-center mb-4">
                <MailIcon className="h-6 w-6 flex-none" />
                <h2 className="ml-3 text-base font-semibold text-zinc-900 dark:text-zinc-100">
                  Email
                </h2>
              </div>
              <p className="text-sm text-zinc-600 dark:text-zinc-400">
                Send me an email and I'll get back to you within 24 hours.
              </p>
              <a
                href="mailto:hello@example.com"
                className="mt-4 inline-flex items-center text-sm font-medium text-teal-500 hover:text-teal-600"
              >
                hello@example.com
              </a>
            </Card>
            <Card className="p-6">
              <h2 className="text-base font-semibold text-zinc-900 dark:text-zinc-100 mb-4">
                Follow me
              </h2>
              <p className="text-sm text-zinc-600 dark:text-zinc-400">
                Follow me on social media to stay updated with the latest news and updates.
              </p>
              <div className="mt-4 flex gap-4">
                <a
                  href="#"
                  className="text-sm font-medium text-teal-500 hover:text-teal-600"
                >
                  Twitter
                </a>
                <a
                  href="#"
                  className="text-sm font-medium text-teal-500 hover:text-teal-600"
                >
                  LinkedIn
                </a>
                <a
                  href="#"
                  className="text-sm font-medium text-teal-500 hover:text-teal-600"
                >
                  GitHub
                </a>
              </div>
            </Card>
          </div>
          <form className="mt-10 rounded-2xl border border-zinc-100 p-6 dark:border-zinc-700/40">
            <h2 className="flex text-sm font-semibold text-zinc-900 dark:text-zinc-100">
              <MailIcon className="h-6 w-6 flex-none" />
              <span className="ml-3">Send me a message</span>
            </h2>
            <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
              Fill out the form below and I'll get back to you as soon as possible.
            </p>
            <div className="mt-6 grid grid-cols-1 gap-6 sm:grid-cols-2">
              <div>
                <label
                  htmlFor="first-name"
                  className="block text-sm font-medium text-zinc-900 dark:text-zinc-100"
                >
                  First name
                </label>
                <input
                  type="text"
                  name="first-name"
                  id="first-name"
                  autoComplete="given-name"
                  className="mt-2 block w-full rounded-md border border-zinc-900/10 bg-white px-3 py-2 shadow-sm shadow-zinc-800/5 placeholder:text-zinc-400 focus:border-teal-500 focus:outline-none focus:ring-4 focus:ring-teal-500/10 dark:border-zinc-700 dark:bg-zinc-700/[0.15] dark:text-zinc-200 dark:placeholder:text-zinc-500 dark:focus:border-teal-400 dark:focus:ring-teal-400/10 sm:text-sm"
                />
              </div>
              <div>
                <label
                  htmlFor="last-name"
                  className="block text-sm font-medium text-zinc-900 dark:text-zinc-100"
                >
                  Last name
                </label>
                <input
                  type="text"
                  name="last-name"
                  id="last-name"
                  autoComplete="family-name"
                  className="mt-2 block w-full rounded-md border border-zinc-900/10 bg-white px-3 py-2 shadow-sm shadow-zinc-800/5 placeholder:text-zinc-400 focus:border-teal-500 focus:outline-none focus:ring-4 focus:ring-teal-500/10 dark:border-zinc-700 dark:bg-zinc-700/[0.15] dark:text-zinc-200 dark:placeholder:text-zinc-500 dark:focus:border-teal-400 dark:focus:ring-teal-400/10 sm:text-sm"
                />
              </div>
              <div className="sm:col-span-2">
                <label
                  htmlFor="email"
                  className="block text-sm font-medium text-zinc-900 dark:text-zinc-100"
                >
                  Email
                </label>
                <input
                  type="email"
                  name="email"
                  id="email"
                  autoComplete="email"
                  className="mt-2 block w-full rounded-md border border-zinc-900/10 bg-white px-3 py-2 shadow-sm shadow-zinc-800/5 placeholder:text-zinc-400 focus:border-teal-500 focus:outline-none focus:ring-4 focus:ring-teal-500/10 dark:border-zinc-700 dark:bg-zinc-700/[0.15] dark:text-zinc-200 dark:placeholder:text-zinc-500 dark:focus:border-teal-400 dark:focus:ring-teal-400/10 sm:text-sm"
                />
              </div>
              <div className="sm:col-span-2">
                <label
                  htmlFor="message"
                  className="block text-sm font-medium text-zinc-900 dark:text-zinc-100"
                >
                  Message
                </label>
                <textarea
                  id="message"
                  name="message"
                  rows={4}
                  className="mt-2 block w-full rounded-md border border-zinc-900/10 bg-white px-3 py-2 shadow-sm shadow-zinc-800/5 placeholder:text-zinc-400 focus:border-teal-500 focus:outline-none focus:ring-4 focus:ring-teal-500/10 dark:border-zinc-700 dark:bg-zinc-700/[0.15] dark:text-zinc-200 dark:placeholder:text-zinc-500 dark:focus:border-teal-400 dark:focus:ring-teal-400/10 sm:text-sm"
                />
              </div>
            </div>
            <Button type="submit" className="mt-6">
              Send message
            </Button>
          </form>
        </div>
      </Container>
    </PublicLayout>
  )
}