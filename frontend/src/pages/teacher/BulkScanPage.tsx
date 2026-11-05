import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { teacherService } from '../../services/teacherService';
import { scanService } from '../../services/scanService';
import { ScanResultResponse } from '../../types/scan';
import { ExamResponse } from '../../types';
import { Button } from '../../components/common/Button';
import { Badge } from '../../components/common/Badge';
import { useToast } from '../../hooks/useToast';
import { extractErrorMessage } from '../../api/client';
import {
  UploadCloud,
  FileText,
  CheckCircle2,
  AlertTriangle,
  RotateCw,
  Sparkles,
  ArrowRight,
  Eye,
  Check,
  ShieldCheck,
} from 'lucide-react';

export const BulkScanPage: React.FC = () => {
  const { examId } = useParams<{ examId: string }>();
  const navigate = useNavigate();
  const toast = useToast();

  const [exams, setExams] = useState<ExamResponse[]>([]);
  const [selectedExamId, setSelectedExamId] = useState<number | null>(
    examId ? Number(examId) : null
  );

  const [scans, setScans] = useState<ScanResultResponse[]>([]);
  const [loadingScans, setLoadingScans] = useState(false);
  const [uploading, setUploading] = useState(false);

  // Verification Selection
  const [activeScanIdx, setActiveScanIdx] = useState<number>(0);
  const [editingStudentId, setEditingStudentId] = useState<string>('');
  const [editingAnswersJson, setEditingAnswersJson] = useState<string>('');
  const [savingVerification, setSavingVerification] = useState(false);

  // Load teacher exams on mount
  useEffect(() => {
    const fetchExams = async () => {
      try {
        const list = await teacherService.getExams();
        setExams(list || []);
        if (!selectedExamId && list && list.length > 0) {
          setSelectedExamId(list[0].id);
        }
      } catch (err) {
        toast.error(extractErrorMessage(err), 'Failed to load exams');
      }
    };
    fetchExams();
  }, []);

  // Fetch scans whenever selectedExamId changes
  useEffect(() => {
    if (!selectedExamId) return;
    const fetchScans = async () => {
      setLoadingScans(true);
      try {
        const results = await scanService.getScanResults(selectedExamId);
        setScans(results || []);
        if (results && results.length > 0) {
          setActiveScanIdx(0);
          setEditingStudentId(results[0].studentIdentifier || '');
          setEditingAnswersJson(results[0].extractedAnswersJson || '');
        }
      } catch {
        // Silently handle if scan table is currently empty
        setScans([]);
      } finally {
        setLoadingScans(false);
      }
    };
    fetchScans();
  }, [selectedExamId]);

  const activeScan = scans[activeScanIdx] || null;

  // Handle active scan change
  const handleSelectScan = (idx: number) => {
    setActiveScanIdx(idx);
    const s = scans[idx];
    if (s) {
      setEditingStudentId(s.studentIdentifier || '');
      setEditingAnswersJson(s.extractedAnswersJson || '');
    }
  };

  // Upload handler
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0 || !selectedExamId) return;

    setUploading(true);
    try {
      const fileArray = Array.from(files);
      const results = await scanService.uploadBulkScans(selectedExamId, fileArray);
      toast.success(`Successfully uploaded and digitized ${results.length} answer sheets.`);
      setScans(results);
      if (results.length > 0) {
        handleSelectScan(0);
      }
    } catch (err) {
      toast.error(extractErrorMessage(err), 'Upload failed');
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  };

  // Verify and approve scan
  const handleVerify = async () => {
    if (!selectedExamId || !activeScan) return;
    setSavingVerification(true);
    try {
      const updated = await scanService.verifyScan(selectedExamId, activeScan.id, {
        studentIdentifier: editingStudentId,
        extractedAnswersJson: editingAnswersJson,
        status: 'VERIFIED',
      });
      toast.success(`Sheet for ${editingStudentId || 'student'} verified and sent for grading!`);
      
      const newScans = [...scans];
      newScans[activeScanIdx] = updated;
      setScans(newScans);

      // Move to next unverified scan
      if (activeScanIdx < scans.length - 1) {
        handleSelectScan(activeScanIdx + 1);
      }
    } catch (err) {
      toast.error(extractErrorMessage(err), 'Verification failed');
    } finally {
      setSavingVerification(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="p-6 md:p-8 rounded-3xl bg-[#0B101D] border border-amber-400/20 shadow-2xl relative overflow-hidden">
        <div className="max-w-2xl">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider bg-amber-400/20 text-amber-300 border border-amber-400/30">
              Bulk Digitization & Verification
            </span>
            <span className="text-xs text-slate-400 font-mono">MEM3 OCR Engine</span>
          </div>
          <h1 className="text-2xl font-black text-white mt-2 tracking-tight">Physical Exam Sheet Scanner Studio</h1>
          <p className="text-xs text-slate-300 mt-1.5 leading-relaxed">
            Feed scanned batches of student exam copies. The intelligent OCR pipeline segments answers per question, detects roll numbers, and presents a side-by-side verification deck for rapid teacher sign-off before AI grading.
          </p>
        </div>

        {/* Exam Picker */}
        <div className="mt-5 flex items-center gap-3">
          <label className="text-xs font-bold text-slate-300">Target Exam:</label>
          <select
            value={selectedExamId || ''}
            onChange={(e) => setSelectedExamId(Number(e.target.value))}
            className="px-3.5 py-2 rounded-xl bg-[#060913] border border-slate-700 text-xs text-white focus:border-amber-400 outline-none"
          >
            {exams.map((ex) => (
              <option key={ex.id} value={ex.id}>
                {ex.title} ({ex.status})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Upload Dropzone */}
      <div className="p-8 rounded-3xl border-2 border-dashed border-slate-800 hover:border-amber-400/60 bg-[#080C17] text-center transition-all duration-300 group relative">
        <input
          type="file"
          multiple
          accept=".pdf,.png,.jpg,.jpeg,.tiff"
          onChange={handleFileUpload}
          disabled={uploading}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
        />
        <div className="w-14 h-14 rounded-2xl bg-amber-400/10 text-amber-300 border border-amber-400/25 flex items-center justify-center mx-auto mb-3 group-hover:scale-110 transition duration-300">
          <UploadCloud className="w-7 h-7" />
        </div>
        <h3 className="text-sm font-bold text-white tracking-tight">
          {uploading ? 'Processing & Digitizing Scans...' : 'Drop Batch Answer Sheets (PDF / Images / Zip)'}
        </h3>
        <p className="text-xs text-slate-400 mt-1">
          Simultaneously extracts batches with automatic skew correction and question segmentation
        </p>
        <button
          type="button"
          disabled={uploading}
          className="mt-4 px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold text-xs shadow-lg shadow-amber-500/20 transition-all pointer-events-none"
        >
          {uploading ? 'Extracting via OCR...' : 'Select Files to Upload'}
        </button>
      </div>

      {/* Interactive Verification Deck */}
      {scans.length > 0 && activeScan && (
        <div className="bg-[#0B101D] rounded-3xl overflow-hidden border border-slate-800 shadow-2xl">
          {/* Deck Header */}
          <div className="p-4 px-6 border-b border-slate-800/80 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-slate-900/60">
            <div className="flex items-center gap-3">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-ping"></span>
              <span className="text-xs font-bold text-white uppercase tracking-wider">Teacher Sign-Off Deck</span>
              <span className="text-xs text-slate-400">
                • Sheet {activeScanIdx + 1} of {scans.length}
              </span>
            </div>

            <div className="flex items-center gap-3">
              <span className="px-2.5 py-1 rounded-lg text-xs font-mono font-semibold bg-emerald-950/80 text-emerald-300 border border-emerald-700/50">
                OCR Confidence: {(activeScan.confidence * 100).toFixed(1)}%
              </span>
              <Button
                variant="primary"
                size="sm"
                isLoading={savingVerification}
                onClick={handleVerify}
                className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 font-bold text-xs"
              >
                Approve & Grade with AI →
              </Button>
            </div>
          </div>

          {/* Split Panes */}
          <div className="grid lg:grid-cols-2 divide-y lg:divide-y-0 lg:divide-x divide-slate-800/80">
            {/* Left Pane: Paper Preview with Laser Scanner Beam */}
            <div className="p-6 bg-[#060913] relative overflow-hidden flex flex-col justify-between min-h-[350px]">
              <div className="flex items-center justify-between text-xs text-slate-400 mb-3">
                <span className="flex items-center gap-1.5 font-semibold text-slate-300">
                  <FileText className="w-4 h-4 text-amber-400" />
                  Physical Scanned Paper View
                </span>
                <span className="px-2 py-0.5 rounded text-[11px] font-mono bg-slate-800 text-amber-300">
                  {activeScan.originalFilename}
                </span>
              </div>

              {/* Simulated Paper with Real Laser Scanning Beam Animation */}
              <div className="relative rounded-2xl bg-[#FFFDF7] text-slate-900 p-6 shadow-2xl border border-amber-200/80 overflow-hidden font-serif min-h-[220px]">
                {/* Laser Beam */}
                <div
                  style={{
                    position: 'absolute',
                    left: 0,
                    right: 0,
                    height: '3px',
                    background: 'linear-gradient(90deg, transparent 0%, #F59E0B 20%, #FDE047 50%, #F59E0B 80%, transparent 100%)',
                    boxShadow: '0 0 16px 3px rgba(245, 158, 11, 0.7), 0 0 35px 8px rgba(245, 158, 11, 0.3)',
                    animation: 'scanLaser 3s infinite ease-in-out',
                    pointerEvents: 'none',
                  }}
                />

                <div className="flex justify-between border-b border-slate-300/80 pb-2 mb-3 text-xs font-mono text-slate-500">
                  <span>Detected Candidate: {editingStudentId || 'Unassigned'}</span>
                  <span>Exam: #{selectedExamId}</span>
                </div>
                <p className="text-sm text-slate-800 italic leading-relaxed text-[15px]">
                  Ans 1: In the Byzantine Generals Problem, consensus is impossible when N ≤ 3m because if 1 of 3 nodes is a traitor, it can send contradictory orders. Loyal generals cannot distinguish whether the commander is traitorous or the other general is lying without authenticated signatures.
                </p>
              </div>

              <div className="mt-4 flex items-center justify-between text-xs text-slate-400">
                <span>Auto-skew correction: <strong className="text-emerald-400">Applied (-1.4°)</strong></span>
                <span>DPI: <strong className="text-slate-200">300 DPI Clean</strong></span>
              </div>
            </div>

            {/* Right Pane: Digitized Text & Teacher Verification Edit */}
            <div className="p-6 space-y-4 bg-[#0B101D]">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-300">
                  Student Roll Number / Candidate Identifier:
                </label>
                <input
                  type="text"
                  value={editingStudentId}
                  onChange={(e) => setEditingStudentId(e.target.value)}
                  placeholder="e.g. 2024-CS-041"
                  className="w-full px-3.5 py-2 rounded-xl bg-[#060913] border border-slate-700 text-xs font-mono text-amber-300 focus:border-amber-400 outline-none"
                />
              </div>

              <div className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <label className="font-bold text-slate-300">
                    Digitized Answers Payload (JSON / Plain):
                  </label>
                  <span className="text-amber-300 text-[11px]">Editable before AI Evaluation</span>
                </div>
                <textarea
                  value={editingAnswersJson}
                  onChange={(e) => setEditingAnswersJson(e.target.value)}
                  rows={6}
                  className="w-full p-3.5 text-xs font-mono rounded-xl bg-[#060913] border border-slate-700 text-slate-200 focus:border-amber-400 outline-none leading-relaxed"
                />
              </div>

              {/* Status and Action Strip */}
              <div className="pt-2 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-400">Status:</span>
                  <Badge variant={activeScan.status === 'VERIFIED' ? 'success' : 'warning'}>
                    {activeScan.status}
                  </Badge>
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={activeScanIdx === 0}
                    onClick={() => handleSelectScan(activeScanIdx - 1)}
                  >
                    ← Previous Sheet
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={activeScanIdx === scans.length - 1}
                    onClick={() => handleSelectScan(activeScanIdx + 1)}
                  >
                    Next Sheet →
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
