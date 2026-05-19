import {
  createRootRouteWithContext,
  HeadContent,
  Link,
  Scripts,
} from '@tanstack/react-router'

import { Toaster } from '../components/ui/sonner'
import ConvexProvider from '../integrations/convex/provider'

import appCss from '../styles.css?url'

export const Route = createRootRouteWithContext()({
  head: () => ({
    meta: [
      {
        charSet: 'utf-8',
      },
      {
        name: 'viewport',
        content: 'width=device-width, initial-scale=1, viewport-fit=cover',
      },
      {
        title: 'knowbetter',
      },
      {
        name: 'theme-color',
        content: '#0f172a',
      },
      {
        name: 'apple-mobile-web-app-capable',
        content: 'yes',
      },
      {
        name: 'apple-mobile-web-app-title',
        content: 'knowbetter',
      },
      {
        name: 'apple-mobile-web-app-status-bar-style',
        content: 'black-translucent',
      },
      {
        name: 'mobile-web-app-capable',
        content: 'yes',
      },
    ],
    links: [
      {
        rel: 'stylesheet',
        href: appCss,
      },
      {
        rel: 'manifest',
        href: '/manifest.json',
      },
      {
        rel: 'icon',
        href: '/favicon.png',
        type: 'image/png',
        sizes: '32x32',
      },
      {
        rel: 'apple-touch-icon',
        href: '/apple-touch-icon.png',
      },
    ],
  }),
  notFoundComponent: NotFound,
  shellComponent: RootDocument,
})

function NotFound() {
  return (
    <main className="grid min-h-dvh place-items-center bg-zinc-950 px-6 text-zinc-50">
      <section className="max-w-md text-center">
        <p className="text-sm font-medium text-zinc-400">404</p>
        <h1 className="mt-3 text-3xl font-semibold">Page not found</h1>
        <p className="mt-3 text-sm leading-6 text-zinc-300">
          The page you opened does not exist in this app.
        </p>
        <Link
          to="/"
          className="mt-6 inline-flex h-10 items-center justify-center rounded-md bg-zinc-50 px-4 text-sm font-medium text-zinc-950 transition hover:bg-zinc-200"
        >
          Back to map
        </Link>
      </section>
    </main>
  )
}

function RootDocument({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <HeadContent />
      </head>
      <body>
        <ConvexProvider>
          {children}
          <Toaster />
          {/*<TanStackDevtools*/}
          {/*  config={{*/}
          {/*    position: 'bottom-left',*/}
          {/*  }}*/}
          {/*  plugins={[*/}
          {/*    {*/}
          {/*      name: 'Tanstack Router',*/}
          {/*      render: <TanStackRouterDevtoolsPanel />,*/}
          {/*    },*/}
          {/*    TanStackQueryDevtools,*/}
          {/*  ]}*/}
          {/*/>*/}
        </ConvexProvider>
        <Scripts />
      </body>
    </html>
  )
}
