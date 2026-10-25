import { PrismaClient } from '@prisma/client';
import assert from 'node:assert/strict';
import { publicWhere } from '../src/lib/catalogue';
const db = new PrismaClient();
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
