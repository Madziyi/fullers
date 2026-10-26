'use client';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { savePage } from './actions';
type Section = { heading: string; body: string };
export function PageEditorForm({
  id,
  version,
  title,
  slug,
  sections,
  seoTitle,
  seoDescription,
}: {
  id?: string;
  version?: number;
  title: string;
  slug: string;
  sections: Section[];
  seoTitle: string;
  seoDescription: string;
}) {
  const router = useRouter();
  const [items, setItems] = useState(sections.length ? sections : [{ heading: '', body: '' }]);
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);
  async function save(form: FormData) {
    setBusy(true);
    setMessage('Saving…');
    try {
      const result = await savePage(form);
      setMessage(result.message);
      if (result.ok) {
        if (result.id && !id) router.push(`/admin/pages/${result.id}`);
        else router.refresh();
      }
    } catch {
      setMessage('The page could not be saved. Check the fields and try again.');
    } finally {
      setBusy(false);
    }
  }
  return (
    <form
      action={save}
      className="admin-panel"
      style={{ display: 'grid', gap: '1rem', maxWidth: 850 }}
    >
      {id && (
        <>
          <input type="hidden" name="id" value={id} />
          <input type="hidden" name="version" value={version} />
        </>
      )}
      <label>
        Title
        <input name="title" required maxLength={160} defaultValue={title} />
      </label>
      <label>
        URL slug
        <input name="slug" required pattern="[a-z0-9]+(?:-[a-z0-9]+)*" defaultValue={slug} />
      </label>
      <input type="hidden" name="sectionCount" value={items.length} />
      {items.map((section, index) => (
        <fieldset key={index} style={{ display: 'grid', gap: '.75rem' }}>
          <legend>Content section {index + 1}</legend>
          <label>
            Heading
            <input
              name={`sectionHeading${index}`}
              required
              maxLength={120}
              value={section.heading}
              onChange={(e) =>
                setItems(items.map((s, i) => (i === index ? { ...s, heading: e.target.value } : s)))
              }
            />
          </label>
          <label>
            Text
            <textarea
              name={`sectionBody${index}`}
              required
              maxLength={3000}
              rows={5}
              value={section.body}
              onChange={(e) =>
                setItems(items.map((s, i) => (i === index ? { ...s, body: e.target.value } : s)))
              }
            />
          </label>
          {items.length > 1 && (
            <button
              type="button"
              className="button button-outline"
              onClick={() => setItems(items.filter((_, i) => i !== index))}
            >
              Remove section
            </button>
          )}
        </fieldset>
      ))}
      {items.length < 20 && (
        <button
          type="button"
          className="button button-outline"
          onClick={() => setItems([...items, { heading: '', body: '' }])}
        >
          Add section
        </button>
      )}
      <label>
        Search title
        <input name="seoTitle" maxLength={180} defaultValue={seoTitle} />
      </label>
      <label>
        Search description
        <textarea name="seoDescription" maxLength={320} defaultValue={seoDescription} />
      </label>
      <button className="button" type="submit" disabled={busy}>
        {busy ? 'Saving…' : 'Save draft'}
      </button>
      <p role="status">{message}</p>
      {id && (
        <Link className="text-link" href={`/admin/pages/${id}/preview`}>
          Preview privately →
        </Link>
      )}
    </form>
  );
}
