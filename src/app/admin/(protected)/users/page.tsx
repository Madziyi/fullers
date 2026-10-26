import { requireAdmin } from '@/lib/auth';
import { db } from '@/lib/db';
import { createManagedUser, updateManagedUser } from '../operations/actions';

export default async function UsersPage({
  searchParams,
}: {
  searchParams: Promise<{ result?: string }>;
}) {
  await requireAdmin();
  const { result } = await searchParams;
  const users = await db.user.findMany({
    orderBy: [{ createdAt: 'asc' }, { id: 'asc' }],
    select: { id: true, name: true, email: true, role: true, active: true, createdAt: true },
  });
  return (
    <>
      <div className="admin-title">
        <p className="eyebrow">ADMINISTRATOR ONLY</p>
        <h1>Users and access</h1>
        <p>
          Create accounts with an administrator-chosen initial password, then manage roles and
          access.
        </p>
        {result && (
          <p role="status">
            {(
              {
                created:
                  'Account created. Share its password with the user through a secure channel.',
                saved: 'Account access updated.',
                self: 'You cannot demote or disable your own administrator account.',
                'last-admin': 'At least one active administrator must remain.',
                invalid: 'Check the account details and confirmation, then try again.',
                readonly:
                  'This seed preview is read only. Switch to database content to make account changes.',
                error: 'The account could not be saved. Check that its email is unique.',
              } as Record<string, string>
            )[result] ?? 'The requested account change was not completed.'}
          </p>
        )}
      </div>
      <section className="admin-panel">
        <h2>Accounts</h2>
        <div className="admin-table-wrap" tabIndex={0} role="region" aria-label="Content table">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Access</th>
                <th>Account</th>
                <th>Confirm and save</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr key={user.id}>
                  <th scope="row">{user.name}</th>
                  <td>{user.email}</td>
                  <td>
                    <select
                      form={`user-${user.id}`}
                      name="role"
                      defaultValue={user.role}
                      aria-label={`Role for ${user.email}`}
                    >
                      <option value="ADMIN">Administrator</option>
                      <option value="EDITOR">Editor</option>
                    </select>
                  </td>
                  <td>
                    <select
                      form={`user-${user.id}`}
                      name="active"
                      defaultValue={String(user.active)}
                      aria-label={`Status for ${user.email}`}
                    >
                      <option value="true">Active</option>
                      <option value="false">Disabled</option>
                    </select>
                  </td>
                  <td>
                    <form id={`user-${user.id}`} action={updateManagedUser}>
                      <input type="hidden" name="id" value={user.id} />
                      <label>
                        <input type="checkbox" name="confirm" value="yes" required /> Confirm access
                        change
                      </label>
                      <button className="button button-secondary" type="submit">
                        Save access
                      </button>
                    </form>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p>
          At least one active administrator must remain. Your own account cannot be disabled or
          demoted.
        </p>
      </section>
      <section className="admin-panel">
        <h2>Add an account</h2>
        <form action={createManagedUser} className="admin-form">
          <label htmlFor="name">Name</label>
          <input id="name" name="name" required maxLength={120} />
          <label htmlFor="email">Email</label>
          <input id="email" name="email" type="email" required maxLength={254} />
          <label htmlFor="role">Role</label>
          <select id="role" name="role">
            <option value="EDITOR">Editor</option>
            <option value="ADMIN">Administrator</option>
          </select>
          <label htmlFor="password">Initial password (12–72 characters)</label>
          <input
            id="password"
            name="password"
            type="password"
            minLength={12}
            maxLength={72}
            required
            autoComplete="new-password"
          />
          <button className="button button-primary" type="submit">
            Create account
          </button>
          <p>
            Choose a unique password and share it with the user through a secure channel. Passwords
            never appear in the audit log.
          </p>
        </form>
      </section>
    </>
  );
}
