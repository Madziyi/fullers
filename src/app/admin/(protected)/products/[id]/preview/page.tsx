import Image from 'next/image';
import { notFound } from 'next/navigation';
import { requireAdmin } from '@/lib/auth';
import { db } from '@/lib/db';
export const dynamic = 'force-dynamic';
export const metadata = { title: 'Product preview', robots: { index: false, follow: false } };
export default async function ProductPreview({ params }: { params: Promise<{ id: string }> }) {
  await requireAdmin();
  const { id } = await params;
  const product = await db.product.findFirst({
    where: { id, deletedAt: null },
    include: { image: true },
  });
  if (!product) notFound();
  const body = product.body as { paragraphs?: unknown } | null;
  const paragraphs = Array.isArray(body?.paragraphs)
    ? body.paragraphs.filter((item): item is string => typeof item === 'string')
    : [];
  const specs = Array.isArray(product.specifications)
    ? product.specifications.filter(
        (item): item is { label: string; value: string } =>
          typeof item === 'object' &&
          item !== null &&
          'label' in item &&
          'value' in item &&
          typeof item.label === 'string' &&
          typeof item.value === 'string',
      )
    : [];
  const faqs = Array.isArray(product.faqs)
    ? product.faqs.filter(
        (item): item is { question: string; answer: string } =>
          typeof item === 'object' &&
          item !== null &&
          'question' in item &&
          'answer' in item &&
          typeof item.question === 'string' &&
          typeof item.answer === 'string',
      )
    : [];
  return (
    <main id="main" className="container">
      <p className="eyebrow">PRIVATE PREVIEW · {product.status}</p>
      <h1>{product.name}</h1>
      <p className="lead">{product.summary}</p>
      {product.image && (
        <Image
          src={product.image.storageKey}
          alt={product.imageAlt ?? ''}
          width={product.image.width}
          height={product.image.height}
          unoptimized
        />
      )}
      {paragraphs.map((paragraph, index) => (
        <p key={index}>{paragraph}</p>
      ))}
      {specs.length > 0 && (
        <dl>
          {specs.map((item) => (
            <div key={item.label}>
              <dt>{item.label}</dt>
              <dd>{item.value}</dd>
            </div>
          ))}
        </dl>
      )}
      {faqs.map((item) => (
        <section key={item.question}>
          <h2>{item.question}</h2>
          <p>{item.answer}</p>
        </section>
      ))}
    </main>
  );
}
