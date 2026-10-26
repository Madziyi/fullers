import type { TextSection } from '@/lib/pages-projects';
export function StructuredPageBody({
  title,
  sections,
}: {
  title: string;
  sections: TextSection[];
}) {
  return (
    <main id="main" className="container blog-index">
      <p className="eyebrow">FULLERS AGGREGATE</p>
      <h1>{title}</h1>
      {sections.map((section, index) => (
        <section key={`${index}-${section.heading}`}>
          <h2>{section.heading}</h2>
          <p className="lead">{section.body}</p>
        </section>
      ))}
    </main>
  );
}
export function StructuredPageSection({
  title,
  sections,
}: {
  title: string;
  sections: TextSection[];
}) {
  return (
    <section className="section">
      <div className="container">
        <p className="eyebrow">MORE FROM FULLERS</p>
        <h2>{title}</h2>
        {sections.map((section, index) => (
          <article key={`${index}-${section.heading}`}>
            <h3>{section.heading}</h3>
            <p>{section.body}</p>
          </article>
        ))}
      </div>
    </section>
  );
}
