# Transcript to JD Generator

An AI-powered web application that converts recruiter–hiring manager conversation transcripts into professionally formatted Job Descriptions, with one-click PDF export.

## What It Does

Paste or upload a transcript of a recruiter/hiring-manager conversation and the app uses Claude AI to extract and structure a complete job description — including responsibilities, qualifications, skills, compensation, and more — displayed as an interactive preview and downloadable as a PDF.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 14 (App Router, TypeScript) |
| AI | Anthropic Claude (`claude-sonnet-4-6`) via `@anthropic-ai/sdk` |
| Structured Output | Forced tool use (`tool_choice: {type: 'tool'}`) for guaranteed JSON |
| PDF Generation | `@react-pdf/renderer` (client-side, dynamic import) |
| File Parsing | `pdf-parse` (server-side), File API (client-side for TXT) |
| Styling | Tailwind CSS 3 with custom `brand` color palette |
| Deployment | Vercel |

---

## Project Structure

```
app/
├── api/
│   ├── generate-jd/route.ts     # Claude AI — transcript → structured JD JSON (forced tool use)
│   └── parse-file/route.ts      # Extract text from .txt / .pdf uploads (Node.js runtime)
├── page.tsx                     # Main client component — state, error handling, retry countdown
├── layout.tsx
└── globals.css
components/
├── TranscriptInput.tsx          # Tabbed input — paste textarea + drag-and-drop file upload
├── JDPreview.tsx                # Formatted HTML preview of the generated JD
├── PDFDocument.tsx              # @react-pdf/renderer document component
└── PDFExport.tsx                # Client-side PDF blob generation + download trigger
lib/
├── types.ts                     # JobDescription interface, GenerateJDResponse type
└── sampleTranscript.ts          # Sample recruiter/HM conversation for testing
```

---

## Architecture & Data Flow

```
User Input (paste / drag-drop / file upload)
            │
            ▼
  TranscriptInput component
  - Validates 50+ characters
  - .txt → client-side File.text()
  - .pdf → POST /api/parse-file → pdf-parse (server)
            │
            ▼
  POST /api/generate-jd
  - Sends transcript to Claude API
  - Forced tool use guarantees structured JSON output
  - Prompt caching on system prompt (cache_control: ephemeral)
  - Returns: JobDescription object + token usage
            │
            ▼
  JDPreview component
  - Renders formatted HTML preview
  - Shows cache indicator if prompt cache was hit
            │
            ▼ (on "Download PDF" click)
  PDFExport component (dynamic import, ssr: false)
  - pdf().toBlob() via @react-pdf/renderer
  - Creates object URL → triggers browser download
  - Filename: {jobTitle}-{company}-jd.pdf
```

---

## API Routes

### `POST /api/generate-jd`

Analyzes a transcript with Claude using forced tool use and returns a structured job description.

**Request**
```json
{ "transcript": "string (min 50 chars)" }
```

**Response**
```json
{
  "jd": {
    "jobTitle": "string",
    "company": "string",
    "department": "string",
    "location": { "city": "string", "state": "string", "country": "string", "remote": boolean },
    "employmentType": "string",
    "experienceLevel": "string",
    "salaryRange": "string (optional)",
    "aboutRole": "string",
    "responsibilities": ["string"],
    "requiredQualifications": ["string"],
    "preferredQualifications": ["string"],
    "technicalSkills": ["string"],
    "softSkills": ["string"],
    "benefits": ["string"],
    "interviewProcess": ["string"],
    "reportingTo": "string (optional)",
    "teamSize": "string (optional)"
  },
  "usage": {
    "input_tokens": number,
    "output_tokens": number,
    "cache_read_input_tokens": number
  }
}
```

**Error responses:**
- `400` — transcript missing or too short
- `429` — rate limit exceeded (includes `retryAfter` seconds)
- `500` — Claude API or parsing error

---

### `POST /api/parse-file`

Extracts plain text from an uploaded file. Uses `export const runtime = 'nodejs'` for `pdf-parse` compatibility.

**Request:** `multipart/form-data` with `file` field

**Supported types:** `.txt` · `.pdf`

**Response**
```json
{ "text": "string" }
```

**Errors:** `400` unsupported type · `422` scanned/image PDF · `500` parse error

---

## Key Components

### `TranscriptInput.tsx`
Tabbed input component with two modes:
- **Paste** — textarea with "Load sample" shortcut
- **Upload** — drag-and-drop zone + file browser (`accept=".txt,.pdf"`)

After upload, transcript is populated into the textarea and the view switches to the Paste tab with a success chip.

### `JDPreview.tsx`
Renders the `JobDescription` as a formatted HTML page. Dynamically imports `PDFExport` with `{ ssr: false }` to avoid SSR conflicts with browser PDF APIs. Shows a cache badge when `cache_read_input_tokens > 0`.

### `PDFDocument.tsx`
`@react-pdf/renderer` document — A4 layout with branded header, info grid, section titles, bullet lists, numbered interview steps, and a fixed footer with page numbers.

### `PDFExport.tsx`
Client-only component (`'use client'`) that calls `pdf().toBlob()`, creates an object URL, and triggers a programmatic download.

---

## Getting Started

### Prerequisites
- Node.js 18+
- Anthropic API key — get one at [console.anthropic.com](https://console.anthropic.com)

### Installation

```bash
git clone https://github.com/rahsinghch/Transcript-to-JD.git
cd Transcript-to-JD
npm install
```

### Environment

Copy `.env.example` to `.env.local` and fill in your key:

```bash
cp .env.example .env.local
```

```env
ANTHROPIC_API_KEY=your_anthropic_api_key_here

# Optional: override the model (default: claude-sonnet-4-6)
# CLAUDE_MODEL=claude-opus-4-7
```

### Run

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

---

## Deployment (Vercel)

1. Push to GitHub
2. Import the repo at [vercel.com](https://vercel.com)
3. Add `ANTHROPIC_API_KEY` as an environment variable
4. Deploy — `vercel.json` sets a 60s `maxDuration` for the generate-jd route

---

## Input Tips

For best results, include in the transcript:
- Full recruiter + hiring manager dialogue
- Specific skills and years of experience required
- Compensation, benefits, and team structure
- Interview process details
