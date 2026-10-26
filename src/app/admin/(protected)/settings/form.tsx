'use client';
import { useActionState, useState } from 'react';
import { saveSettings } from './actions';
import type { SettingsInput } from '@/lib/validation';
export function SettingsForm({ settings }: { settings: SettingsInput }) {
  const [result, action, pending] = useActionState(saveSettings, { ok: false, message: '' });
  const [links, setLinks] = useState(settings.socialLinks ?? []);
  function field(name: Exclude<keyof SettingsInput, 'socialLinks'>, label: string, maxLength = 80) {
    return (
      <div className="field">
        <label htmlFor={name}>{label}</label>
        <input id={name} name={name} defaultValue={settings[name]} required maxLength={maxLength} />
      </div>
    );
  }
  return (
    <form className="settings-form" action={action}>
      <fieldset>
        <legend>Business details</legend>
        {field('companyName', 'Company name', 120)}
        {field('phone', 'Phone / WhatsApp', 25)}
        {field('location', 'Location', 250)}
      </fieldset>
      <fieldset>
        <legend>Social links</legend>
        <p className="admin-notice">
          Add only verified Fullers profiles. These appear in the public footer.
        </p>
        <input type="hidden" name="socialLinks" value={JSON.stringify(links)} />
        {links.map((link, index) => (
          <div className="social-link-row" key={index}>
            <label>
              Profile name
              <input
                aria-label={`Social profile ${index + 1} name`}
                value={link.label}
                required
                maxLength={60}
                onChange={(e) =>
                  setLinks((items) =>
                    items.map((item, i) =>
                      i === index ? { ...item, label: e.target.value } : item,
                    ),
                  )
                }
              />
            </label>
            <label>
              Profile URL
              <input
                aria-label={`Social profile ${index + 1} URL`}
                type="url"
                value={link.url}
                required
                maxLength={500}
                placeholder="https://…"
                onChange={(e) =>
                  setLinks((items) =>
                    items.map((item, i) => (i === index ? { ...item, url: e.target.value } : item)),
                  )
                }
              />
            </label>
            <button
              type="button"
              className="button button-small button-outline"
              onClick={() => setLinks((items) => items.filter((_, i) => i !== index))}
            >
              Remove
            </button>
          </div>
        ))}
        <button
          type="button"
          className="button button-small button-outline"
          disabled={links.length >= 8}
          onClick={() => setLinks((items) => [...items, { label: '', url: '' }])}
        >
          Add social profile
        </button>
      </fieldset>
      <fieldset>
        <legend>Approved proof points</legend>
        <p className="admin-notice">
          Use claims approved by Fullers. Changes appear on the public homepage.
        </p>
        <div className="settings-pair">
          {field('experienceValue', 'Years of experience — value', 16)}
          {field('experienceLabel', 'Years of experience — label')}
        </div>
        <div className="settings-pair">
          {field('jobsValue', 'Jobs done — value', 16)}
          {field('jobsLabel', 'Jobs done — label')}
        </div>
        <div className="settings-pair">
          {field('satisfactionValue', 'Client satisfaction — value', 16)}
          {field('satisfactionLabel', 'Client satisfaction — label')}
        </div>
        {field('awardClaim', 'Award message')}
      </fieldset>
      <fieldset>
        <legend>Homepage search appearance</legend>
        {field('seoTitle', 'Search title', 100)}
        <div className="field">
          <label htmlFor="seoDescription">Search description</label>
          <textarea
            id="seoDescription"
            name="seoDescription"
            rows={4}
            minLength={20}
            maxLength={300}
            defaultValue={settings.seoDescription}
            required
          />
          <small>
            Describe what customers can find here. Search engines may show different text.
          </small>
        </div>
      </fieldset>
      {result.message && (
        <p role="status" className={result.ok ? 'form-success' : 'form-error'}>
          {result.message}
        </p>
      )}
      <button className="button" disabled={pending}>
        {pending ? 'Saving…' : 'Save site settings →'}
      </button>
    </form>
  );
}
