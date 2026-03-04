import { ElectionProvider } from '@/contexts/ElectionContext';

export default function ElectionsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <ElectionProvider>{children}</ElectionProvider>;
}
