'use client';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { saveProject, approveProject, unpublishProject, archiveProject } from './actions';
type ProjectFormData = {
  id: string;
  updatedAt: string;
  title: string;
  slug: string;
  location: string;
  projectDate: string;
  challenge: string;
  solution: string;
  outcome: string;
  clientName: string;
  clientPermission: boolean;
  featured: boolean;
  imageIds: string[];
  productIds: string[];
  seoTitle: string;
  seoDescription: string;
  status: string;
};
type Media = { id: string; storageKey: string; alt: string; source: string };
type Product = { id: string; name: string; status: string };
export function ProjectEditorForm({
  initial,
  media,
  products,
}: {
  initial: ProjectFormData | null;
  media: Media[];
  products: Product[];
}) {
  const router = useRouter();
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);
  const id = initial?.id;
  async function save(form: FormData) {
    setBusy(true);
    setMessage('Saving…');
    try {
      const result = await saveProject(form);
      setMessage(result.message);
      if (result.ok) {
        if (result.id && !id) router.push(`/admin/projects/${result.id}`);
        else router.refresh();
      }
    } catch {
      setMessage('The project could not be saved. Check the fields and try again.');
    } finally {
      setBusy(false);
    }
  }
  async function run(
    action: () => Promise<{ ok: boolean; message: string }>,
    confirmation?: string,
  ) {
    if (confirmation && !window.confirm(confirmation)) return;
    setBusy(true);
    try {
      const result = await action();
      setMessage(result.message);
      if (result.ok) router.refresh();
    } catch {
      setMessage('The action could not be completed. Reload and try again.');
    } finally {
      setBusy(false);
    }
  }
  return (
    <>
      <form
        action={save}
        className="admin-panel"
        style={{ display: 'grid', gap: '1rem', maxWidth: 850 }}
      >
        {initial && (
          <>
            <input type="hidden" name="id" value={initial.id} />
            <input type="hidden" name="updatedAt" value={initial.updatedAt} />
          </>
        )}
        <label>
          Project title
          <input name="title" required maxLength={160} defaultValue={initial?.title ?? ''} />
        </label>
        <label>
          URL slug
          <input
            name="slug"
            required
            pattern="[a-z0-9]+(?:-[a-z0-9]+)*"
            defaultValue={initial?.slug ?? ''}
          />
        </label>
        <label>
          Location (approved granularity only)
          <input name="location" maxLength={160} defaultValue={initial?.location ?? ''} />
        </label>
        <label>
          Completion date (optional)
          <input type="date" name="projectDate" defaultValue={initial?.projectDate ?? ''} />
        </label>
        <label>
          Challenge
          <textarea
            name="challenge"
            required
            minLength={20}
            maxLength={3000}
            rows={4}
            defaultValue={initial?.challenge ?? ''}
          />
        </label>
        <label>
          Fullers’ solution
          <textarea
            name="solution"
            required
            minLength={20}
            maxLength={3000}
            rows={4}
            defaultValue={initial?.solution ?? ''}
          />
        </label>
        <label>
          Outcome (verified details only)
          <textarea
            name="outcome"
            maxLength={2000}
            rows={3}
            defaultValue={initial?.outcome ?? ''}
          />
        </label>
        <label>
          Client name
          <input name="clientName" maxLength={120} defaultValue={initial?.clientName ?? ''} />
        </label>
        <label>
          <input
            type="checkbox"
            name="clientPermission"
            value="yes"
            defaultChecked={initial?.clientPermission}
          />{' '}
          I have permission to publish this client name
        </label>
        <fieldset>
          <legend>Project photographs</legend>
          <p>
            Select approved Fullers photographs. Each selected image needs descriptive alt text in
            the media library before approval.
          </p>
          <Link className="text-link" href="/admin/media">
            Review image descriptions →
          </Link>
          {media.length ? (
            media.map((image) => (
              <label
                key={image.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '.75rem',
                  marginBlock: '.5rem',
                }}
              >
                <input
                  type="checkbox"
                  name="imageIds"
                  value={image.id}
                  defaultChecked={initial?.imageIds.includes(image.id)}
                />
                <span
                  style={{
                    position: 'relative',
                    display: 'inline-block',
                    width: 96,
                    height: 72,
                    flex: '0 0 auto',
                  }}
                >
                  <Image
                    src={image.storageKey}
                    alt=""
                    fill
                    sizes="96px"
                    style={{ objectFit: 'cover' }}
                  />
                </span>
                <span>
                  {image.alt || 'No alt text'} <small>· {image.source}</small>
                </span>
              </label>
            ))
          ) : (
            <p>No images are available. Add project photographs in Media.</p>
          )}
        </fieldset>
        <fieldset>
          <legend>Products involved</legend>
          {products.map((product) => (
            <label key={product.id} style={{ display: 'block' }}>
              <input
                type="checkbox"
                name="productIds"
                value={product.id}
                defaultChecked={initial?.productIds.includes(product.id)}
              />{' '}
              {product.name} ({product.status.toLowerCase()})
            </label>
          ))}
        </fieldset>
        <label>
          <input
            type="checkbox"
            name="featured"
            value="yes"
            defaultChecked={initial?.featured ?? false}
          />{' '}
          Feature this project
        </label>
        <label>
          Search title
          <input name="seoTitle" maxLength={180} defaultValue={initial?.seoTitle ?? ''} />
        </label>
        <label>
          Search description
          <textarea
            name="seoDescription"
            maxLength={320}
            defaultValue={initial?.seoDescription ?? ''}
          />
        </label>
        <button className="button" type="submit" disabled={busy}>
          {busy ? 'Saving…' : 'Save private draft'}
        </button>
        <p role="status">{message}</p>
      </form>
      {initial && (
        <div
          style={{
            display: 'flex',
            gap: '1rem',
            alignItems: 'center',
            flexWrap: 'wrap',
            marginTop: '1rem',
          }}
        >
          <Link className="button button-outline" href={`/admin/projects/${initial.id}/preview`}>
            Preview privately
          </Link>
          <button
            className="button"
            disabled={busy}
            onClick={() => run(() => approveProject(initial.id, initial.updatedAt))}
          >
            Approve and publish
          </button>
          {initial.status === 'PUBLISHED' && (
            <button
              className="button button-secondary"
              disabled={busy}
              onClick={() => run(() => unpublishProject(initial.id))}
            >
              Unpublish
            </button>
          )}
          <button
            className="button button-outline"
            disabled={busy}
            onClick={() =>
              run(
                () => archiveProject(initial.id, initial.updatedAt),
                'Archive this project? It will be removed from the public site.',
              )
            }
          >
            Archive project
          </button>
        </div>
      )}
    </>
  );
}
