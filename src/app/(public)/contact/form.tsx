'use client';
import Link from 'next/link';
import { useActionState, useState } from 'react';
import { sendEnquiry } from './actions';
import type { EnquiryValues } from '@/lib/enquiry-validation';
import { Arrow } from '@/components/icons';
export function EnquiryForm({
  products,
  token,
  selectedProduct,
}: {
  products: { slug: string; name: string }[];
  token: string;
  selectedProduct: string;
}) {
  const [result, action, pending] = useActionState(sendEnquiry, { ok: false, message: '' });
  const [values, setValues] = useState<EnquiryValues>({
    name: '',
    email: '',
    phone: '',
    message: '',
    productSlug: selectedProduct,
    consent: '',
  });
  function update(field: keyof EnquiryValues, value: string) {
    setValues((previous) => ({ ...previous, [field]: value }));
  }
  function input(
    name: 'name' | 'email' | 'phone',
    label: string,
    autoComplete: string,
    type = 'text',
    maxLength = 100,
  ) {
    return (
      <div className="field">
        <label htmlFor={name}>{label}</label>
        <input
          id={name}
          name={name}
          type={type}
          autoComplete={autoComplete}
          value={values[name]}
          onChange={(event) => update(name, event.target.value)}
          maxLength={maxLength}
          required={name === 'name'}
          aria-invalid={!!result.errors?.[name]}
          aria-describedby={result.errors?.[name] ? `${name}-error` : undefined}
        />
        {result.errors?.[name] && (
          <small className="field-error" id={`${name}-error`}>
            {result.errors[name]}
          </small>
        )}
      </div>
    );
  }
  if (result.ok)
    return (
      <div className="enquiry-success" role="status">
        <span className="eyebrow">A SOLID START</span>
        <h2>
          Thank you.
          <br />
          Your enquiry is with us.
        </h2>
        <p>{result.message}</p>
        <Link className="text-link" href="/products">
          Back to the product range <Arrow />
        </Link>
      </div>
    );
  return (
    <form className="enquiry-form" action={action} noValidate>
      <input type="hidden" name="formToken" value={token} />
      <div className="form-trap" aria-hidden="true">
        <label htmlFor="website">Leave this field empty</label>
        <input id="website" name="website" tabIndex={-1} autoComplete="off" />
      </div>
      {input('name', 'Your name', 'name')}
      <div className="settings-pair">
        {input('email', 'Email address', 'email', 'email', 254)}
        {input('phone', 'Phone number', 'tel', 'tel', 30)}
      </div>
      <p className="form-hint">
        Please include an email address or phone number so we can respond.
      </p>
      <div className="field">
        <label htmlFor="productSlug">
          Product of interest <span>(optional)</span>
        </label>
        <select
          id="productSlug"
          name="productSlug"
          value={values.productSlug}
          onChange={(event) => update('productSlug', event.target.value)}
        >
          <option value="">Let’s discuss / more than one product</option>
          {products.map((p) => (
            <option key={p.slug} value={p.slug}>
              {p.name}
            </option>
          ))}
        </select>
      </div>
      <div className="field">
        <label htmlFor="message">Tell us about your project</label>
        <textarea
          id="message"
          name="message"
          rows={6}
          maxLength={4000}
          value={values.message}
          onChange={(event) => update('message', event.target.value)}
          required
          aria-invalid={!!result.errors?.message}
          aria-describedby={result.errors?.message ? 'message-hint message-error' : 'message-hint'}
        />
        <small id="message-hint">
          Include quantities, site location, planned dates and any delivery requirements. Please
          don’t include payment or sensitive personal information.
        </small>
        {result.errors?.message && (
          <small className="field-error" id="message-error">
            {result.errors.message}
          </small>
        )}
      </div>
      <div className="consent-field">
        <input
          id="consent"
          name="consent"
          type="checkbox"
          value="yes"
          checked={values.consent === 'yes'}
          onChange={(event) => update('consent', event.target.checked ? 'yes' : '')}
          required
          aria-invalid={!!result.errors?.consent}
          aria-describedby={result.errors?.consent ? 'consent-error' : undefined}
        />
        <label htmlFor="consent">
          Fullers may use my contact details and message to respond to this enquiry.
        </label>
      </div>
      {result.errors?.consent && (
        <p className="field-error" id="consent-error">
          {result.errors.consent}
        </p>
      )}
      <p className="form-hint">
        Your details are stored privately for administrator review. Read{' '}
        <Link href="/contact/enquiry-notice">how this enquiry form uses your information</Link>.
      </p>
      {result.message && (
        <p role="alert" className="form-error">
          {result.message}
        </p>
      )}
      <button className="button" disabled={pending}>
        {pending ? 'Saving your enquiry…' : 'Send your enquiry'}
        <Arrow diagonal />
      </button>
      <p className="form-hint">
        A quotation, product availability and delivery arrangements are confirmed directly with our
        team.
      </p>
    </form>
  );
}
