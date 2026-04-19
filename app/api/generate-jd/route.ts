import Anthropic from '@anthropic-ai/sdk';
import { NextRequest, NextResponse } from 'next/server';
import { JobDescription } from '@/lib/types';

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

// Stable system prompt — cached via cache_control to reduce cost on repeated calls
const SYSTEM_PROMPT = `You are an expert HR consultant and talent acquisition specialist with extensive experience writing compelling, accurate job descriptions. Your task is to analyze transcripts of conversations between recruiters and hiring managers and extract comprehensive job description information.

GUIDELINES:
- Extract only information explicitly mentioned or clearly implied in the transcript
- Do NOT fabricate details that weren't discussed
- Write the aboutRole field as professional, compelling prose (2-3 paragraphs) that conveys the role's impact and appeal to top candidates
- Format responsibilities and qualifications as specific, action-oriented points
- If certain optional fields aren't mentioned, leave them out of your response
- Infer reasonable employment type (default to full-time if not specified)
- Infer reasonable location type from context clues

QUALITY STANDARDS:
- Job titles should be market-standard (e.g., "Senior Software Engineer" not "coding person")
- Responsibilities should start with action verbs (Build, Lead, Collaborate, Design, etc.)
- Qualifications should be specific and measurable where possible
- The aboutRole section should excite and inform potential candidates`;

const JD_TOOL_SCHEMA: Anthropic.Tool = {
  name: 'create_job_description',
  description: 'Creates a structured, comprehensive job description extracted from a recruiter-hiring manager conversation transcript.',
  input_schema: {
    type: 'object',
    properties: {
      jobTitle: {
        type: 'string',
        description: 'The standard market-facing job title (e.g., "Senior Software Engineer", "Product Manager")',
      },
      company: {
        type: 'string',
        description: 'Company name if mentioned in the transcript',
      },
      department: {
        type: 'string',
        description: 'Department or team name (e.g., "Platform Engineering", "Product")',
      },
      location: {
        type: 'object',
        properties: {
          type: {
            type: 'string',
            enum: ['remote', 'hybrid', 'onsite', 'flexible'],
            description: 'Work arrangement type',
          },
          city: {
            type: 'string',
            description: 'Primary city if onsite or hybrid',
          },
          country: {
            type: 'string',
            description: 'Country if relevant',
          },
        },
        required: ['type'],
        additionalProperties: false,
      },
      employmentType: {
        type: 'string',
        enum: ['full-time', 'part-time', 'contract', 'internship'],
        description: 'Type of employment arrangement',
      },
      aboutRole: {
        type: 'string',
        description: 'Professional, engaging 2-3 paragraph summary describing the role, its business impact, team context, and what makes it exciting for candidates',
      },
      keyResponsibilities: {
        type: 'array',
        items: { type: 'string' },
        description: 'Specific, action-oriented list of key responsibilities (aim for 5-8 items)',
      },
      requiredQualifications: {
        type: 'array',
        items: { type: 'string' },
        description: 'Must-have skills, experience levels, and qualifications (4-8 items)',
      },
      preferredQualifications: {
        type: 'array',
        items: { type: 'string' },
        description: 'Nice-to-have qualifications that would set a candidate apart (3-6 items)',
      },
      compensationRange: {
        type: 'string',
        description: 'Salary range, equity, and total compensation details if mentioned',
      },
      benefits: {
        type: 'array',
        items: { type: 'string' },
        description: 'Benefits and perks offered (health, PTO, learning budget, etc.)',
      },
      interviewProcess: {
        type: 'array',
        items: { type: 'string' },
        description: 'Ordered steps in the interview process if discussed',
      },
      reportingTo: {
        type: 'string',
        description: 'Role title or name of who this position reports to',
      },
      teamSize: {
        type: 'string',
        description: 'Team size and composition description if mentioned',
      },
      startDate: {
        type: 'string',
        description: 'Expected start date or timeline if mentioned',
      },
    },
    required: [
      'jobTitle',
      'location',
      'employmentType',
      'aboutRole',
      'keyResponsibilities',
      'requiredQualifications',
      'preferredQualifications',
      'benefits',
      'interviewProcess',
    ],
    additionalProperties: false,
  },
};

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { transcript } = body as { transcript: string };

    if (!transcript || typeof transcript !== 'string') {
      return NextResponse.json({ error: 'Transcript is required' }, { status: 400 });
    }

    const trimmed = transcript.trim();
    if (trimmed.length < 50) {
      return NextResponse.json(
        { error: 'Transcript is too short. Please provide a more detailed conversation.' },
        { status: 400 }
      );
    }

    const response = await client.messages.create({
      model: process.env.CLAUDE_MODEL ?? 'claude-sonnet-4-6',
      max_tokens: 4096,
      // Cache the stable system prompt — saves cost on repeated generations
      system: [
        {
          type: 'text',
          text: SYSTEM_PROMPT,
          cache_control: { type: 'ephemeral' },
        },
      ],
      // Force Claude to use the structured tool — guarantees valid JSON output
      tools: [JD_TOOL_SCHEMA],
      tool_choice: { type: 'tool', name: 'create_job_description' },
      messages: [
        {
          role: 'user',
          content: `Please analyze the following recruiter-hiring manager conversation transcript and create a comprehensive job description from it:\n\n---\n${trimmed}\n---`,
        },
      ],
    });

    const toolUseBlock = response.content.find(b => b.type === 'tool_use');
    if (!toolUseBlock || toolUseBlock.type !== 'tool_use') {
      return NextResponse.json({ error: 'Failed to generate job description' }, { status: 500 });
    }

    const jd = toolUseBlock.input as JobDescription;

    return NextResponse.json({
      jd,
      usage: {
        input_tokens: response.usage.input_tokens,
        output_tokens: response.usage.output_tokens,
        cache_creation_input_tokens: response.usage.cache_creation_input_tokens ?? 0,
        cache_read_input_tokens: response.usage.cache_read_input_tokens ?? 0,
      },
    });
  } catch (error) {
    console.error('JD generation error:', error);

    if (error instanceof Anthropic.AuthenticationError) {
      return NextResponse.json(
        { error: 'API authentication failed. Please check your ANTHROPIC_API_KEY.' },
        { status: 401 }
      );
    }
    if (error instanceof Anthropic.RateLimitError) {
      const retryAfter = error.headers?.get('retry-after');
      const waitSeconds = retryAfter ? parseInt(retryAfter, 10) : null;
      const message = waitSeconds
        ? `Rate limit exceeded. Please wait ${waitSeconds} seconds and try again.`
        : 'Rate limit exceeded. Please wait a moment and try again.';
      return NextResponse.json({ error: message, retryAfter: waitSeconds }, { status: 429 });
    }
    if (error instanceof Anthropic.BadRequestError) {
      return NextResponse.json(
        { error: 'Invalid request. Please check your transcript and try again.' },
        { status: 400 }
      );
    }

    return NextResponse.json({ error: 'An unexpected error occurred. Please try again.' }, { status: 500 });
  }
}
