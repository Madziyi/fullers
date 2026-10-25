import Link from 'next/link';
import { requireUser } from '@/lib/auth';
import { db } from '@/lib/db';
import { createArticle } from './actions';
export default async function ArticlesPage() {
  const user = await requireUser();
  const posts = await db.post.findMany({
    where: { deletedAt: null, ...(user.role === 'ADMIN' ? {} : { authorId: user.id }) },
    orderBy: { updatedAt: 'desc' },
    select: {
      id: true,
      title: true,
      status: true,
      updatedAt: true,
      author: { select: { name: true } },
    },
  });
  async function create() {
    'use server';
    const id = await createArticle();
    const { redirect } = await import('next/navigation');
    redirect(`/admin/posts/${id}`);
  }
  return (
    <>
      <div className="admin-title article-list-title">
        <div>
          <p className="eyebrow">CONTENT STUDIO</p>
          <h1>Articles</h1>
          <p>Write useful guidance, save a draft and preview the real page.</p>
        </div>
        <form action={create}>
          <button className="button">New article +</button>
        </form>
      </div>
      <div className="admin-table-wrap">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Article</th>
              <th>Status</th>
              <th>Author</th>
              <th>Last saved</th>
            </tr>
          </thead>
          <tbody>
            {posts.map((post) => (
              <tr key={post.id}>
                <td>
                  <Link href={`/admin/posts/${post.id}`} className="text-link">
                    {post.title || 'Untitled article'}
                  </Link>
                </td>
                <td>{post.status === 'PUBLISHED' ? 'Published' : 'Draft'}</td>
                <td>{post.author.name}</td>
                <td>{post.updatedAt.toLocaleDateString('en-ZW')}</td>
              </tr>
            ))}
            {posts.length === 0 && (
              <tr>
                <td colSpan={4}>
                  No articles yet. Start with a real topic your customers ask about.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </>
  );
}
