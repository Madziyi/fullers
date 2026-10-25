export function Arrow({ diagonal = false }: { diagonal?: boolean }) {
  return (
    <svg
      aria-hidden="true"
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
    >
      <path d={diagonal ? 'M6 18 18 6M6 6h12v12' : 'M4 12h15m-6-6 6 6-6 6'} />
    </svg>
  );
}
export function Symbol({ type }: { type: 'building' | 'truck' | 'quality' | 'stone' }) {
  return (
    <svg
      aria-hidden="true"
      width="32"
      height="32"
      viewBox="0 0 32 32"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.3"
    >
      {type === 'truck' ? (
        <>
          <path d="M3 8h17v16H3zM20 14h5l4 6v4h-9" />
          <circle cx="8" cy="25" r="3" />
          <circle cx="24" cy="25" r="3" />
        </>
      ) : type === 'quality' ? (
        <>
          <path d="m16 3 10 4v9c0 6-10 12-10 12S6 22 6 16V7zM11 15l4 4 7-8" />
        </>
      ) : type === 'stone' ? (
        <path d="m3 21 5-12 12-4 9 12-7 11H9zM8 9l7 10 14-2M15 19l-6 9m6-9L20 5" />
      ) : (
        <path d="M5 28V10h12v18M17 28V4h10v24M2 28h28M9 14h4m-4 5h4m-4 5h4M21 9h2m-2 5h2m-2 5h2m-2 5h2" />
      )}
    </svg>
  );
}
