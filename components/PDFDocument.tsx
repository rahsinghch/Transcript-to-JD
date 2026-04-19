'use client';

import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  Font,
} from '@react-pdf/renderer';
import { JobDescription } from '@/lib/types';

Font.register({
  family: 'Helvetica',
  fonts: [],
});

const BRAND_COLOR = '#2d3fcf';
const ACCENT_COLOR = '#4f6ef7';
const LIGHT_BG = '#f0f4ff';
const TEXT_DARK = '#111827';
const TEXT_MUTED = '#6b7280';
const BORDER_COLOR = '#e5e7eb';

const styles = StyleSheet.create({
  page: {
    fontFamily: 'Helvetica',
    fontSize: 10,
    color: TEXT_DARK,
    backgroundColor: '#ffffff',
    paddingTop: 0,
    paddingBottom: 40,
    paddingHorizontal: 0,
  },
  header: {
    backgroundColor: BRAND_COLOR,
    paddingHorizontal: 40,
    paddingVertical: 32,
    marginBottom: 0,
  },
  headerJobTitle: {
    fontSize: 22,
    fontFamily: 'Helvetica-Bold',
    color: '#ffffff',
    marginBottom: 6,
  },
  headerCompany: {
    fontSize: 13,
    color: '#c7d2fe',
    marginBottom: 12,
  },
  headerBadgeRow: {
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap',
  },
  badge: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 3,
  },
  badgeText: {
    color: '#ffffff',
    fontSize: 9,
    fontFamily: 'Helvetica-Bold',
    textTransform: 'uppercase',
  },
  body: {
    paddingHorizontal: 40,
    paddingTop: 24,
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 11,
    fontFamily: 'Helvetica-Bold',
    color: BRAND_COLOR,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 8,
    paddingBottom: 4,
    borderBottomWidth: 1.5,
    borderBottomColor: ACCENT_COLOR,
  },
  paragraph: {
    fontSize: 10,
    lineHeight: 1.6,
    color: TEXT_DARK,
    marginBottom: 6,
  },
  bulletRow: {
    flexDirection: 'row',
    marginBottom: 4,
    paddingLeft: 4,
  },
  bullet: {
    width: 14,
    fontSize: 10,
    color: ACCENT_COLOR,
    fontFamily: 'Helvetica-Bold',
  },
  bulletText: {
    flex: 1,
    fontSize: 10,
    lineHeight: 1.5,
    color: TEXT_DARK,
  },
  twoColumn: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 20,
  },
  column: {
    flex: 1,
  },
  infoBox: {
    backgroundColor: LIGHT_BG,
    borderRadius: 6,
    padding: 14,
    marginBottom: 20,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  infoItem: {
    minWidth: '45%',
  },
  infoLabel: {
    fontSize: 8,
    fontFamily: 'Helvetica-Bold',
    color: TEXT_MUTED,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  infoValue: {
    fontSize: 10,
    color: TEXT_DARK,
    fontFamily: 'Helvetica-Bold',
  },
  compensationBox: {
    backgroundColor: '#ecfdf5',
    borderLeftWidth: 3,
    borderLeftColor: '#10b981',
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginBottom: 20,
    borderRadius: 4,
  },
  compensationLabel: {
    fontSize: 8,
    fontFamily: 'Helvetica-Bold',
    color: '#065f46',
    textTransform: 'uppercase',
    marginBottom: 3,
  },
  compensationValue: {
    fontSize: 11,
    fontFamily: 'Helvetica-Bold',
    color: '#064e3b',
  },
  footer: {
    position: 'absolute',
    bottom: 20,
    left: 40,
    right: 40,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: BORDER_COLOR,
    paddingTop: 8,
  },
  footerText: {
    fontSize: 8,
    color: TEXT_MUTED,
  },
  divider: {
    borderBottomWidth: 1,
    borderBottomColor: BORDER_COLOR,
    marginBottom: 20,
  },
});

function formatLocationType(type: string): string {
  return type.charAt(0).toUpperCase() + type.slice(1);
}

function formatEmploymentType(type: string): string {
  return type.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join('-');
}

function formatLocationDisplay(location: JobDescription['location']): string {
  const parts = [formatLocationType(location.type)];
  if (location.city) parts.push(location.city);
  if (location.country) parts.push(location.country);
  return parts.join(' · ');
}

function BulletList({ items }: { items: string[] }) {
  return (
    <View>
      {items.map((item, i) => (
        <View key={i} style={styles.bulletRow}>
          <Text style={styles.bullet}>•</Text>
          <Text style={styles.bulletText}>{item}</Text>
        </View>
      ))}
    </View>
  );
}

export function JDDocument({ jd }: { jd: JobDescription }) {
  const locationDisplay = formatLocationDisplay(jd.location);
  const employmentDisplay = formatEmploymentType(jd.employmentType);

  return (
    <Document
      title={jd.jobTitle}
      author={jd.company ?? 'JD Generator'}
      creator="JD Generator powered by Claude"
    >
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerJobTitle}>{jd.jobTitle}</Text>
          {(jd.company || jd.department) && (
            <Text style={styles.headerCompany}>
              {[jd.company, jd.department].filter(Boolean).join(' · ')}
            </Text>
          )}
          <View style={styles.headerBadgeRow}>
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{locationDisplay}</Text>
            </View>
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{employmentDisplay}</Text>
            </View>
            {jd.startDate && (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>Start: {jd.startDate}</Text>
              </View>
            )}
          </View>
        </View>

        <View style={styles.body}>
          {/* Quick Info Box */}
          <View style={styles.infoBox}>
            {jd.reportingTo && (
              <View style={styles.infoItem}>
                <Text style={styles.infoLabel}>Reports To</Text>
                <Text style={styles.infoValue}>{jd.reportingTo}</Text>
              </View>
            )}
            {jd.teamSize && (
              <View style={styles.infoItem}>
                <Text style={styles.infoLabel}>Team Size</Text>
                <Text style={styles.infoValue}>{jd.teamSize}</Text>
              </View>
            )}
            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>Location</Text>
              <Text style={styles.infoValue}>{locationDisplay}</Text>
            </View>
            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>Employment Type</Text>
              <Text style={styles.infoValue}>{employmentDisplay}</Text>
            </View>
          </View>

          {/* Compensation */}
          {jd.compensationRange && (
            <View style={styles.compensationBox}>
              <Text style={styles.compensationLabel}>Compensation</Text>
              <Text style={styles.compensationValue}>{jd.compensationRange}</Text>
            </View>
          )}

          {/* About the Role */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>About the Role</Text>
            {jd.aboutRole.split('\n').filter(p => p.trim()).map((para, i) => (
              <Text key={i} style={styles.paragraph}>{para}</Text>
            ))}
          </View>

          {/* Key Responsibilities */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Key Responsibilities</Text>
            <BulletList items={jd.keyResponsibilities} />
          </View>

          {/* Qualifications */}
          <View style={styles.twoColumn}>
            <View style={styles.column}>
              <Text style={styles.sectionTitle}>Required Qualifications</Text>
              <BulletList items={jd.requiredQualifications} />
            </View>
            {jd.preferredQualifications.length > 0 && (
              <View style={styles.column}>
                <Text style={styles.sectionTitle}>Preferred Qualifications</Text>
                <BulletList items={jd.preferredQualifications} />
              </View>
            )}
          </View>

          {/* Benefits */}
          {jd.benefits.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Benefits & Perks</Text>
              <BulletList items={jd.benefits} />
            </View>
          )}

          {/* Interview Process */}
          {jd.interviewProcess.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Interview Process</Text>
              {jd.interviewProcess.map((step, i) => (
                <View key={i} style={styles.bulletRow}>
                  <Text style={[styles.bullet, { color: BRAND_COLOR }]}>{i + 1}.</Text>
                  <Text style={styles.bulletText}>{step}</Text>
                </View>
              ))}
            </View>
          )}
        </View>

        {/* Footer */}
        <View style={styles.footer} fixed>
          <Text style={styles.footerText}>
            {jd.company ? `${jd.company} · ` : ''}{jd.jobTitle}
          </Text>
          <Text
            style={styles.footerText}
            render={({ pageNumber, totalPages }) =>
              `Page ${pageNumber} of ${totalPages}`
            }
          />
        </View>
      </Page>
    </Document>
  );
}
