'use client';

import { useState, useRef, useCallback } from 'react';
import { SAMPLE_TRANSCRIPT } from '@/lib/sampleTranscript';

interface TranscriptInputProps {
  onGenerate: (transcript: string) => void;
  isLoading: boolean;
}

type Tab = 'paste' | 'upload';

export function TranscriptInput({ onGenerate, isLoading }: TranscriptInputProps) {
  const [transcript, setTranscript] = useState('');
  const [activeTab, setActiveTab] = useState<Tab>('paste');
  const [isDragging, setIsDragging] = useState(false);
  const [loadedFile, setLoadedFile] = useState<string | null>(null);
  const [isParsing, setIsParsing] = useState(false);
  const [fileError, setFileError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const charCount = transcript.trim().length;
  const isValid = charCount >= 50;

  const processFile = useCallback(async (file: File) => {
    const ext = file.name.split('.').pop()?.toLowerCase();
    if (ext !== 'txt' && ext !== 'pdf') {
      setFileError('Only .txt and .pdf files are supported.');
      return;
    }

    setIsParsing(true);
    setFileError(null);
    setLoadedFile(file.name);

    try {
      if (ext === 'txt') {
        // Read .txt entirely in the browser — no round trip needed
        const text = await file.text();
        if (!text.trim()) throw new Error('The text file appears to be empty.');
        setTranscript(text.trim());
        setActiveTab('paste');
        return;
      }

      // .pdf — send to server for parsing
      const formData = new FormData();
      formData.append('file', file);
      const res = await fetch('/api/parse-file', { method: 'POST', body: formData });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'Failed to parse PDF.');
      setTranscript(data.text);
      setActiveTab('paste');
    } catch (err) {
      setFileError(err instanceof Error ? err.message : 'Failed to read the file.');
      setLoadedFile(null);
    } finally {
      setIsParsing(false);
    }
  }, []);

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) processFile(file);
    e.target.value = '';
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    if (!e.currentTarget.contains(e.relatedTarget as Node)) {
      setIsDragging(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) processFile(file);
  };

  const clearAll = () => {
    setTranscript('');
    setLoadedFile(null);
    setFileError(null);
  };

  const switchTab = (tab: Tab) => {
    setActiveTab(tab);
    setFileError(null);
  };

  return (
    <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-lg font-bold text-gray-900">Add Transcript</h2>
          <p className="text-sm text-gray-500 mt-0.5">Paste or upload a recruiter–hiring manager conversation</p>
        </div>
        <button
          onClick={() => { setTranscript(SAMPLE_TRANSCRIPT); setLoadedFile(null); setActiveTab('paste'); }}
          className="text-xs font-semibold text-brand-600 hover:text-brand-700 bg-brand-50 hover:bg-brand-100 px-3 py-1.5 rounded-lg transition-colors"
        >
          Load sample
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 p-1 bg-gray-100 rounded-xl mb-4">
        <button
          onClick={() => switchTab('paste')}
          className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg text-sm font-semibold transition-all ${
            activeTab === 'paste'
              ? 'bg-white text-gray-900 shadow-sm'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
          </svg>
          Paste Text
        </button>
        <button
          onClick={() => switchTab('upload')}
          className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg text-sm font-semibold transition-all ${
            activeTab === 'upload'
              ? 'bg-white text-gray-900 shadow-sm'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
          </svg>
          Upload File
          <span className="text-xs font-normal text-gray-400">.txt · .pdf</span>
        </button>
      </div>

      {/* Tab content */}
      {activeTab === 'paste' ? (
        <textarea
          value={transcript}
          onChange={e => { setTranscript(e.target.value); setLoadedFile(null); }}
          placeholder={`Recruiter: Hi Sarah, thanks for joining. We're looking to fill the Senior Engineer role...\nHiring Manager: Sure! We need someone with strong React experience...\n...`}
          className="w-full h-64 px-4 py-3 text-sm text-gray-700 placeholder-gray-400 border border-gray-200 rounded-xl resize-none focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent transition font-mono"
          disabled={isLoading}
        />
      ) : (
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={`h-64 border-2 border-dashed rounded-xl flex flex-col items-center justify-center gap-4 transition-colors cursor-default ${
            isDragging
              ? 'border-brand-400 bg-brand-50'
              : 'border-gray-200 hover:border-brand-300 hover:bg-gray-50'
          }`}
        >
          {isParsing ? (
            <div className="flex flex-col items-center gap-3 text-center">
              <svg className="animate-spin h-8 w-8 text-brand-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              <p className="text-sm text-gray-500">Reading <span className="font-semibold text-gray-700">{loadedFile}</span>…</p>
            </div>
          ) : (
            <>
              <div className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-colors ${isDragging ? 'bg-brand-100' : 'bg-gray-100'}`}>
                <svg xmlns="http://www.w3.org/2000/svg" className={`h-7 w-7 transition-colors ${isDragging ? 'text-brand-500' : 'text-gray-400'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                </svg>
              </div>
              <div className="text-center">
                <p className="text-sm font-semibold text-gray-700">
                  {isDragging ? 'Drop to upload' : 'Drag & drop your file here'}
                </p>
                <p className="text-xs text-gray-400 mt-1">Supports .txt and .pdf files</p>
              </div>
              <button
                onClick={() => fileInputRef.current?.click()}
                className="px-4 py-2 text-sm font-semibold text-brand-600 bg-brand-50 hover:bg-brand-100 border border-brand-200 rounded-lg transition-colors"
              >
                Browse files
              </button>
            </>
          )}

          <input
            ref={fileInputRef}
            type="file"
            accept=".txt,.pdf"
            onChange={handleFileInput}
            className="hidden"
          />
        </div>
      )}

      {/* File error */}
      {fileError && (
        <div className="mt-2 flex items-start gap-2 text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          {fileError}
        </div>
      )}

      {/* Loaded file indicator */}
      {loadedFile && !fileError && activeTab === 'paste' && (
        <div className="mt-2 flex items-center gap-2 text-xs text-green-700 bg-green-50 border border-green-100 rounded-lg px-3 py-2">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span className="font-medium">{loadedFile}</span>
          <span className="text-green-600">loaded successfully</span>
          <button onClick={() => setLoadedFile(null)} className="ml-auto text-green-500 hover:text-green-700">✕</button>
        </div>
      )}

      {/* Footer */}
      <div className="flex items-center justify-between mt-3">
        <span className={`text-xs ${
          charCount === 0 ? 'text-gray-400'
          : isValid ? 'text-green-600'
          : 'text-amber-600'
        }`}>
          {charCount === 0
            ? 'Minimum 50 characters required'
            : isValid
            ? `${charCount.toLocaleString()} characters — ready`
            : `${charCount} / 50 characters minimum`}
        </span>

        <div className="flex gap-2">
          {(transcript || loadedFile) && (
            <button
              onClick={clearAll}
              disabled={isLoading}
              className="px-3 py-2 text-sm text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-40"
            >
              Clear
            </button>
          )}
          <button
            onClick={() => onGenerate(transcript)}
            disabled={!isValid || isLoading}
            className="flex items-center gap-2 px-5 py-2 bg-brand-600 hover:bg-brand-700 disabled:bg-gray-200 disabled:text-gray-400 text-white font-semibold rounded-lg transition-colors shadow-sm"
          >
            {isLoading ? (
              <>
                <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Generating…
              </>
            ) : (
              <>
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                Generate JD
              </>
            )}
          </button>
        </div>
      </div>

      {/* Tips */}
      <div className="mt-4 pt-4 border-t border-gray-100">
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Tips for best results</p>
        <ul className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
          {[
            'Include the full recruiter + hiring manager dialogue',
            'Mention specific skills and years of experience',
            'Discuss compensation, benefits, and team structure',
            'Describe the interview process if known',
          ].map((tip, i) => (
            <li key={i} className="flex gap-2 text-xs text-gray-500">
              <span className="text-brand-400 shrink-0">✓</span>
              {tip}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
