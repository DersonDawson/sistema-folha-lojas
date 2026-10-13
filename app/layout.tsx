import type { Metadata } from 'next';
import './globals.css';
export const metadata: Metadata = { title: 'FolhaPro | Gestão de lojas', description: 'Simulador de folha de pagamento multiloja com exportação Excel' };
export default function RootLayout({ children }: Readonly<{children: React.ReactNode}>) {
  return <html lang="pt-BR"><body>{children}</body></html>;
}
