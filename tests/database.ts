import { createPrismaClient } from '../src/lib/prisma-client';
import assert from 'node:assert/strict';
import { publicWhere } from '../src/lib/catalogue';
const db = createPrismaClient();
async function main() {
  assert.equal(await db.product.count({ where: publicWhere() }), 7);
  assert.equal(await db.project.count(), 0);
  assert.equal(await db.post.count(), 0);
  const rollback = new Error('expected test rollback');
  try {
    await db.$transaction(async (tx) => {
      const draft = await tx.product.create({
        data: {
          name: 'Private integration fixture',
          slug: 'private-integration-fixture',
          summary: 'Not public',
          specifications: [],
          status: 'DRAFT',
        },
      });
      assert.equal(await tx.product.count({ where: { ...publicWhere(), id: draft.id } }), 0);
      await tx.product.update({
        where: { id: draft.id },
        data: { status: 'SCHEDULED', publishAt: new Date('2099-01-01') },
      });
      assert.equal(await tx.product.count({ where: { ...publicWhere(), id: draft.id } }), 0);
      const user = await tx.user.findFirstOrThrow({ where: { role: 'ADMIN' } });
      await tx.siteSettings.update({
        where: { id: 'site' },
        data: { jobsValue: 'transaction-fixture' },
      });
      await tx.auditLog.create({
        data: { actorId: user.id, action: 'TEST', entity: 'SiteSettings', entityId: 'site' },
      });
      throw rollback;
    });
  } catch (error) {
    if (error !== rollback) throw error;
  }
  assert.equal(
    (await db.siteSettings.findUniqueOrThrow({ where: { id: 'site' } })).jobsValue,
    '700+',
  );
  assert.equal(await db.auditLog.count({ where: { action: 'TEST' } }), 0);

  const articleAuthor = await db.user.findFirstOrThrow({ where: { role: 'ADMIN' } });
  const articleA = await db.post.create({
    data: {
      title: 'Article A fixture',
      slug: 'article-a-fixture',
      excerpt: '',
      body: {},
      authorId: articleAuthor.id,
    },
  });
  const articleB = await db.post.create({
    data: {
      title: 'Article B fixture',
      slug: 'article-b-fixture',
      excerpt: '',
      body: {},
      authorId: articleAuthor.id,
    },
  });
  const revisionA1 = await db.postRevision.create({
    data: {
      postId: articleA.id,
      actorId: articleAuthor.id,
      version: 1,
      snapshot: { title: 'Stable snapshot' },
    },
  });
  const revisionA2 = await db.postRevision.create({
    data: {
      postId: articleA.id,
      actorId: articleAuthor.id,
      version: 2,
      snapshot: { title: 'Tentative snapshot' },
    },
  });
  await db.post.update({
    where: { id: articleA.id },
    data: { publishedRevisionId: revisionA1.id },
  });
  await assert.rejects(
    db.post.update({ where: { id: articleB.id }, data: { publishedRevisionId: revisionA1.id } }),
    /foreign key|constraint/i,
  );
  const rollbackPublication = new Error('expected publication rollback');
  try {
    await db.$transaction(async (tx) => {
      const changed = await tx.post.updateMany({
        where: { id: articleA.id, version: 1, publishedRevisionId: revisionA1.id },
        data: { publishedRevisionId: revisionA2.id, version: { increment: 1 } },
      });
      assert.equal(changed.count, 1);
      throw rollbackPublication;
    });
  } catch (error) {
    if (error !== rollbackPublication) throw error;
  }
  assert.equal(
    (await db.post.findUniqueOrThrow({ where: { id: articleA.id } })).publishedRevisionId,
    revisionA1.id,
  );
  await db.post.update({ where: { id: articleA.id }, data: { publishedRevisionId: null } });
  await db.postRevision.deleteMany({ where: { postId: { in: [articleA.id, articleB.id] } } });
  await db.post.deleteMany({ where: { id: { in: [articleA.id, articleB.id] } } });
  await assert.rejects(
    db.product.create({ data: { name: 'Duplicate', slug: 'bricks', summary: 'Should fail' } }),
  );
  await assert.rejects(
    db.product.create({
      data: {
        name: 'Missing date',
        slug: 'invalid-public-fixture',
        summary: 'Should fail',
        status: 'PUBLISHED',
      },
    }),
  );
  await assert.rejects(
    db.project.create({
      data: {
        title: 'Unapproved',
        slug: 'invalid-project-fixture',
        body: {},
        status: 'PUBLISHED',
        publishedAt: new Date(),
      },
    }),
  );
  console.log(
    'Database integration: seed, public visibility, transaction rollback, unique slug and publication constraints passed.',
  );
}
main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => db.$disconnect());
