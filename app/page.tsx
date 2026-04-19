'use client';

import { useState, useEffect, useRef } from 'react';
import { TranscriptInput } from '@/components/TranscriptInput';
import { JDPreview } from '@/components/JDPreview';
import { JobDescription, GenerateJDResponse } from '@/lib/types';

export default function Home() {
  const [isLoading, setIsLoading] = useState(false);
  const [jd, setJd] = useState<JobDescription | null>(null);
  const [usage, setUsage] = useState<GenerateJDResponse['usage'] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [retryCountdown, setRetryCountdown] = useState<number | null>(null);
  const countdownRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    return () => { if (countdownRef.current) clearInterval(countdownRef.current); };
  }, []);

  const startCountdown = (seconds: number) => {
    setRetryCountdown(seconds);
    countdownRef.current = setInterval(() => {
      setRetryCountdown(prev => {
        if (prev === null || prev <= 1) {
          clearInterval(countdownRef.current!);
          return null;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const handleGenerate = async (transcript: string) => {
    setIsLoading(true);
    setError(null);
    setJd(null);
    setRetryCountdown(null);
    if (countdownRef.current) clearInterval(countdownRef.current);

    try {
      const res = await fetch('/api/generate-jd', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ transcript }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? 'Something went wrong. Please try again.');
        if (res.status === 429 && data.retryAfter) {
          startCountdown(data.retryAfter);
        }
        return;
      }

      setJd((data as GenerateJDResponse).jd);
      setUsage((data as GenerateJDResponse).usage);
    } catch {
      setError('Network error. Please check your connection and try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-50 via-brand-50/30 to-slate-50">
      {/* Nav */}
      <nav className="sticky top-0 z-10 bg-white/80 backdrop-blur-md border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-14 flex items-center gap-3">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 bg-gradient-to-br from-brand-600 to-brand-400 rounded-lg flex items-center justify-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <span className="font-bold text-gray-900 text-sm">JD Generator</span>
          </div>
          <span className="text-gray-300 text-sm">·</span>
          <span className="text-gray-500 text-xs">Powered by Claude AI</span>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        {/* Hero */}
        <div className="text-center mb-10">
          <h1 className="text-4xl sm:text-5xl font-bold text-gray-900 mb-4 leading-tight">
            Turn Conversations Into{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-600 to-brand-400">
              Job Descriptions
            </span>
          </h1>
          <p className="text-lg text-gray-500 max-w-2xl mx-auto">
            Paste a recruiter–hiring manager transcript and get a polished, structured job description ready to export as PDF — in seconds.
          </p>
        </div>

        {/* How it works */}
        <div className="flex items-center justify-center gap-6 mb-10 flex-wrap">
          {[
            { icon: '💬', label: 'Paste transcript' },
            { icon: '→', label: '', isArrow: true },
            { icon: '🤖', label: 'Claude extracts JD' },
            { icon: '→', label: '', isArrow: true },
            { icon: '📄', label: 'Download as PDF' },
          ].map((step, i) =>
            step.isArrow ? (
              <span key={i} className="text-gray-300 text-xl font-light hidden sm:block">→</span>
            ) : (
              <div key={i} className="flex items-center gap-2 text-sm text-gray-600">
                <span className="text-lg">{step.icon}</span>
                <span className="font-medium">{step.label}</span>
              </div>
            )
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
          {/* Left: Input */}
          <div className="lg:sticky lg:top-20">
            <TranscriptInput onGenerate={handleGenerate} isLoading={isLoading} />

            {/* Loading state */}
            {isLoading && (
              <div className="mt-4 bg-brand-50 border border-brand-100 rounded-xl p-4 flex items-center gap-3">
                <div className="flex-shrink-0 w-8 h-8 bg-brand-100 rounded-full flex items-center justify-center">
                  <svg className="animate-spin h-4 w-4 text-brand-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                </div>
                <div>
                  <p className="text-sm font-semibold text-brand-700">Analyzing transcript…</p>
                  <p className="text-xs text-brand-500">Claude is reading the conversation and building the JD</p>
                </div>
              </div>
            )}

            {/* Error */}
            {error && (
              <div className="mt-4 bg-red-50 border border-red-100 rounded-xl p-4 flex items-start gap-3">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-red-500 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <div className="flex-1">
                  <p className="text-sm font-semibold text-red-700">Error</p>
                  <p className="text-sm text-red-600 mt-0.5">{error}</p>
                  {retryCountdown !== null && (
                    <div className="mt-2 flex items-center gap-2">
                      <div className="h-1.5 flex-1 bg-red-100 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-red-400 rounded-full transition-all duration-1000"
                          style={{ width: `${(retryCountdown / 60) * 100}%` }}
                        />
                      </div>
                      <span className="text-xs font-mono text-red-500 shrink-0">
                        {retryCountdown}s
                      </span>
                    </div>
                  )}
                  {retryCountdown === null && error.includes('Rate limit') && (
                    <p className="text-xs text-red-500 mt-1">You can try again now.</p>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Right: Output */}
          <div>
            {jd ? (
              <JDPreview jd={jd} usage={usage ?? undefined} />
            ) : (
              <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-12 flex flex-col items-center justify-center text-center min-h-80">
                <div className="w-16 h-16 bg-brand-50 rounded-2xl flex items-center justify-center mb-4">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-brand-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <h3 className="text-gray-500 font-semibold mb-1">Job description will appear here</h3>
                <p className="text-sm text-gray-400">
                  Paste a transcript on the left and click{' '}
                  <span className="font-medium text-brand-500">Generate JD</span> to get started.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
