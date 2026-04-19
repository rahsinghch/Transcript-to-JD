# CLAUDE.md

## Project Overview

AI-powered Job Description generator. Takes a recruiter–hiring manager conversation transcript as input and produces a structured JD as an HTML preview and downloadable PDF.

## Tech Stack

- **Framework:** Next.js 14 App Router, TypeScript (no `src/` directory — `app/`, `components/`, `lib/` at root)
- **AI:** Anthropic SDK (`@anthropic-ai/sdk`) — model `claude-sonnet-4-6` (override via `CLAUDE_MODEL` env var)
- **Structured output:** Forced tool use (`tool_choice: {type: 'tool', name: 'create_job_description'}`) — guarantees valid JSON every time
- **Prompt caching:** `cache_control: {type: 'ephemeral'}` on system prompt
- **PDF:** `@react-pdf/renderer` — client-side via `pdf().toBlob()` (dynamic import with `ssr: false`)
- **File parsing:** `pdf-parse` (server-side, Node.js runtime), native `File.text()` (client-side for TXT)
- **Styling:** Tailwind CSS 3 with custom `brand` color palette defined in `tailwind.config.ts`

## Project Structure

```
app/
├── api/
│   ├── generate-jd/route.ts     # Claude call — forced tool use → JobDescription JSON
│   └── parse-file/route.ts      # Text extraction from .txt/.pdf (runtime = 'nodejs')
├── page.tsx                     # Main client component — all app state, retry countdown
├── layout.tsx
└── globals.css
components/
├── TranscriptInput.tsx          # Tabbed input: paste textarea + drag-and-drop upload
├── JDPreview.tsx                # HTML preview; dynamically imports PDFExport (ssr:false)
├── PDFDocument.tsx              # @react-pdf/renderer Document component (A4 layout)
└── PDFExport.tsx                # Client-only: pdf().toBlob() → browser download
lib/
├── types.ts                     # JobDescription, JobLocation, GenerateJDResponse interfaces
└── sampleTranscript.ts          # Sample transcript for "Load sample" button
```

## Key Conventions

- `JobDescription` in `lib/types.ts` is the central data contract — used by the API route, both components, and the PDF renderer
- The Claude tool schema (`JD_TOOL_SCHEMA`) lives in `app/api/generate-jd/route.ts` — update it alongside `JobDescription` when adding fields
- `PDFExport` must always be dynamically imported with `{ ssr: false }` — it uses browser APIs (`URL.createObjectURL`)
- `app/api/parse-file/route.ts` requires `export const runtime = 'nodejs'` — `pdf-parse` does not work in the Edge runtime
- Rate limit errors return `{ error, retryAfter }` with status 429; `page.tsx` drives a countdown timer UI

## Environment Variables

```
ANTHROPIC_API_KEY=   # Required
CLAUDE_MODEL=        # Optional — defaults to claude-sonnet-4-6
```

Set in `.env.local` for local dev. Add to Vercel environment for production.

## Claude API Usage

- Route: `app/api/generate-jd/route.ts`
- Pattern: forced tool use with `tool_choice: {type: 'tool', name: 'create_job_description'}`
- System prompt is cached with `cache_control: {type: 'ephemeral'}` — do not move dynamic content into the system prompt
- Response: find the `tool_use` block in `response.content`, cast `.input` as `JobDescription`

## Common Tasks

**Add a new JD field:**
1. Add to `JobDescription` in `lib/types.ts`
2. Add the property to `JD_TOOL_SCHEMA.input_schema.properties` in `app/api/generate-jd/route.ts`
3. If required, add to `JD_TOOL_SCHEMA.input_schema.required` array
4. Render it in `components/JDPreview.tsx`
5. Add it to `components/PDFDocument.tsx` for PDF output

**Change the AI model:**
Set `CLAUDE_MODEL` in `.env.local`, or edit the `model` fallback in `app/api/generate-jd/route.ts`.

**Add a new file type:**
Update `app/api/parse-file/route.ts` — add the extension to the allowed list and handle parsing. Also update `accept` on the hidden `<input>` in `components/TranscriptInput.tsx`.

## Deployment

Vercel. `vercel.json` sets `maxDuration: 60` for the `generate-jd` route. Set `ANTHROPIC_API_KEY` in Vercel project environment variables.
