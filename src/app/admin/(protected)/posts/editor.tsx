'use client';
import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  cancelArticleSchedule,
  createArticleTaxonomy,
  publishArticle,
  saveArticle,
  scheduleArticle,
  unpublishArticle,
} from './actions';
import type { ArticleBody } from '@/lib/articles';
import { formatHarareDateTime, utcToHarareLocal } from '@/lib/scheduling-time';

type Props = {
  post: {
    id: string;
    version: number;
    title: string;
    slug: string;
    excerpt: string;
    body: ArticleBody;
    seoTitle: string;
    seoDescription: string;
    authorName: string;
    coverSrc: string | null;
    coverAlt: string;
    categoryId: string | null;
    tagIds: string[];
    categories: { id: string; name: string }[];
    tags: { id: string; name: string }[];
    productIds: string[];
    products: { id: string; name: string; slug: string }[];
    published: boolean;
    slugLocked: boolean;
    admin: boolean;
    defaultScheduleLocal: string;
    schedule: {
      id: string;
      status: string;
      runAt: string;
      attempts: number;
      lastError: string | null;
      scheduledVersion: number;
    } | null;
  };
};
export function ArticleEditor({ post }: Props) {
  const router = useRouter();
  const [form, setForm] = useState(post);
  const [status, setStatus] = useState('All changes saved');
  const [message, setMessage] = useState('');
  const [actionBusy, setActionBusy] = useState(false);
  const [scheduleLocal, setScheduleLocal] = useState(
    post.schedule ? utcToHarareLocal(new Date(post.schedule.runAt)) : post.defaultScheduleLocal,
  );
  const [scheduleState, setScheduleState] = useState(post.schedule);
  const [blocks, setBlocks] = useState<ArticleBody['blocks']>(post.body.blocks);
  const [categories, setCategories] = useState(post.categories);
  const [tags, setTags] = useState(post.tags);
  const [taxonomyName, setTaxonomyName] = useState('');
  const [taxonomyKind, setTaxonomyKind] = useState<'category' | 'tag'>('category');
  const dirty = useRef(false);
  const generation = useRef(0);
  const version = useRef(post.version);
  const saving = useRef<Promise<number | null> | null>(null);
  const actionLock = useRef(false);
  const manualSlug = useRef(false);
  const currentUrl = useRef('');
  const latest = useRef({ ...post, body: post.body });
  useEffect(() => {
    latest.current = { ...form, body: { type: 'doc', blocks }, productIds: form.productIds };
  }, [form, blocks]);
  const changed = () => {
    dirty.current = true;
    generation.current++;
    setStatus('Unsaved changes');
    setMessage('');
  };
  const set = (
    key: 'title' | 'slug' | 'excerpt' | 'seoTitle' | 'seoDescription',
    value: string,
  ) => {
    changed();
    setForm((old) => ({
      ...old,
      [key]: value,
      ...(key === 'title' && !post.slugLocked && !manualSlug.current
        ? {
            slug: value
              .toLowerCase()
              .trim()
              .replace(/[^a-z0-9]+/g, '-')
              .replace(/^-|-$/g, ''),
          }
        : {}),
    }));
  };
  async function save(): Promise<number | null> {
    if (saving.current) return saving.current;
    if (!dirty.current) return version.current;
    saving.current = (async () => {
      try {
        let savedVersion = version.current;
        do {
          const sentGeneration = generation.current;
          setStatus('Saving…');
          const snapshot = latest.current;
          const result = await saveArticle({ ...snapshot, version: savedVersion });
          if (!result.ok) {
            setStatus('Save needs attention');
            setMessage(
              'error' in result ? String(result.error) : 'Please review the article and retry.',
            );
            return null;
          }
          savedVersion = result.version;
          version.current = result.version;
          setForm((old) => ({ ...old, version: result.version }));
          if (result.scheduleConflict) {
            setScheduleState((old) =>
              old
                ? {
                    ...old,
                    status: 'NEEDS_REVIEW',
                    lastError:
                      'The saved article changed after scheduling. Review and schedule it again.',
                  }
                : old,
            );
            setMessage(
              'This draft changed after scheduling. Review the new draft and schedule it again.',
            );
          }
          dirty.current = generation.current !== sentGeneration;
        } while (dirty.current);
        setStatus('All changes saved');
        return savedVersion;
      } catch {
        setStatus('Save failed');
        setMessage('Your latest edits remain on this device. Check your connection and retry.');
        return null;
      } finally {
        saving.current = null;
      }
    })();
    return saving.current;
  }
  useEffect(() => {
    if (!dirty.current) return;
    const timer = setTimeout(() => void save(), 900);
    return () => clearTimeout(timer);
  }, [form, blocks]);
  useEffect(() => {
    const guard = (event: BeforeUnloadEvent) => {
      if (dirty.current || saving.current) {
        event.preventDefault();
        event.returnValue = '';
      }
    };
    window.addEventListener('beforeunload', guard);
    return () => window.removeEventListener('beforeunload', guard);
  }, []);
  useEffect(() => {
    currentUrl.current = window.location.href;
    const saveThenNavigate = async (target: string) => {
      const v = await save();
      if (v !== null) router.push(target);
    };
    const onClick = (event: MouseEvent) => {
      if (actionLock.current) {
        event.preventDefault();
        event.stopImmediatePropagation();
        return;
      }
      if (!(dirty.current || saving.current)) return;
      const target = event.target;
      if (!(target instanceof Element)) return;
      const anchor = target.closest('a[href]');
      if (!(anchor instanceof HTMLAnchorElement) || anchor.target === '_blank') return;
      const destination = new URL(anchor.href, window.location.href);
      if (destination.origin !== window.location.origin) return;
      event.preventDefault();
      event.stopImmediatePropagation();
      void saveThenNavigate(`${destination.pathname}${destination.search}${destination.hash}`);
    };
    const onPopState = (event: PopStateEvent) => {
      if (actionLock.current) {
        event.stopImmediatePropagation();
        window.history.pushState(null, '', currentUrl.current);
        return;
      }
      if (!(dirty.current || saving.current)) {
        currentUrl.current = window.location.href;
        return;
      }
      const destination = window.location.href;
      event.stopImmediatePropagation();
      window.history.pushState(null, '', currentUrl.current);
      void saveThenNavigate(destination);
    };
    document.addEventListener('click', onClick, true);
    window.addEventListener('popstate', onPopState, true);
    return () => {
      document.removeEventListener('click', onClick, true);
      window.removeEventListener('popstate', onPopState, true);
    };
  }, [router]);
  function add(type: 'paragraph' | 'heading2' | 'heading3' | 'quote' | 'list' | 'link' | 'image') {
    const block =
      type === 'list'
        ? { type, items: [''] }
        : type === 'image'
          ? { type, src: '/assets/quarry-stones.webp', alt: '', caption: '' }
          : type === 'link'
            ? { type, text: '', href: '/products' }
            : { type, text: '' };
    setBlocks((items) => [...items, block] as ArticleBody['blocks']);
    changed();
  }
  async function uploadImage(index: number, file: File) {
    const data = new FormData();
    data.set('image', file);
    data.set('source', 'Article editor upload');
    data.set('postId', post.id);
    setStatus('Uploading image…');
    try {
      const response = await fetch('/api/article-media', { method: 'POST', body: data });
      const result = (await response.json()) as { url?: string; error?: string };
      if (!response.ok || !result.url) {
        setStatus('Upload failed');
        setMessage(result.error ?? 'The image could not be uploaded.');
        return;
      }
      changed();
      setBlocks((items) =>
        items.map((item, i) =>
          i === index && item.type === 'image' ? { ...item, src: result.url ?? item.src } : item,
        ),
      );
      setMessage('Image uploaded privately. Add descriptive alt text before publishing.');
    } catch {
      setStatus('Upload failed');
      setMessage('The image could not be uploaded. Check your connection and retry.');
    }
  }
  async function addTaxonomy() {
    const result = await createArticleTaxonomy(taxonomyKind, taxonomyName);
    if (!result.ok) {
      setMessage('error' in result ? String(result.error) : 'Could not add the taxonomy item.');
      return;
    }
    if (taxonomyKind === 'category') {
      setCategories((items) =>
        [...items.filter((item) => item.id !== result.item.id), result.item].sort((a, b) =>
          a.name.localeCompare(b.name),
        ),
      );
    } else
      setTags((items) =>
        [...items.filter((item) => item.id !== result.item.id), result.item].sort((a, b) =>
          a.name.localeCompare(b.name),
        ),
      );
    setTaxonomyName('');
    setMessage(`${taxonomyKind === 'category' ? 'Category' : 'Tag'} added.`);
  }
  async function runPublicationAction(action: 'publish' | 'unpublish') {
    if (actionLock.current) return;
    actionLock.current = true;
    setActionBusy(true);
    setStatus(action === 'publish' ? 'Publishing…' : 'Unpublishing…');
    let reloading = false;
    try {
      const savedVersion = await save();
      if (savedVersion === null) {
        setMessage(
          `Resolve the save issue before ${action === 'publish' ? 'publishing' : 'unpublishing'}.`,
        );
        return;
      }
      const result =
        action === 'publish'
          ? await publishArticle(post.id, savedVersion)
          : await unpublishArticle(post.id);
      if (!result.ok) {
        setMessage('error' in result ? String(result.error) : 'The article could not be updated.');
        setStatus('All changes saved');
        return;
      }
      setMessage(action === 'publish' ? 'Article published.' : 'Article unpublished.');
      reloading = true;
      location.reload();
    } catch {
      setMessage(
        `The article could not be ${action === 'publish' ? 'published' : 'unpublished'}. Retry when the connection is available.`,
      );
      setStatus('Action failed');
    } finally {
      if (!reloading) {
        actionLock.current = false;
        setActionBusy(false);
      }
    }
  }
  async function runScheduleAction(action: 'schedule' | 'cancel') {
    if (actionLock.current) return;
    actionLock.current = true;
    setActionBusy(true);
    setStatus(action === 'schedule' ? 'Saving schedule…' : 'Cancelling schedule…');
    try {
      const savedVersion = await save();
      if (savedVersion === null) {
        setMessage('Resolve the save issue before changing this schedule.');
        return;
      }
      if (action === 'schedule') {
        const result = await scheduleArticle({
          id: post.id,
          version: savedVersion,
          localDateTime: scheduleLocal,
        });
        if (!result.ok) {
          setMessage('error' in result ? String(result.error) : 'The schedule could not be saved.');
          setStatus('Schedule needs attention');
          return;
        }
        version.current = result.version;
        setForm((old) => ({ ...old, version: result.version }));
        setScheduleState({
          id: result.jobId,
          status: 'PENDING',
          runAt: result.runAt,
          attempts: 0,
          lastError: null,
          scheduledVersion: result.version,
        });
        setStatus('Schedule saved');
        setMessage('The saved version is queued for publication at the selected Zimbabwe time.');
      } else {
        if (!scheduleState) return;
        const result = await cancelArticleSchedule(post.id, savedVersion);
        if (!result.ok) {
          setMessage(
            'error' in result ? String(result.error) : 'The schedule could not be cancelled.',
          );
          setStatus('Schedule needs attention');
          return;
        }
        version.current = result.version;
        setForm((old) => ({ ...old, version: result.version }));
        setScheduleState({
          ...scheduleState,
          status: 'CANCELLED',
          lastError: 'Cancelled by an administrator.',
        });
        setStatus('Schedule cancelled');
        setMessage(
          post.published
            ? 'The current published version remains live.'
            : 'The draft remains private.',
        );
      }
    } catch {
      setMessage('The schedule could not be updated. Retry when the connection is available.');
      setStatus('Schedule update failed');
    } finally {
      actionLock.current = false;
      setActionBusy(false);
    }
  }
  return (
    <div className="article-editor">
      <div className="article-toolbar">
        <div>
          <button
            disabled={actionBusy}
            onClick={async () => {
              const v = await save();
              if (v !== null) router.push('/admin/posts');
            }}
          >
            ← Articles
          </button>
          <span role="status">{status}</span>
          {message && (
            <button disabled={actionBusy} onClick={() => void save()}>
              Retry save
            </button>
          )}
        </div>
        <div>
          <button
            className="button button-small button-outline"
            disabled={actionBusy}
            onClick={async () => {
              const previewWindow = window.open('about:blank', '_blank');
              if (!previewWindow) {
                setMessage('Allow a new tab to open the private preview.');
                return;
              }
              const v = await save();
              if (v !== null) previewWindow.location.href = `/admin/posts/${post.id}/preview`;
              else previewWindow.close();
            }}
          >
            Preview
          </button>
          {post.admin && (
            <button
              className="button button-small"
              disabled={actionBusy}
              onClick={() => void runPublicationAction('publish')}
            >
              {post.published ? 'Publish updates' : 'Publish'}
            </button>
          )}
          {post.admin && post.published && (
            <button
              className="button button-small button-outline"
              disabled={actionBusy}
              onClick={() => void runPublicationAction('unpublish')}
            >
              Unpublish
            </button>
          )}
        </div>
      </div>
      <fieldset className="article-workspace" disabled={actionBusy} aria-busy={actionBusy}>
        <section className="article-writing">
          <label>
            Article title
            <input
              value={form.title}
              onChange={(e) => set('title', e.target.value)}
              maxLength={160}
            />
          </label>
          <label>
            Public URL slug
            <input
              value={form.slug}
              onChange={(e) => {
                manualSlug.current = true;
                set('slug', e.target.value);
              }}
              disabled={post.slugLocked}
            />
          </label>
          <label>
            Short introduction
            <textarea
              rows={3}
              value={form.excerpt}
              onChange={(e) => set('excerpt', e.target.value)}
            />
          </label>
          <label>
            Author byline
            <input
              value={form.authorName}
              maxLength={120}
              onChange={(e) => {
                changed();
                setForm((old) => ({ ...old, authorName: e.target.value }));
              }}
            />
          </label>
          <label>
            Cover image
            <select
              value={form.coverSrc ?? ''}
              onChange={(e) => {
                changed();
                setForm((old) => ({ ...old, coverSrc: e.target.value || null }));
              }}
            >
              <option value="">No cover image</option>
              <option value="/assets/quarry-stones.webp">Quarry stones</option>
              <option value="/assets/bricks.webp">Bricks</option>
              <option value="/assets/half-moons.webp">Half Moons</option>
              <option value="/assets/interlocking-pavers.webp">Interlocking pavers</option>
              <option value="/assets/delivery-equipment.webp">Delivery equipment</option>
            </select>
          </label>
          {form.coverSrc && (
            <label>
              Cover image alt text
              <input
                value={form.coverAlt}
                maxLength={300}
                onChange={(e) => {
                  changed();
                  setForm((old) => ({ ...old, coverAlt: e.target.value }));
                }}
              />
            </label>
          )}
          <label>
            Category
            <select
              value={form.categoryId ?? ''}
              onChange={(e) => {
                changed();
                setForm((old) => ({ ...old, categoryId: e.target.value || null }));
              }}
            >
              <option value="">Uncategorised</option>
              {categories.map((category) => (
                <option value={category.id} key={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
          </label>
          {post.admin && (
            <div className="taxonomy-controls">
              <label>
                Maintain categories and tags
                <input
                  value={taxonomyName}
                  onChange={(event) => setTaxonomyName(event.target.value)}
                  maxLength={80}
                />
              </label>
              <select
                aria-label="Taxonomy type"
                value={taxonomyKind}
                onChange={(event) => setTaxonomyKind(event.target.value as 'category' | 'tag')}
              >
                <option value="category">Category</option>
                <option value="tag">Tag</option>
              </select>
              <button type="button" onClick={() => void addTaxonomy()}>
                Add
              </button>
            </div>
          )}
          {tags.length > 0 && (
            <fieldset>
              <legend>Tags</legend>
              {tags.map((tag) => (
                <label className="product-choice" key={tag.id}>
                  <input
                    type="checkbox"
                    checked={form.tagIds.includes(tag.id)}
                    onChange={(e) => {
                      changed();
                      setForm((old) => ({
                        ...old,
                        tagIds: e.target.checked
                          ? [...old.tagIds, tag.id]
                          : old.tagIds.filter((id) => id !== tag.id),
                      }));
                    }}
                  />
                  {tag.name}
                </label>
              ))}
            </fieldset>
          )}
          <div className="block-controls" aria-label="Add a content block">
            <button onClick={() => add('paragraph')}>＋ Paragraph</button>
            <button onClick={() => add('heading2')}>＋ Heading</button>
            <button onClick={() => add('heading3')}>＋ Subheading</button>
            <button onClick={() => add('list')}>＋ List</button>
            <button onClick={() => add('quote')}>＋ Quote</button>
            <button onClick={() => add('link')}>＋ Link</button>
            <button onClick={() => add('image')}>＋ Image</button>
          </div>
          <div className="article-blocks">
            {blocks.map((block, index) => (
              <div className="article-block" key={index}>
                <strong>
                  {block.type === 'paragraph'
                    ? 'Paragraph'
                    : block.type === 'heading2'
                      ? 'Heading 2'
                      : block.type === 'heading3'
                        ? 'Heading 3'
                        : block.type === 'quote'
                          ? 'Quote'
                          : block.type === 'list'
                            ? 'List'
                            : block.type === 'link'
                              ? 'Internal or web link'
                              : 'Image and caption'}
                </strong>
                {block.type === 'list' ? (
                  <textarea
                    aria-label="List items, one per line"
                    rows={Math.max(2, block.items.length)}
                    value={block.items.join('\n')}
                    onChange={(e) => {
                      changed();
                      setBlocks((items) =>
                        items.map((item, i) =>
                          i === index ? { type: 'list', items: e.target.value.split('\n') } : item,
                        ),
                      );
                    }}
                  />
                ) : block.type === 'image' ? (
                  <>
                    <select
                      aria-label="Choose approved image"
                      value={block.src}
                      onChange={(e) => {
                        changed();
                        setBlocks((items) =>
                          items.map((item, i) =>
                            i === index ? { ...block, src: e.target.value } : item,
                          ),
                        );
                      }}
                    >
                      <option value="/assets/quarry-stones.webp">Quarry stones</option>
                      <option value="/assets/bricks.webp">Bricks</option>
                      <option value="/assets/half-moons.webp">Half Moons</option>
                      <option value="/assets/interlocking-pavers.webp">Interlocking Pavers</option>
                      <option value="/assets/delivery-equipment.webp">Delivery equipment</option>
                    </select>
                    <label>
                      Upload a private image
                      <input
                        type="file"
                        accept="image/jpeg,image/png,image/webp"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) void uploadImage(index, file);
                        }}
                      />
                    </label>
                    <input
                      aria-label="Descriptive image alt text"
                      placeholder="Describe what the image shows"
                      value={block.alt}
                      onChange={(e) => {
                        changed();
                        setBlocks((items) =>
                          items.map((item, i) =>
                            i === index ? { ...block, alt: e.target.value } : item,
                          ),
                        );
                      }}
                    />
                    <input
                      aria-label="Image caption"
                      placeholder="Optional caption"
                      value={block.caption}
                      onChange={(e) => {
                        changed();
                        setBlocks((items) =>
                          items.map((item, i) =>
                            i === index ? { ...block, caption: e.target.value } : item,
                          ),
                        );
                      }}
                    />
                  </>
                ) : block.type === 'link' ? (
                  <>
                    <input
                      aria-label="Link text"
                      placeholder="Descriptive link text"
                      value={block.text}
                      onChange={(e) => {
                        changed();
                        setBlocks((items) =>
                          items.map((item, i) =>
                            i === index ? { ...block, text: e.target.value } : item,
                          ),
                        );
                      }}
                    />
                    <select
                      aria-label="Choose related published product"
                      value={block.href}
                      onChange={(e) => {
                        changed();
                        setBlocks((items) =>
                          items.map((item, i) =>
                            i === index ? { ...block, href: e.target.value } : item,
                          ),
                        );
                      }}
                    >
                      {post.products.map((p) => (
                        <option key={p.id} value={`/products/${p.slug}`}>
                          {p.name}
                        </option>
                      ))}
                      <option value="/products">All products</option>
                      <option value="/contact">Contact Fullers</option>
                    </select>
                  </>
                ) : (
                  <textarea
                    aria-label={block.type}
                    rows={block.type === 'paragraph' ? 5 : 2}
                    value={block.text}
                    onChange={(e) => {
                      changed();
                      setBlocks((items) =>
                        items.map((item, i) =>
                          i === index ? ({ ...item, text: e.target.value } as typeof item) : item,
                        ),
                      );
                    }}
                  />
                )}
                <button
                  aria-label="Remove block"
                  onClick={() => {
                    changed();
                    setBlocks((items) => items.filter((_, i) => i !== index));
                  }}
                >
                  Remove
                </button>
              </div>
            ))}
          </div>
          {message && (
            <p className="admin-notice" role="status">
              {message}
            </p>
          )}
          {!post.admin && (
            <p className="admin-notice">
              Editors can save drafts. An administrator publishes articles.
            </p>
          )}
        </section>
        <aside className="article-sidebar">
          <section>
            <h2>Search appearance</h2>
            <label>
              Search title
              <input value={form.seoTitle} onChange={(e) => set('seoTitle', e.target.value)} />
            </label>
            <label>
              Search description
              <textarea
                rows={4}
                value={form.seoDescription}
                onChange={(e) => set('seoDescription', e.target.value)}
              />
            </label>
            <div className="search-preview">
              <small>FULLERS AGGREGATE · /blog/{form.slug || 'article'}</small>
              <strong>{form.seoTitle || form.title || 'Article title'}</strong>
              <span>
                {form.seoDescription ||
                  form.excerpt ||
                  'Add a useful description for search and sharing.'}
              </span>
            </div>
          </section>
          <section>
            <h2>Useful checks</h2>
            <ul>
              <li>{form.title.length >= 5 ? '✓' : '○'} Descriptive title</li>
              <li>{form.excerpt.length >= 40 ? '✓' : '○'} Introduction gives readers context</li>
              <li>
                {blocks.some((b) => b.type === 'heading2' || b.type === 'heading3') ? '✓' : '○'}{' '}
                Clear section headings
              </li>
              <li>
                {form.seoDescription.length >= 60 ? '✓' : '○'} Search description with useful detail
              </li>
            </ul>
            <p>Guidance helps readers understand the page; it does not predict search ranking.</p>
          </section>
          <section>
            <h2>Related products</h2>
            {post.products.map((product) => (
              <label className="product-choice" key={product.id}>
                <input
                  type="checkbox"
                  checked={form.productIds.includes(product.id)}
                  onChange={(e) => {
                    changed();
                    setStatus('Unsaved changes');
                    setForm((old) => ({
                      ...old,
                      productIds: e.target.checked
                        ? [...old.productIds, product.id]
                        : old.productIds.filter((id) => id !== product.id),
                    }));
                  }}
                />
                {product.name}
              </label>
            ))}
          </section>
          {post.admin && (
            <section className="schedule-panel" aria-labelledby="schedule-heading">
              <h2 id="schedule-heading">Scheduled publication</h2>
              {scheduleState && (
                <div className="schedule-status" role="status">
                  <strong>
                    {scheduleState.status === 'PENDING' || scheduleState.status === 'RETRY'
                      ? 'Queued'
                      : scheduleState.status === 'PUBLISHED'
                        ? 'Published'
                        : scheduleState.status === 'NEEDS_REVIEW'
                          ? 'Needs review'
                          : scheduleState.status === 'FAILED'
                            ? 'Failed'
                            : 'Cancelled'}
                  </strong>
                  <span>{formatHarareDateTime(new Date(scheduleState.runAt))}</span>
                  {scheduleState.attempts > 0 && (
                    <span>Worker attempts: {scheduleState.attempts} of 5</span>
                  )}
                  {scheduleState.lastError && <p>{scheduleState.lastError}</p>}
                </div>
              )}
              <label htmlFor="schedule-local-time">
                Publish time in Zimbabwe (CAT, Africa/Harare)
              </label>
              <input
                id="schedule-local-time"
                type="datetime-local"
                value={scheduleLocal}
                onChange={(event) => setScheduleLocal(event.target.value)}
                disabled={actionBusy}
              />
              <p>
                Times are stored in UTC. The worker must be called by a configured hosting schedule;
                without that trigger, the article stays queued and private.
              </p>
              <div className="schedule-actions">
                <button
                  className="button button-small"
                  disabled={actionBusy}
                  onClick={() => void runScheduleAction('schedule')}
                >
                  {scheduleState?.status === 'PENDING' || scheduleState?.status === 'RETRY'
                    ? 'Reschedule'
                    : 'Schedule publication'}
                </button>
                {(scheduleState?.status === 'PENDING' || scheduleState?.status === 'RETRY') && (
                  <button
                    className="button button-small button-outline"
                    disabled={actionBusy}
                    onClick={() => void runScheduleAction('cancel')}
                  >
                    Cancel schedule
                  </button>
                )}
              </div>
            </section>
          )}
        </aside>
      </fieldset>
    </div>
  );
}
