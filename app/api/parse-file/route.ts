import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    const ext = file.name.split('.').pop()?.toLowerCase();

    if (ext === 'txt') {
      const text = await file.text();
      if (!text.trim()) {
        return NextResponse.json({ error: 'The text file appears to be empty.' }, { status: 400 });
      }
      return NextResponse.json({ text: text.trim() });
    }

    if (ext === 'pdf') {
      const buffer = Buffer.from(await file.arrayBuffer());
      // Dynamic import avoids pdf-parse init side-effects at module load time
      const pdfParse = (await import('pdf-parse')).default;
      const data = await pdfParse(buffer);
      const text = data.text.trim();

      if (!text) {
        return NextResponse.json(
          { error: 'Could not extract text from this PDF. It may be a scanned image. Please copy and paste the transcript manually.' },
          { status: 422 }
        );
      }
      return NextResponse.json({ text });
    }

    return NextResponse.json(
      { error: 'Unsupported file type. Please upload a .txt or .pdf file.' },
      { status: 400 }
    );
  } catch (err) {
    console.error('File parse error:', err);
    return NextResponse.json(
      { error: 'Failed to parse the file. Please try again or paste the text manually.' },
      { status: 500 }
    );
  }
}
