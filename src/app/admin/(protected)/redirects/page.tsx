import { requireAdmin } from '@/lib/auth';
import { db } from '@/lib/db';
import { resolveRedirect } from '@/lib/admin-operations';
import { deleteManagedRedirect, saveManagedRedirect } from '../operations/actions';

export default async function RedirectsPage({
  searchParams,
}: {
  searchParams: Promise<{ result?: string }>;
}) {
  await requireAdmin();
  const { result } = await searchParams;
  const redirects = await db.redirect.findMany({ orderBy: { source: 'asc' } });
  const mappings = redirects.map(({ source, destination }) => ({ source, destination }));
  return (
    <>
      <div className="admin-title">
        <p className="eyebrow">ADMINISTRATOR ONLY</p>
        <h1>Redirects</h1>
        <p>
          Maintain verified legacy paths. Destinations stay on this site, and loops or unsafe chains
          are rejected.
        </p>
        {result && (
          <p role="status">
            {(
              {
                saved: 'Redirect saved.',
                deleted: 'Redirect deleted.',
                unsafe: 'Use public same-site paths without queries or fragments.',
                cycle: 'This redirect would create a loop or unsafe chain.',
                confirm: 'Confirm the deletion before continuing.',
                invalid: 'Enter valid redirect paths.',
                readonly:
                  'This seed preview is read only. Switch to database content to edit redirects.',
                error: 'Redirect could not be saved. Check that its source is unique.',
              } as Record<string, string>
            )[result] ?? 'The requested redirect change was not completed.'}
          </p>
        )}
      </div>
      <section className="admin-panel">
        <h2>Add a redirect</h2>
        <form action={saveManagedRedirect} className="admin-form">
          <label htmlFor="source">From path</label>
          <input id="source" name="source" placeholder="/old-page" required maxLength={500} />
          <label htmlFor="destination">To path</label>
          <input
            id="destination"
            name="destination"
            placeholder="/products"
            required
            maxLength={500}
          />
          <label htmlFor="permanent">Redirect type</label>
          <select id="permanent" name="permanent">
            <option value="true">Permanent (301)</option>
            <option value="false">Temporary (302)</option>
          </select>
          <button className="button button-primary" type="submit">
            Add redirect
          </button>
        </form>
      </section>
      <section className="admin-panel">
        <h2>Current redirects</h2>
        {redirects.length ? (
          <div className="admin-table-wrap" tabIndex={0} role="region" aria-label="Content table">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>From</th>
                  <th>To</th>
                  <th>Resolution</th>
                  <th>Type</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {redirects.map((item) => (
                  <tr key={item.id}>
                    <td>{item.source}</td>
                    <td>{item.destination}</td>
                    <td>{resolveRedirect(item.source, mappings) ?? 'Unsafe chain'}</td>
                    <td>{item.permanent ? '301' : '302'}</td>
                    <td>
                      <details>
                        <summary>Edit or delete</summary>
                        <form action={saveManagedRedirect} className="admin-form">
                          <input type="hidden" name="id" value={item.id} />
                          <label htmlFor={`from-${item.id}`}>From path</label>
                          <input
                            id={`from-${item.id}`}
                            name="source"
                            defaultValue={item.source}
                            required
                            maxLength={500}
                          />
                          <label htmlFor={`to-${item.id}`}>To path</label>
                          <input
                            id={`to-${item.id}`}
                            name="destination"
                            defaultValue={item.destination}
                            required
                            maxLength={500}
                          />
                          <label htmlFor={`type-${item.id}`}>Type</label>
                          <select
                            id={`type-${item.id}`}
                            name="permanent"
                            defaultValue={String(item.permanent)}
                          >
                            <option value="true">Permanent (301)</option>
                            <option value="false">Temporary (302)</option>
                          </select>
                          <button className="button button-secondary" type="submit">
                            Save
                          </button>
                        </form>
                        <form action={deleteManagedRedirect}>
                          <input type="hidden" name="id" value={item.id} />
                          <label>
                            <input type="checkbox" name="confirm" value="yes" required /> Confirm
                            permanent deletion
                          </label>
                          <button className="button button-secondary" type="submit">
                            Delete redirect
                          </button>
                        </form>
                      </details>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p>No redirects are configured.</p>
        )}
      </section>
    </>
  );
}
