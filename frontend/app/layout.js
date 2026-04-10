import './globals.css'

export const metadata = {
  title: 'NTU Crowd - Canteen Monitor',
  description: 'Crowdsourced canteen crowd levels for NTU students.',
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link
          href="https://fonts.googleapis.com/css2?family=Crimson+Text:ital,wght@0,400;0,600&family=Inter:wght@400;500;600&family=Playfair+Display:wght@400;700&family=Space+Mono:ital,wght@0,400;0,700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>{children}</body>
    </html>
  )
}