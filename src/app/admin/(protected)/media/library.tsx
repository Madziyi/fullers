'use client';
import Image from 'next/image';
import { useState } from 'react';
import { removeMedia, updateMedia } from './actions';
type Item = {
  id: string;
  storageKey: string;
  alt: string;
  source: string;
  width: number;
  height: number;
  bytes: number;
  focalX: number;
  focalY: number;
  createdAt: string;
  hasOriginal: boolean;
  _count: { products: number; posts: number; projects: number };
};
export function MediaLibrary({ initial }: { initial: Item[] }) {
  const [items] = useState(initial);
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);
  async function upload(form: FormData) {
    setBusy(true);
    setMessage('Uploading…');
    try {
      const response = await fetch('/api/media', { method: 'POST', body: form });
      const data = (await response.json()) as { error?: string };
      if (!response.ok) {
        setMessage(data.error ?? 'Upload failed.');
        return;
      }
      setMessage('Image uploaded. Refresh to edit its alt text.');
      location.reload();
    } catch {
      setMessage('Upload failed. Check the connection and retry.');
    } finally {
      setBusy(false);
    }
  }
  return (
    <>
      <form className="admin-panel media-upload" action={upload}>
        <label>
          Image file
          <input required type="file" name="image" accept="image/jpeg,image/png,image/webp" />
        </label>
        <label>
          Source or attribution
          <input
            required
            minLength={2}
            maxLength={180}
            name="source"
            placeholder="User-supplied image or photographer"
          />
        </label>
        <button className="button" disabled={busy}>
          {busy ? 'Uploading…' : 'Upload image'}
        </button>
        <p role="status">{message}</p>
        <small>JPEG, PNG or WebP; maximum 5 MB. Images are resized and stored as WebP.</small>
      </form>
      <div className="media-grid">
        {items.map((item) => (
          <MediaCard key={item.id} item={item} />
        ))}
        {!items.length && <p>No images in the library yet.</p>}
      </div>
    </>
  );
}
function MediaCard({ item }: { item: Item }) {
  const [alt, setAlt] = useState(item.alt);
  const [source, setSource] = useState(item.source);
  const [focalX, setFocalX] = useState(item.focalX);
  const [focalY, setFocalY] = useState(item.focalY);
  const [message, setMessage] = useState('');
  return (
    <article className="admin-panel media-card">
      <div className="media-thumb">
        <Image
          src={item.storageKey}
          alt={item.alt}
          fill
          unoptimized
          sizes="(max-width: 700px) 100vw, 300px"
          style={{ objectPosition: `${focalX * 100}% ${focalY * 100}%` }}
        />
      </div>
      <p>
        {item.width}×{item.height} · {(item.bytes / 1024).toFixed(0)} KB ·{' '}
        {item._count.products + item._count.posts + item._count.projects} content links
      </p>
      {item.hasOriginal && (
        <a className="text-link" href={`/api/media/${item.id}/source`}>
          Download original ↧
        </a>
      )}
      <label>
        Alt text
        <input maxLength={300} value={alt} onChange={(e) => setAlt(e.target.value)} />
      </label>
      <label>
        Source
        <input maxLength={180} value={source} onChange={(e) => setSource(e.target.value)} />
      </label>
      <label>
        Horizontal crop focus
        <input
          type="range"
          min="0"
          max="1"
          step="0.01"
          value={focalX}
          onChange={(e) => setFocalX(Number(e.target.value))}
        />
      </label>
      <label>
        Vertical crop focus
        <input
          type="range"
          min="0"
          max="1"
          step="0.01"
          value={focalY}
          onChange={(e) => setFocalY(Number(e.target.value))}
        />
      </label>
      <button
        className="button button-outline"
        onClick={async () => {
          const r = await updateMedia({ id: item.id, alt, source, focalX, focalY });
          setMessage(r.ok ? 'Saved.' : r.error);
        }}
      >
        Save details
      </button>
      <button
        className="text-link"
        onClick={async () => {
          const r = await removeMedia(item.id);
          setMessage(r.ok ? 'Archived.' : r.error);
          if (r.ok) location.reload();
        }}
      >
        Archive unused image
      </button>
      <span role="status">{message}</span>
    </article>
  );
}
