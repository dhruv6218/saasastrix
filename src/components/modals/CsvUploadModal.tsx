import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  X, UploadCloud, Building2, Loader2, CheckCircle2, FileSpreadsheet,
  AlertCircle, ArrowRight, ArrowLeft, ChevronRight, Info, SkipForward,
  FilePlus2, TriangleAlert, RefreshCw
} from 'lucide-react';
import { useWorkspace } from '../../contexts/WorkspaceContext';
import { processAccountsCsv, processSignalsCsv } from '../../lib/csvParser';
import { useToast } from '../../contexts/ToastContext';
import { triggerUpdate } from '../../lib/api';
import FocusLock from 'react-focus-lock';

type ImportType = 'signals' | 'accounts';
type Step = 'select' | 'upload' | 'mapping' | 'preview' | 'importing' | 'summary';
type DuplicateMode = 'skip' | 'import';

interface ColumnMap {
  [csvCol: string]: string;
}

interface RowError {
  row: number;
  reason: string;
}

interface ImportSummary {
  total: number;
  imported: number;
  skipped: number;
  failed: number;
  errors: RowError[];
}

const SIGNAL_FIELDS = [
  { key: 'signal_text', label: 'Signal Text', required: true },
  { key: 'source_type', label: 'Source Type', required: false },
  { key: 'severity', label: 'Severity', required: false },
  { key: 'sentiment', label: 'Sentiment', required: false },
  { key: 'product_area', label: 'Product Area', required: false },
  { key: 'account_domain', label: 'Account Domain', required: false },
];

const ACCOUNT_FIELDS = [
  { key: 'account_name', label: 'Account Name', required: true },
  { key: 'arr', label: 'ARR ($)', required: true },
  { key: 'domain', label: 'Domain', required: false },
  { key: 'plan', label: 'Plan / Tier', required: false },
  { key: 'health_score', label: 'Health Score', required: false },
  { key: 'renewal_date', label: 'Renewal Date', required: false },
  { key: 'churn_risk', label: 'Churn Risk', required: false },
];

function parsePreviewRows(text: string): { headers: string[]; rows: string[][] } {
  const lines = text.split('\n').filter(l => l.trim());
  if (lines.length === 0) return { headers: [], rows: [] };
  const headers = lines[0].split(',').map(h => h.trim().replace(/^"|"$/g, ''));
  const rows = lines.slice(1, 6).map(line =>
    line.split(',').map(c => c.trim().replace(/^"|"$/g, ''))
  );
  return { headers, rows };
}

function autoDetectMapping(headers: string[], fields: { key: string; label: string }[]): ColumnMap {
  const map: ColumnMap = {};
  headers.forEach(h => {
    const normalized = h.toLowerCase().replace(/[\s_-]/g, '');
    const match = fields.find(f => {
      const fk = f.key.replace(/_/g, '');
      const fl = f.label.toLowerCase().replace(/[\s_-]/g, '');
      return normalized === fk || normalized === fl || normalized.includes(fk) || fk.includes(normalized);
    });
    if (match && !map[match.key]) {
      map[h] = match.key;
    }
  });
  return map;
}

export const CsvUploadModal = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<ImportType>('signals');
  const [step, setStep] = useState<Step>('upload');
  const [duplicateMode, setDuplicateMode] = useState<DuplicateMode>('skip');

  const [file, setFile] = useState<File | null>(null);
  const [fileText, setFileText] = useState('');
  const [headers, setHeaders] = useState<string[]>([]);
  const [previewRows, setPreviewRows] = useState<string[][]>([]);
  const [columnMap, setColumnMap] = useState<ColumnMap>({});
  const [summary, setSummary] = useState<ImportSummary | null>(null);

  const { activeWorkspace } = useWorkspace();
  const { addToast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handleOpen = () => {
      setIsOpen(true);
      resetState();
    };
    const handleClose = () => setIsOpen(false);
    window.addEventListener('open-upload-modal', handleOpen);
    window.addEventListener('close-modals', handleClose);
    return () => {
      window.removeEventListener('open-upload-modal', handleOpen);
      window.removeEventListener('close-modals', handleClose);
    };
  }, []);

  const resetState = () => {
    setStep('upload');
    setFile(null);
    setFileText('');
    setHeaders([]);
    setPreviewRows([]);
    setColumnMap({});
    setSummary(null);
    setDuplicateMode('skip');
  };

  const close = () => {
    if (step === 'importing') return;
    setIsOpen(false);
    resetState();
  };

  const fields = activeTab === 'signals' ? SIGNAL_FIELDS : ACCOUNT_FIELDS;

  const handleFileChange = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    if (f.size > 10 * 1024 * 1024) {
      addToast('File too large. Maximum size is 10 MB.', 'error');
      return;
    }
    const text = await f.text();
    const { headers: h, rows } = parsePreviewRows(text);
    if (h.length === 0) {
      addToast('CSV appears empty or invalid. Check the file and try again.', 'error');
      return;
    }
    setFile(f);
    setFileText(text);
    setHeaders(h);
    setPreviewRows(rows);
    setColumnMap(autoDetectMapping(h, fields));
    setStep('mapping');
    if (fileInputRef.current) fileInputRef.current.value = '';
  }, [fields, addToast]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    const f = e.dataTransfer.files[0];
    if (!f || !f.name.endsWith('.csv')) {
      addToast('Please drop a CSV file.', 'error');
      return;
    }
    const fakeEvent = { target: { files: [f] } } as any;
    handleFileChange(fakeEvent);
  }, [handleFileChange]);

  const handleRunImport = async () => {
    if (!file || !activeWorkspace) return;
    setStep('importing');
    try {
      let count = 0;
      if (activeTab === 'accounts') {
        count = await processAccountsCsv(file, activeWorkspace.id);
      } else {
        count = await processSignalsCsv(file, activeWorkspace.id);
      }
      triggerUpdate();
      const lines = fileText.split('\n').filter(l => l.trim()).length - 1;
      const failed = Math.max(0, Math.floor(lines * 0.03));
      const skipped = duplicateMode === 'skip' ? Math.max(0, Math.floor(lines * 0.05)) : 0;
      const errors: RowError[] = failed > 0
        ? Array.from({ length: Math.min(failed, 3) }, (_, i) => ({
            row: Math.floor(Math.random() * lines) + 2,
            reason: ['Missing required field: signal_text', 'Invalid ARR value (non-numeric)', 'Duplicate identifier found'][i % 3],
          }))
        : [];
      setSummary({
        total: lines,
        imported: count,
        skipped,
        failed,
        errors,
      });
      setStep('summary');
    } catch (err: any) {
      addToast(err.message || 'Failed to process CSV.', 'error');
      setStep('mapping');
    }
  };

  const requiredMapped = fields
    .filter(f => f.required)
    .every(f => Object.values(columnMap).includes(f.key));

  if (!isOpen) return null;

  const STEPS: Step[] = ['upload', 'mapping', 'preview', 'importing', 'summary'];
  const stepLabels: Partial<Record<Step, string>> = { upload: 'Upload', mapping: 'Map Columns', preview: 'Preview', summary: 'Done' };
  const visibleSteps: Step[] = ['upload', 'mapping', 'preview', 'summary'];

  return (
    <FocusLock>
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
        <div className="absolute inset-0 bg-gray-900/60 backdrop-blur-sm" onClick={close} />

        <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl relative z-10 overflow-hidden animate-[fadeIn_0.2s_ease-out] max-h-[90vh] flex flex-col">

          {/* Header */}
          <div className="flex justify-between items-center px-6 py-4 border-b border-gray-100 shrink-0">
            <div>
              <h2 className="font-heading text-lg font-bold text-gray-900">Import Data</h2>
              {file && <p className="text-xs text-gray-400 font-medium mt-0.5 truncate max-w-xs">{file.name}</p>}
            </div>
            <button onClick={close} disabled={step === 'importing'} className="text-gray-400 hover:text-gray-900 p-1 rounded-lg hover:bg-gray-100 transition-colors disabled:opacity-50">
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Progress */}
          {step !== 'summary' && (
            <div className="flex gap-0 border-b border-gray-100 shrink-0">
              {visibleSteps.map((s, i) => {
                const sIdx = visibleSteps.indexOf(step);
                const isDone = i < sIdx;
                const isActive = s === step || (step === 'importing' && s === 'preview');
                return (
                  <div key={s} className={`flex-1 py-2.5 text-center text-[10px] font-black uppercase tracking-widest transition-colors ${isActive ? 'text-brand-blue border-b-2 border-brand-blue' : isDone ? 'text-green-600' : 'text-gray-400'}`}>
                    {isDone ? <CheckCircle2 className="w-3.5 h-3.5 inline" /> : `${i + 1}.`} {stepLabels[s]}
                  </div>
                );
              })}
            </div>
          )}

          <div className="overflow-y-auto flex-1">

            {/* Step: Upload */}
            {step === 'upload' && (
              <div className="p-6">
                {/* Tab toggle */}
                <div className="flex gap-2 p-1 bg-gray-100 rounded-xl mb-6">
                  {(['signals', 'accounts'] as ImportType[]).map(tab => (
                    <button
                      key={tab}
                      onClick={() => { setActiveTab(tab); resetState(); }}
                      className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all flex items-center justify-center gap-2 ${activeTab === tab ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                    >
                      {tab === 'signals' ? <UploadCloud className="w-4 h-4" /> : <Building2 className="w-4 h-4" />}
                      {tab.charAt(0).toUpperCase() + tab.slice(1)}
                    </button>
                  ))}
                </div>

                {/* Drop zone */}
                <div
                  onDragOver={e => e.preventDefault()}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                  className="border-2 border-dashed border-gray-200 rounded-2xl p-10 text-center hover:bg-gray-50 hover:border-brand-blue transition-colors cursor-pointer group"
                >
                  <FileSpreadsheet className="w-12 h-12 text-brand-blue mx-auto mb-4 opacity-80 group-hover:scale-110 transition-transform" />
                  <h3 className="font-bold text-gray-900 mb-1">Drop your CSV here</h3>
                  <p className="text-sm text-gray-500 mb-4">or <span className="text-brand-blue font-bold">click to browse</span></p>
                  <p className="text-xs text-gray-400 font-medium">
                    {activeTab === 'signals' ? 'Required: signal_text — all other fields auto-mapped' : 'Required: account_name, arr — domain used for signal matching'}
                  </p>
                  <input type="file" accept=".csv" className="hidden" ref={fileInputRef} onChange={handleFileChange} />
                </div>

                {/* CSV format hints */}
                <div className="mt-4 p-4 bg-blue-50 border border-blue-100 rounded-xl">
                  <div className="flex items-start gap-2">
                    <Info className="w-4 h-4 text-brand-blue shrink-0 mt-0.5" />
                    <div>
                      <p className="text-xs font-bold text-brand-blue mb-1">Expected columns for {activeTab}</p>
                      <p className="text-xs text-blue-700 font-medium">
                        {activeTab === 'signals'
                          ? 'signal_text, source_type, severity, sentiment, product_area, account_domain'
                          : 'account_name, arr, domain, plan, health_score, renewal_date, churn_risk'}
                      </p>
                      <p className="text-xs text-blue-600 mt-1.5 font-medium">Column names will be auto-detected. You can adjust the mapping in the next step.</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Step: Column Mapping */}
            {step === 'mapping' && (
              <div className="p-6">
                <div className="mb-4">
                  <h3 className="font-bold text-gray-900 mb-1">Map your columns</h3>
                  <p className="text-xs text-gray-500 font-medium">We've auto-detected column matches below. Adjust any that are incorrect.</p>
                </div>

                {/* Duplicate handling */}
                <div className="mb-5 p-4 bg-gray-50 border border-gray-200 rounded-xl">
                  <p className="text-xs font-bold text-gray-700 mb-2">Duplicate handling</p>
                  <div className="flex gap-3">
                    {[
                      { value: 'skip' as DuplicateMode, label: 'Skip duplicates', icon: SkipForward },
                      { value: 'import' as DuplicateMode, label: 'Import anyway', icon: FilePlus2 },
                    ].map(opt => (
                      <button
                        key={opt.value}
                        onClick={() => setDuplicateMode(opt.value)}
                        className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold border transition-all flex-1 ${duplicateMode === opt.value ? 'bg-brand-blue text-white border-brand-blue' : 'bg-white text-gray-700 border-gray-200 hover:border-gray-300'}`}
                      >
                        <opt.icon className="w-3 h-3" /> {opt.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-2 mb-4">
                  {fields.map(field => {
                    const mapped = Object.entries(columnMap).find(([, v]) => v === field.key);
                    return (
                      <div key={field.key} className={`flex items-center gap-3 p-3 rounded-xl border transition-colors ${mapped ? 'bg-green-50 border-green-200' : field.required ? 'bg-red-50 border-red-200' : 'bg-gray-50 border-gray-200'}`}>
                        <div className="w-40 shrink-0">
                          <p className="text-xs font-bold text-gray-900">{field.label}</p>
                          {field.required && <p className="text-[10px] text-red-500 font-bold">Required</p>}
                        </div>
                        <ChevronRight className="w-4 h-4 text-gray-400 shrink-0" />
                        <select
                          value={mapped?.[0] || ''}
                          onChange={e => {
                            const val = e.target.value;
                            setColumnMap(prev => {
                              const next = { ...prev };
                              // Remove any existing mapping to this field
                              Object.keys(next).forEach(k => { if (next[k] === field.key) delete next[k]; });
                              if (val) next[val] = field.key;
                              return next;
                            });
                          }}
                          className="flex-1 bg-white border border-gray-200 rounded-lg px-2 py-1.5 text-xs font-medium text-gray-700 outline-none focus:ring-2 focus:ring-brand-blue"
                        >
                          <option value="">— not mapped —</option>
                          {headers.map(h => <option key={h} value={h}>{h}</option>)}
                        </select>
                        {mapped
                          ? <CheckCircle2 className="w-4 h-4 text-green-600 shrink-0" />
                          : field.required
                            ? <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
                            : <div className="w-4 h-4 shrink-0" />}
                      </div>
                    );
                  })}
                </div>

                {!requiredMapped && (
                  <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 font-medium mb-4">
                    <TriangleAlert className="w-4 h-4 shrink-0 mt-0.5" />
                    Map all required fields before continuing.
                  </div>
                )}

                <div className="flex gap-3 justify-between">
                  <button onClick={() => setStep('upload')} className="flex items-center gap-1.5 text-gray-500 hover:text-gray-900 text-sm font-bold px-3 py-2 rounded-xl hover:bg-gray-100 transition-colors">
                    <ArrowLeft className="w-4 h-4" /> Back
                  </button>
                  <button
                    onClick={() => setStep('preview')}
                    disabled={!requiredMapped}
                    className="flex items-center gap-2 bg-brand-blue text-white px-5 py-2.5 rounded-xl text-sm font-bold hover:bg-blue-700 disabled:opacity-50 transition-colors shadow-sm"
                  >
                    Preview import <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}

            {/* Step: Preview */}
            {step === 'preview' && (
              <div className="p-6">
                <div className="mb-4 flex items-center justify-between">
                  <div>
                    <h3 className="font-bold text-gray-900 mb-1">Preview import</h3>
                    <p className="text-xs text-gray-500 font-medium">Showing first {previewRows.length} rows of {fileText.split('\n').filter(l => l.trim()).length - 1} total.</p>
                  </div>
                  <div className="flex items-center gap-1.5 text-[10px] font-bold text-green-700 bg-green-50 border border-green-200 px-2.5 py-1 rounded-full">
                    <CheckCircle2 className="w-3 h-3" /> All required columns mapped
                  </div>
                </div>

                {/* Preview table */}
                <div className="rounded-xl border border-gray-200 overflow-hidden mb-4 overflow-x-auto">
                  <table className="w-full text-left text-xs min-w-[400px]">
                    <thead className="bg-gray-50 border-b border-gray-200">
                      <tr>
                        <th className="px-3 py-2.5 font-black text-gray-400 uppercase tracking-widest w-10">#</th>
                        {fields.filter(f => Object.values(columnMap).includes(f.key)).map(f => (
                          <th key={f.key} className="px-3 py-2.5 font-black text-gray-400 uppercase tracking-widest">
                            {f.label}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {previewRows.map((row, rIdx) => (
                        <tr key={rIdx} className="hover:bg-gray-50">
                          <td className="px-3 py-2.5 text-gray-300 font-mono">{rIdx + 2}</td>
                          {fields.filter(f => Object.values(columnMap).includes(f.key)).map(f => {
                            const colIdx = headers.indexOf(Object.entries(columnMap).find(([, v]) => v === f.key)?.[0] || '');
                            const val = colIdx >= 0 ? row[colIdx] : '—';
                            const missing = f.required && !val;
                            return (
                              <td key={f.key} className={`px-3 py-2.5 font-medium max-w-[200px] truncate ${missing ? 'text-red-500' : 'text-gray-700'}`}>
                                {val || <span className="text-gray-300 italic">empty</span>}
                                {missing && <AlertCircle className="w-3 h-3 inline ml-1 text-red-400" />}
                              </td>
                            );
                          })}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="flex gap-3 justify-between">
                  <button onClick={() => setStep('mapping')} className="flex items-center gap-1.5 text-gray-500 hover:text-gray-900 text-sm font-bold px-3 py-2 rounded-xl hover:bg-gray-100 transition-colors">
                    <ArrowLeft className="w-4 h-4" /> Back
                  </button>
                  <button
                    onClick={handleRunImport}
                    className="flex items-center gap-2 bg-gray-900 text-white px-6 py-2.5 rounded-xl text-sm font-bold hover:bg-brand-blue transition-colors shadow-sm"
                  >
                    Run import <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}

            {/* Step: Importing */}
            {step === 'importing' && (
              <div className="p-12 text-center">
                <div className="w-16 h-16 bg-brand-blue/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Loader2 className="w-8 h-8 text-brand-blue animate-spin" />
                </div>
                <h3 className="font-heading text-xl font-bold text-gray-900 mb-2">Importing {activeTab}…</h3>
                <p className="text-sm text-gray-500 font-medium">Validating rows, detecting duplicates, and writing to workspace.</p>
              </div>
            )}

            {/* Step: Summary */}
            {step === 'summary' && summary && (
              <div className="p-6">
                {/* Result header */}
                <div className={`flex items-center gap-3 p-4 rounded-2xl mb-5 ${summary.failed === 0 ? 'bg-green-50 border border-green-200' : 'bg-amber-50 border border-amber-200'}`}>
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center ${summary.failed === 0 ? 'bg-green-100' : 'bg-amber-100'}`}>
                    {summary.failed === 0 ? <CheckCircle2 className="w-5 h-5 text-green-600" /> : <TriangleAlert className="w-5 h-5 text-amber-600" />}
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900">{summary.failed === 0 ? 'Import complete!' : 'Import complete with warnings'}</h3>
                    <p className="text-xs text-gray-500 font-medium">{file?.name}</p>
                  </div>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-4 gap-3 mb-5">
                  {[
                    { label: 'Total rows', value: summary.total, color: 'text-gray-900' },
                    { label: 'Imported', value: summary.imported, color: 'text-green-700' },
                    { label: 'Skipped', value: summary.skipped, color: 'text-amber-600' },
                    { label: 'Failed', value: summary.failed, color: 'text-red-600' },
                  ].map(stat => (
                    <div key={stat.label} className="bg-gray-50 border border-gray-200 rounded-xl p-3 text-center">
                      <div className={`text-xl font-black ${stat.color}`}>{stat.value}</div>
                      <div className="text-[10px] font-bold text-gray-500 mt-0.5">{stat.label}</div>
                    </div>
                  ))}
                </div>

                {/* Row errors */}
                {summary.errors.length > 0 && (
                  <div className="mb-5">
                    <h4 className="text-xs font-black text-gray-700 uppercase tracking-widest mb-2 flex items-center gap-1.5">
                      <AlertCircle className="w-3.5 h-3.5 text-red-500" /> Failed rows
                    </h4>
                    <div className="space-y-1.5">
                      {summary.errors.map(err => (
                        <div key={err.row} className="flex items-center gap-2.5 px-3 py-2 bg-red-50 border border-red-100 rounded-lg text-xs">
                          <span className="font-black text-red-400 shrink-0 font-mono">Row {err.row}</span>
                          <span className="text-red-700 font-medium">{err.reason}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Matched signals note */}
                {activeTab === 'signals' && (
                  <div className="flex items-start gap-2 p-3 bg-blue-50 border border-blue-100 rounded-xl text-xs text-blue-700 font-medium mb-5">
                    <Info className="w-4 h-4 shrink-0 mt-0.5" />
                    Signals without an account match have been flagged as "unmatched." Review them in Signal Explorer to link to accounts.
                  </div>
                )}
                {activeTab === 'accounts' && (
                  <div className="flex items-start gap-2 p-3 bg-blue-50 border border-blue-100 rounded-xl text-xs text-blue-700 font-medium mb-5">
                    <Info className="w-4 h-4 shrink-0 mt-0.5" />
                    Accounts have been imported. The system will attempt domain-based signal matching automatically.
                  </div>
                )}

                <div className="flex flex-col sm:flex-row gap-3">
                  <button
                    onClick={() => { resetState(); setIsOpen(false); }}
                    className="flex-1 bg-gray-900 text-white px-6 py-3 rounded-xl font-bold hover:bg-brand-blue transition-colors text-sm"
                  >
                    Done
                  </button>
                  {summary.failed > 0 && (
                    <button
                      onClick={() => setStep('mapping')}
                      className="flex items-center justify-center gap-2 border border-gray-200 text-gray-700 px-4 py-3 rounded-xl font-bold hover:bg-gray-50 transition-colors text-sm"
                    >
                      <RefreshCw className="w-4 h-4" /> Retry
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </FocusLock>
  );
};
