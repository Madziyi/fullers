import Link from 'next/link';
import { notFound } from 'next/navigation';
import { requireUser } from '@/lib/auth';
import { db } from '@/lib/db';
import { updateEnquiryStatus } from '../actions';
export default async function EnquiryDetail({ params }: { params: Promise<{ id: string }> }) {
  const user = await requireUser();
  if (user.role !== 'ADMIN') notFound();
  const { id } = await params;
  if (!/^[a-zA-Z0-9_]{1,80}$/.test(id)) notFound();
  const enquiry = await db.inquiry.findFirst({ where: { id, deletedAt: null } });
  if (!enquiry) notFound();
  return (
    <>
      <div className="admin-title">
        <p className="eyebrow">PRIVATE / ENQUIRY</p>
        <h1>A conversation with {enquiry.name}.</h1>
        <p>
          Received {enquiry.createdAt.toISOString().replace('T', ' ').slice(0, 16)} UTC ·{' '}
          {enquiry.status.toLowerCase().replaceAll('_', ' ')}
        </p>
      </div>
      <div className="admin-panel enquiry-reading">
        <h2>Contact details</h2>
        <dl>
          {enquiry.email && (
            <div>
              <dt>Email</dt>
              <dd>
                <a href={`mailto:${enquiry.email}`}>{enquiry.email}</a>
              </dd>
            </div>
          )}
          {enquiry.phone && (
            <div>
              <dt>Phone</dt>
              <dd>
                <a href={`tel:${enquiry.phone.replace(/[ ()-]/g, '')}`}>{enquiry.phone}</a>
              </dd>
            </div>
          )}
          <div>
            <dt>Product</dt>
            <dd>{enquiry.productSlug?.replaceAll('-', ' ') || 'General enquiry'}</dd>
          </div>
          <div>
            <dt>Permission to respond</dt>
            <dd>Recorded {enquiry.consentAt.toISOString().replace('T', ' ').slice(0, 16)} UTC</dd>
          </div>
        </dl>
        <h2>Project message</h2>
        <p className="enquiry-message">{enquiry.message}</p>
        <form action={updateEnquiryStatus} className="admin-form">
          <input type="hidden" name="id" value={enquiry.id} />
          <label htmlFor="status">Enquiry status</label>
          <select id="status" name="status" defaultValue={enquiry.status}>
            <option value="NEW">New</option>
            <option value="IN_PROGRESS">In progress</option>
            <option value="CLOSED">Closed</option>
            <option value="SPAM">Spam</option>
          </select>
          <button className="button button-primary" type="submit">
            Save status
          </button>
        </form>
        <Link className="text-link" href="/admin/enquiries">
          ← Back to enquiries
        </Link>
      </div>
    </>
  );
}
