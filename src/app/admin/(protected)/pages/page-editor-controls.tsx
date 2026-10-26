'use client';
import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { archivePage, publishPage, unpublishPage } from './actions';
export function PageEditorControls({
  id,
  version,
  status,
}: {
  id: string;
  version: number;
  status: string;
}) {
  const [message, setMessage] = useState('');
  const [busy, startTransition] = useTransition();
  const router = useRouter();
  function run(action: () => Promise<{ ok: boolean; message: string }>, confirmMessage?: string) {
    if (confirmMessage && !window.confirm(confirmMessage)) return;
    startTransition(async () => {
      try {
        const result = await action();
        setMessage(result.message);
        if (result.ok) router.refresh();
      } catch {
        setMessage('The action could not be completed. Reload and try again.');
      }
    });
  }
  return (
    <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', flexWrap: 'wrap' }}>
      <button
        className="button"
        disabled={busy}
        onClick={() => run(() => publishPage(id, version))}
      >
        Publish / approve
      </button>
      {status === 'PUBLISHED' && (
        <button
          className="button button-secondary"
          disabled={busy}
          onClick={() => run(() => unpublishPage(id, version))}
        >
          Unpublish
        </button>
      )}
      <button
        className="button button-outline"
        disabled={busy}
        onClick={() =>
          run(
            () => archivePage(id, version),
            'Archive this page? It will be removed from the public site.',
          )
        }
      >
        Archive page
      </button>
      <span role="status">{message}</span>
    </div>
  );
}
