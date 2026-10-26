import Link from 'next/link';
import { requireUser } from '@/lib/auth';
import { SignOut } from './sign-out';
import { AdminNav } from './nav';
export default async function ProtectedLayout({ children }: { children: React.ReactNode }) {
  const user = await requireUser();
  return (
    <div className="admin-layout">
      <aside className="admin-sidebar">
        <Link href="/admin" className="admin-wordmark">
          Fullers<span>CONTENT STUDIO</span>
        </Link>
        <AdminNav admin={user.role === 'ADMIN'} />
        <Link href="/">↗ View public website</Link>
      </aside>
      <div className="admin-main">
        <div className="admin-topbar">
          <span>
            {user.name} · {user.role === 'ADMIN' ? 'Administrator' : 'Editor'}
          </span>
          <SignOut />
        </div>
        <main id="main">{children}</main>
      </div>
    </div>
  );
}
