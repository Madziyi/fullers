import Link from 'next/link';
import { requireUser } from '@/lib/auth';
import { SignOut } from './sign-out';
export default async function ProtectedLayout({ children }: { children: React.ReactNode }) {
  const user = await requireUser();
  return (
    <div className="admin-layout">
      <aside className="admin-sidebar">
        <Link href="/admin" className="admin-wordmark">
          Fullers<span>CONTENT STUDIO</span>
        </Link>
        <nav aria-label="Administration">
          <Link href="/admin">Overview</Link>
          <Link href="/admin/products">Products</Link>
          {user.role === 'ADMIN' && <Link href="/admin/settings">Site settings</Link>}
          {user.role === 'ADMIN' && <Link href="/admin/enquiries">Enquiries</Link>}
          <span>
            Articles <small>M3</small>
          </span>
          <span>
            Projects <small>M3</small>
          </span>
          <span>
            Media library <small>M3</small>
          </span>
          <span>
            Pages <small>M3</small>
          </span>
        </nav>
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
