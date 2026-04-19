'use client';

import dynamic from 'next/dynamic';
import { JobDescription } from '@/lib/types';

// Avoid SSR for the PDF export button (uses browser APIs)
const PDFExport = dynamic(
  () => import('./PDFExport').then(m => m.PDFExport),
  { ssr: false, loading: () => <div className="h-10 w-36 bg-brand-100 animate-pulse rounded-lg" /> }
);

const LOCATION_LABELS: Record<string, string> = {
  remote: 'Remote',
  hybrid: 'Hybrid',
  onsite: 'On-site',
  flexible: 'Flexible',
};

const EMPLOYMENT_LABELS: Record<string, string> = {
  'full-time': 'Full-time',
  'part-time': 'Part-time',
  contract: 'Contract',
  internship: 'Internship',
};

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mb-8">
      <h3 className="text-xs font-bold text-brand-600 uppercase tracking-widest mb-3 pb-2 border-b border-brand-100">
        {title}
      </h3>
      {children}
    </section>
  );
}

function BulletList({ items }: { items: string[] }) {
  return (
    <ul className="space-y-2">
      {items.map((item, i) => (
        <li key={i} className="flex gap-3 text-gray-700 text-sm leading-relaxed">
          <span className="text-brand-500 font-bold mt-0.5 shrink-0">•</span>
          <span>{item}</span>
        </li>
      ))}
    </ul>
  );
}

function NumberedList({ items }: { items: string[] }) {
  return (
    <ol className="space-y-2">
      {items.map((item, i) => (
        <li key={i} className="flex gap-3 text-gray-700 text-sm leading-relaxed">
          <span className="text-brand-600 font-bold shrink-0 w-5">{i + 1}.</span>
          <span>{item}</span>
        </li>
      ))}
    </ol>
  );
}

function Badge({ children, color = 'brand' }: { children: React.ReactNode; color?: string }) {
  const colors: Record<string, string> = {
    brand: 'bg-brand-50 text-brand-700 ring-brand-200',
    green: 'bg-green-50 text-green-700 ring-green-200',
    orange: 'bg-orange-50 text-orange-700 ring-orange-200',
    gray: 'bg-gray-100 text-gray-700 ring-gray-200',
  };
  return (
    <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ring-1 ${colors[color] ?? colors.brand}`}>
      {children}
    </span>
  );
}

export function JDPreview({ jd, usage }: { jd: JobDescription; usage?: { cache_read_input_tokens?: number } }) {
  const locationDisplay = [
    LOCATION_LABELS[jd.location.type],
    jd.location.city,
    jd.location.country,
  ].filter(Boolean).join(', ');

  return (
    <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-br from-brand-700 to-brand-500 px-8 py-8">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div className="flex-1 min-w-0">
            <h2 className="text-2xl font-bold text-white mb-1 leading-tight">{jd.jobTitle}</h2>
            {(jd.company || jd.department) && (
              <p className="text-brand-100 text-sm">
                {[jd.company, jd.department].filter(Boolean).join(' · ')}
              </p>
            )}
          </div>
          <PDFExport jd={jd} />
        </div>
        <div className="flex flex-wrap gap-2 mt-4">
          <Badge color="brand">{locationDisplay}</Badge>
          <Badge color="brand">{EMPLOYMENT_LABELS[jd.employmentType]}</Badge>
          {jd.startDate && <Badge color="brand">Starts: {jd.startDate}</Badge>}
        </div>
      </div>

      <div className="px-8 py-8">
        {/* Quick Info */}
        {(jd.reportingTo || jd.teamSize || jd.compensationRange) && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8 p-4 bg-gray-50 rounded-xl border border-gray-100">
            {jd.reportingTo && (
              <div>
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">Reports To</p>
                <p className="text-sm font-semibold text-gray-800">{jd.reportingTo}</p>
              </div>
            )}
            {jd.teamSize && (
              <div>
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">Team Size</p>
                <p className="text-sm font-semibold text-gray-800">{jd.teamSize}</p>
              </div>
            )}
            {jd.compensationRange && (
              <div>
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">Compensation</p>
                <p className="text-sm font-semibold text-green-700">{jd.compensationRange}</p>
              </div>
            )}
          </div>
        )}

        {/* About the Role */}
        <Section title="About the Role">
          <div className="text-sm text-gray-700 leading-relaxed space-y-3">
            {jd.aboutRole.split('\n').filter(p => p.trim()).map((para, i) => (
              <p key={i}>{para}</p>
            ))}
          </div>
        </Section>

        {/* Key Responsibilities */}
        <Section title="Key Responsibilities">
          <BulletList items={jd.keyResponsibilities} />
        </Section>

        {/* Qualifications */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
          <Section title="Required Qualifications">
            <BulletList items={jd.requiredQualifications} />
          </Section>
          {jd.preferredQualifications.length > 0 && (
            <Section title="Preferred Qualifications">
              <BulletList items={jd.preferredQualifications} />
            </Section>
          )}
        </div>

        {/* Benefits */}
        {jd.benefits.length > 0 && (
          <Section title="Benefits & Perks">
            <BulletList items={jd.benefits} />
          </Section>
        )}

        {/* Interview Process */}
        {jd.interviewProcess.length > 0 && (
          <Section title="Interview Process">
            <NumberedList items={jd.interviewProcess} />
          </Section>
        )}

        {/* Cache indicator */}
        {(usage?.cache_read_input_tokens ?? 0) > 0 && (
          <div className="mt-4 text-xs text-gray-400 text-right">
            ⚡ Prompt cached · {usage!.cache_read_input_tokens!.toLocaleString()} tokens served from cache
          </div>
        )}
      </div>
    </div>
  );
}
