import { redirect } from 'next/navigation';

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // This layout should only be used for the root redirect
  // All actual pages use the locale-specific layout
  return (
    <html>
      <body>
        {children}
      </body>
    </html>
  );
}