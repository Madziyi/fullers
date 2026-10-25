import Link from 'next/link';
import Image from 'next/image';
import type { ArticleSnapshot } from '@/lib/articles';
export function ArticleView({ article }: { article: ArticleSnapshot }) {
  return (
    <article className="container blog-article">
      <nav className="breadcrumbs" aria-label="Breadcrumb">
        <Link href="/">Home</Link>
        <span>/</span>
        <Link href="/blog">Blog</Link>
        <span>/</span>
        <span>{article.title}</span>
      </nav>
      <header>
        <p className="eyebrow">{article.categoryName ?? 'FROM FULLERS'}</p>
        <h1>{article.title}</h1>
        <p className="lead">{article.excerpt}</p>
        <p className="article-byline">
          By {article.authorName} ·{' '}
          <time dateTime={article.publishedAt}>
            {new Date(article.publishedAt).toLocaleDateString('en-ZW', {
              year: 'numeric',
              month: 'long',
              day: 'numeric',
              timeZone: 'Africa/Harare',
            })}
          </time>
        </p>
        {article.tagNames.length > 0 && (
          <p className="article-tags">Topics: {article.tagNames.join(', ')}</p>
        )}
      </header>
      {article.coverSrc && (
        <figure className="blog-cover">
          <Image
            src={article.coverSrc}
            alt={article.coverAlt}
            width={1200}
            height={700}
            unoptimized
          />
          <figcaption>{article.coverAlt}</figcaption>
        </figure>
      )}
      <div className="article-content">
        {article.body.blocks.map((block, index) =>
          block.type === 'paragraph' ? (
            <p key={index}>{block.text}</p>
          ) : block.type === 'heading2' ? (
            <h2 key={index}>{block.text}</h2>
          ) : block.type === 'heading3' ? (
            <h3 key={index}>{block.text}</h3>
          ) : block.type === 'quote' ? (
            <blockquote key={index}>{block.text}</blockquote>
          ) : block.type === 'list' ? (
            <ul key={index}>
              {block.items.map((item, i) => (
                <li key={i}>{item}</li>
              ))}
            </ul>
          ) : block.type === 'link' ? (
            <p key={index}>
              {block.href.startsWith('/products/') &&
              !article.productSlugs.includes(block.href.slice('/products/'.length)) ? (
                block.text
              ) : (
                <a href={block.href} rel={block.href.startsWith('/') ? '' : 'noopener noreferrer'}>
                  {block.text}
                </a>
              )}
            </p>
          ) : block.type === 'image' ? (
            <figure key={index}>
              <Image src={block.src} alt={block.alt} width={1000} height={650} unoptimized />
              <figcaption>{block.caption}</figcaption>
            </figure>
          ) : null,
        )}
      </div>
      {article.productSlugs.length > 0 && (
        <section className="article-products">
          <h2>Related Fullers products</h2>
          <ul>
            {article.productSlugs.map((slug) => (
              <li key={slug}>
                <Link href={`/products/${slug}`}>{slug.replaceAll('-', ' ')}</Link>
              </li>
            ))}
          </ul>
        </section>
      )}
    </article>
  );
}
