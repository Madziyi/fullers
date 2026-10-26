'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { deleteProduct, saveProduct } from './actions';

type Product = {
  id: string;
  name: string;
  slug: string;
  summary: string;
  body: unknown;
  applications: string[];
  updatedAt: string;
  specifications: unknown;
  faqs: unknown;
  imageId: string | null;
  imageAlt: string | null;
  related: unknown;
  featured: boolean;
  sortOrder: number;
  seo: unknown;
  status: string;
};
type ImageOption = {
  id: string;
  url: string;
  alt: string;
  source: string;
  width: number;
  height: number;
};
type RelatedOption = { id: string; name: string };
const arr = <T,>(value: unknown): T[] => (Array.isArray(value) ? (value as T[]) : []);
export function ProductEditor({
  product,
  images,
  relatedOptions,
}: {
  product: Product;
  images: ImageOption[];
  relatedOptions: RelatedOption[];
}) {
  const router = useRouter();
  const body = product.body as { paragraphs?: string[] } | null;
  const seo = product.seo as { title?: string; description?: string } | null;
  const [form, setForm] = useState({
    name: product.name,
    slug: product.slug,
    summary: product.summary,
    paragraphs: (body?.paragraphs ?? []).join('\n\n'),
    applications: product.applications,
    specifications: arr<{ label: string; value: string }>(product.specifications).filter(
      (x) => typeof x?.label === 'string' && typeof x?.value === 'string',
    ),
    faqs: arr<{ question: string; answer: string }>(product.faqs).filter(
      (x) => typeof x?.question === 'string' && typeof x?.answer === 'string',
    ),
    imageId: product.imageId ?? '',
    imageAlt: product.imageAlt ?? '',
    relatedIds: arr<string>(product.related).map((x) => x),
    featured: product.featured,
    sortOrder: String(product.sortOrder),
    seoTitle: seo?.title ?? '',
    seoDescription: seo?.description ?? '',
    status: product.status === 'PUBLISHED' ? 'PUBLISHED' : 'DRAFT',
  });
  const [expectedUpdatedAt, setExpectedUpdatedAt] = useState(product.updatedAt);
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);
  function update(key: string, value: string | boolean | string[]) {
    setForm((old) => ({ ...old, [key]: value }));
  }
  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setMessage('Saving…');
    try {
      if (
        form.specifications.some((row) => !row.label.trim() || !row.value.trim()) ||
        form.faqs.some((row) => !row.question.trim() || !row.answer.trim())
      ) {
        setMessage('Complete or remove each specification and question row before saving.');
        return;
      }
      const result = await saveProduct({
        id: product.id,
        expectedUpdatedAt,
        ...form,
        paragraphs: form.paragraphs
          .split(/\n\s*\n/)
          .map((s) => s.trim())
          .filter(Boolean),
        specifications: form.specifications,
        faqs: form.faqs,
        imageId: form.imageId || null,
        sortOrder: Number(form.sortOrder),
        featured: form.featured,
        status: form.status,
      });
      setMessage(result.ok ? 'Saved.' : result.error);
      if (result.ok) {
        setExpectedUpdatedAt(result.updatedAt);
        router.refresh();
      }
    } catch {
      setMessage(
        'The save did not complete. Your edits remain on this page; retry when the connection is available.',
      );
    } finally {
      setBusy(false);
    }
  }
  return (
    <form className="admin-panel product-editor" onSubmit={submit}>
      <p>
        <Link className="text-link" href={`/admin/products/${product.id}/preview`} target="_blank">
          Open private preview ↗
        </Link>
      </p>
      <div className="form-grid">
        <label>
          Product name
          <input
            required
            maxLength={120}
            value={form.name}
            onChange={(e) => update('name', e.target.value)}
          />
        </label>
        <label>
          URL slug
          <input
            required
            pattern="[a-z0-9]+(?:-[a-z0-9]+)*"
            value={form.slug}
            onChange={(e) => update('slug', e.target.value)}
          />
        </label>
        <label className="wide">
          Summary
          <textarea
            rows={3}
            maxLength={500}
            value={form.summary}
            onChange={(e) => update('summary', e.target.value)}
          />
        </label>
        <label className="wide">
          Product details{' '}
          <small>One paragraph per blank line. Only enter facts confirmed by Fullers.</small>
          <textarea
            rows={7}
            value={form.paragraphs}
            onChange={(e) => update('paragraphs', e.target.value)}
          />
        </label>
        <fieldset className="wide">
          <legend>Applications</legend>
          {['Building', 'Landscaping', 'Infrastructure'].map((x) => (
            <label key={x}>
              <input
                type="checkbox"
                checked={form.applications.includes(x)}
                onChange={(e) =>
                  update(
                    'applications',
                    e.target.checked
                      ? [...form.applications, x]
                      : form.applications.filter((a) => a !== x),
                  )
                }
              />
              {x}
            </label>
          ))}
        </fieldset>
        <fieldset className="wide">
          <legend>
            Sizes and specifications <small>Only add details confirmed by Fullers.</small>
          </legend>
          {form.specifications.map((row, index) => (
            <div className="product-row form-grid" key={index}>
              <label>
                Specification label
                <input
                  value={row.label}
                  maxLength={80}
                  onChange={(e) =>
                    setForm((old) => ({
                      ...old,
                      specifications: old.specifications.map((item, i) =>
                        i === index ? { ...item, label: e.target.value } : item,
                      ),
                    }))
                  }
                />
              </label>
              <label>
                Value
                <input
                  value={row.value}
                  maxLength={160}
                  onChange={(e) =>
                    setForm((old) => ({
                      ...old,
                      specifications: old.specifications.map((item, i) =>
                        i === index ? { ...item, value: e.target.value } : item,
                      ),
                    }))
                  }
                />
              </label>
              <button
                type="button"
                className="text-link"
                onClick={() =>
                  setForm((old) => ({
                    ...old,
                    specifications: old.specifications.filter((_, i) => i !== index),
                  }))
                }
              >
                Remove specification
              </button>
            </div>
          ))}
          <button
            type="button"
            className="button button-outline"
            onClick={() =>
              setForm((old) => ({
                ...old,
                specifications: [...old.specifications, { label: '', value: '' }],
              }))
            }
          >
            Add specification
          </button>
        </fieldset>
        <fieldset className="wide">
          <legend>Frequently asked questions</legend>
          {form.faqs.map((row, index) => (
            <div className="product-row form-grid" key={index}>
              <label>
                Question
                <input
                  value={row.question}
                  maxLength={180}
                  onChange={(e) =>
                    setForm((old) => ({
                      ...old,
                      faqs: old.faqs.map((item, i) =>
                        i === index ? { ...item, question: e.target.value } : item,
                      ),
                    }))
                  }
                />
              </label>
              <label>
                Answer
                <textarea
                  rows={3}
                  value={row.answer}
                  maxLength={1000}
                  onChange={(e) =>
                    setForm((old) => ({
                      ...old,
                      faqs: old.faqs.map((item, i) =>
                        i === index ? { ...item, answer: e.target.value } : item,
                      ),
                    }))
                  }
                />
              </label>
              <button
                type="button"
                className="text-link"
                onClick={() =>
                  setForm((old) => ({ ...old, faqs: old.faqs.filter((_, i) => i !== index) }))
                }
              >
                Remove question
              </button>
            </div>
          ))}
          <button
            type="button"
            className="button button-outline"
            onClick={() =>
              setForm((old) => ({ ...old, faqs: [...old.faqs, { question: '', answer: '' }] }))
            }
          >
            Add question
          </button>
        </fieldset>
        <fieldset className="wide">
          <legend>Related products</legend>
          {relatedOptions
            .filter((item) => item.id !== product.id)
            .map((item) => (
              <label key={item.id}>
                <input
                  type="checkbox"
                  checked={form.relatedIds.includes(item.id)}
                  onChange={(e) =>
                    update(
                      'relatedIds',
                      e.target.checked
                        ? [...form.relatedIds, item.id]
                        : form.relatedIds.filter((id) => id !== item.id),
                    )
                  }
                />
                {item.name}
              </label>
            ))}
        </fieldset>
        <label>
          Product image
          <select value={form.imageId} onChange={(e) => update('imageId', e.target.value)}>
            <option value="">No product photo</option>
            {images.map((i) => (
              <option key={i.id} value={i.id}>
                {i.source} · {i.width}×{i.height}
              </option>
            ))}
          </select>
          <small>
            Choosing another image updates this product only; the old image remains in the library.
          </small>
        </label>
        <label>
          Image alt text
          <input
            maxLength={300}
            value={form.imageAlt}
            onChange={(e) => update('imageAlt', e.target.value)}
          />
        </label>
        <label>
          SEO title
          <input
            maxLength={180}
            value={form.seoTitle}
            onChange={(e) => update('seoTitle', e.target.value)}
          />
        </label>
        <label>
          SEO description
          <textarea
            maxLength={320}
            rows={2}
            value={form.seoDescription}
            onChange={(e) => update('seoDescription', e.target.value)}
          />
        </label>
        <label>
          Display order
          <input
            type="number"
            min="0"
            max="10000"
            value={form.sortOrder}
            onChange={(e) => update('sortOrder', e.target.value)}
          />
        </label>
        <label>
          Status
          <select value={form.status} onChange={(e) => update('status', e.target.value)}>
            <option value="DRAFT">Draft</option>
            <option value="PUBLISHED">Published</option>
          </select>
        </label>
        <label>
          <input
            type="checkbox"
            checked={form.featured}
            onChange={(e) => update('featured', e.target.checked)}
          />{' '}
          Feature on homepage
        </label>
      </div>
      <div className="editor-actions">
        <button className="button" disabled={busy}>
          {busy
            ? 'Saving…'
            : form.status === 'PUBLISHED'
              ? 'Publish product changes'
              : 'Save draft'}
        </button>
        <span role="status">{message}</span>
      </div>
      {form.status === 'PUBLISHED' && (
        <p>
          Publishing makes the current saved content public immediately. Switch to Draft and save to
          take the product page offline.
        </p>
      )}
      <button
        type="button"
        className="text-link"
        onClick={async () => {
          if (confirm('Move this product to the archive?')) {
            const r = await deleteProduct(product.id, expectedUpdatedAt);
            if (r.ok) router.push('/admin/products');
            else setMessage(r.error);
          }
        }}
      >
        Archive product
      </button>
    </form>
  );
}
