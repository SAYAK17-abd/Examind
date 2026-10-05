import React, { useState, useRef } from 'react';
import { UploadCloud, FileText, CheckCircle2, X, AlertCircle } from 'lucide-react';
import { studentService } from '../../services/studentService';
import { formatBytes } from '../../utils/format';
import { Button } from '../common/Button';
import { useToast } from '../../hooks/useToast';

export interface OcrUploaderProps {
  submissionId: number;
  currentAttachmentUrl?: string;
  onUploadSuccess: (fileUrl: string) => void;
  onRemoveAttachment?: () => void;
}

export const OcrUploader: React.FC<OcrUploaderProps> = ({
  submissionId,
  currentAttachmentUrl,
  onUploadSuccess,
  onRemoveAttachment,
}) => {
  const toast = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [dragOver, setDragOver] = useState<boolean>(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const handleFileChange = async (file: File) => {
    // Validate file type
    const validTypes = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png'];
    if (!validTypes.includes(file.type)) {
      setUploadError('Please upload a PDF document or JPG/PNG image.');
      toast.error('Invalid format. Only PDF, JPG, and PNG are supported.');
      return;
    }

    // Limit to 20MB
    if (file.size > 20 * 1024 * 1024) {
      setUploadError('File exceeds 20MB maximum size limit.');
      toast.error('File size exceeds the 20MB limit.');
      return;
    }

    setUploadError(null);
    setIsUploading(true);

    try {
      const res = await studentService.uploadFile(submissionId, file);
      toast.success(`Uploaded ${res.originalFileName || 'file'} successfully!`);
      onUploadSuccess(res.fileUrl);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'File upload failed';
      setUploadError(msg);
      toast.error(msg, 'Upload Failed');
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFileChange(e.dataTransfer.files[0]);
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <label className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
          <UploadCloud className="w-4 h-4 text-indigo-600" />
          <span>Upload Answer Sheet / OCR Document</span>
        </label>
        <span className="text-[11px] text-slate-400">PDF, JPG, PNG (Max 20MB)</span>
      </div>

      {currentAttachmentUrl ? (
        <div className="flex items-center justify-between p-3.5 rounded-xl border border-indigo-200 bg-indigo-50/60 text-xs">
          <div className="flex items-center gap-2.5">
            <FileText className="w-5 h-5 text-indigo-600" />
            <div>
              <p className="font-semibold text-slate-900 flex items-center gap-1">
                <span>Attached Document</span>
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              </p>
              <a
                href={currentAttachmentUrl}
                target="_blank"
                rel="noreferrer"
                className="text-indigo-600 hover:underline text-[11px] truncate max-w-xs block"
              >
                View Uploaded File
              </a>
            </div>
          </div>
          {onRemoveAttachment && (
            <button
              type="button"
              onClick={onRemoveAttachment}
              className="p-1 rounded-md text-slate-400 hover:text-rose-600 hover:bg-white transition-colors"
              aria-label="Remove attachment"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      ) : (
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setDragOver(true);
          }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
          className={`flex flex-col items-center justify-center p-6 border-2 border-dashed rounded-xl transition-all cursor-pointer ${
            dragOver
              ? 'border-indigo-500 bg-indigo-50/50'
              : 'border-slate-200 hover:border-slate-300 bg-white'
          }`}
          onClick={() => fileInputRef.current?.click()}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf,image/png,image/jpeg,image/jpg"
            className="hidden"
            onChange={(e) => {
              if (e.target.files && e.target.files[0]) {
                handleFileChange(e.target.files[0]);
              }
            }}
          />

          <UploadCloud className="w-8 h-8 text-slate-400 mb-2" />
          <p className="text-xs font-semibold text-slate-700">
            {isUploading ? 'Uploading and processing file...' : 'Click or drag file to attach answer sheet'}
          </p>
          <p className="text-[11px] text-slate-400 mt-1">
            Handwritten pages or digital PDF will be processed by EXAMIND OCR pipeline
          </p>
        </div>
      )}

      {uploadError && (
        <div className="flex items-center gap-1.5 text-xs text-rose-600">
          <AlertCircle className="w-4 h-4" />
          <span>{uploadError}</span>
        </div>
      )}
    </div>
  );
};
