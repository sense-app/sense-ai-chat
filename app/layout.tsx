import type { Metadata } from 'next';
import { Toaster } from 'sonner';

import { ThemeProvider } from '@/components/theme-provider';

import './globals.css';

export const metadata: Metadata = {
  metadataBase: new URL('https://theshopper.cc'),
  title: 'Shopper AI - DeepSearch Shopping with cashback on purchases',
  description: 'Shop smarter with Shopper AI and earn cashback on your purchases',
  openGraph: {
    type: 'website',
    locale: 'en_US',
    title: 'Shopper AI',
    description: 'AI Deep search Shopping with cashback on purchases',
    emails: 'arsh@abdrahman@gmail.com',
    siteName: 'Shopper AI',
    url: 'https://theshopper.cc',
    countryName: 'United States',
    images: [
      {
        url: '/cover.png',
        width: 1200,
        height: 630,
        alt: 'AI Deep search Shopping with cashback on purchases',
      },
    ],
  },
  twitter: {
    site: '@abdrahmanBTC',
    creator: '@abdrahmanBTC',
    card: 'summary_large_image',
    title: 'Shopper AI',
    description: 'AI Deep search Shopping with cashback on purchases',
    images: [
      {
        url: 'https://theshopper.cc/cover.png',
        width: 1200,
        height: 630,
        alt: 'AI Deep search Shopping with cashback on purchases',
      },
    ],
  },
  robots: {
    index: true,
    googleBot: {
      index: true,
    },
  },
};

export const viewport = {
  maximumScale: 1, // Disable auto-zoom on mobile Safari
};

const LIGHT_THEME_COLOR = 'hsl(0 0% 100%)';
const DARK_THEME_COLOR = 'hsl(240deg 10% 3.92%)';
const THEME_COLOR_SCRIPT = `\
(function() {
  var html = document.documentElement;
  var meta = document.querySelector('meta[name="theme-color"]');
  if (!meta) {
    meta = document.createElement('meta');
    meta.setAttribute('name', 'theme-color');
    document.head.appendChild(meta);
  }
  function updateThemeColor() {
    var isDark = html.classList.contains('dark');
    meta.setAttribute('content', isDark ? '${DARK_THEME_COLOR}' : '${LIGHT_THEME_COLOR}');
  }
  var observer = new MutationObserver(updateThemeColor);
  observer.observe(html, { attributes: true, attributeFilter: ['class'] });
  updateThemeColor();
})();`;

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      // `next-themes` injects an extra classname to the body element to avoid
      // visual flicker before hydration. Hence the `suppressHydrationWarning`
      // prop is necessary to avoid the React hydration mismatch warning.
      // https://github.com/pacocoursey/next-themes?tab=readme-ov-file#with-app
      suppressHydrationWarning
    >
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: THEME_COLOR_SCRIPT,
          }}
        />
      </head>
      <body className="antialiased">
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
          <Toaster position="top-center" />
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
