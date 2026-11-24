import { redirect } from 'next/navigation';
import { auth } from '@/auth';
import Sidebar from '@/components/Sidebar';

// Sem sessão, o painel não deve renderizar (antes aparecia vazio, como se não
// houvesse dados). Os dados em si já são protegidos por userId() em lib/actions.ts.
export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session?.user?.id) redirect('/login');
  return (
    <>
      <Sidebar />
      <div className="main">{children}</div>
    </>
  );
}
