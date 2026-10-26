'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
export function AdminNav({ admin }: { admin: boolean }) {
  const pathname = usePathname();
  const groups = [
    {
      label: 'Workspace',
      items: [
        ['Overview', '/admin'],
        ['Articles', '/admin/posts'],
        ...(admin
          ? [
              ['Products', '/admin/products'],
              ['Projects', '/admin/projects'],
              ['Pages', '/admin/pages'],
              ['Media library', '/admin/media'],
            ]
          : []),
      ],
    },
    ...(admin
      ? [
          {
            label: 'Administration',
            items: [
              ['Enquiries', '/admin/enquiries'],
              ['Site settings', '/admin/settings'],
              ['Redirects', '/admin/redirects'],
              ['Users & roles', '/admin/users'],
              ['Audit history', '/admin/audit'],
            ],
          },
        ]
      : []),
  ];
  return (
    <nav aria-label="Administration">
      {groups.map((group) => (
        <div className="admin-nav-group" key={group.label}>
          <p>{group.label}</p>
          {group.items.map(([label, href]) => (
            <Link
              key={href}
              href={href}
              aria-current={
                (href === '/admin' ? pathname === href : pathname.startsWith(href))
                  ? 'page'
                  : undefined
              }
            >
              {label}
            </Link>
          ))}
        </div>
      ))}
    </nav>
  );
}
