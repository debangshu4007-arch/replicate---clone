'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';
import { fileToBase64 } from '@/lib/utils';
import { Upload, X, Image, Video, Music, File } from 'lucide-react';

export interface FileUploadProps {
  label?: string;
  hint?: string;
  error?: string;
  accept?: string;
  onChange: (value: string | null) => void;
  value?: string | null;
  required?: boolean;
  disabled?: boolean;
  className?: string;
}

export function FileUpload({
  label,
  hint,
  error,
  accept = 'image/*',
  onChange,
  value,
  required,
  disabled,
  className,
}: FileUploadProps) {
  const inputRef = React.useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = React.useState(false);
  const [preview, setPreview] = React.useState<string | null>(value || null);
  const [fileName, setFileName] = React.useState<string | null>(null);

  // Update preview when value changes externally
  React.useEffect(() => {
    setPreview(value || null);
  }, [value]);

  const handleFile = async (file: File) => {
    try {
      const base64 = await fileToBase64(file);
      setPreview(base64);
      setFileName(file.name);
      onChange(base64);
    } catch (err) {
      console.error('Failed to read file:', err);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    if (disabled) return;
    
    const file = e.dataTransfer.files[0];
    if (file) {
      handleFile(file);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFile(file);
    }
  };

  const clearFile = () => {
    setPreview(null);
    setFileName(null);
    onChange(null);
    if (inputRef.current) {
      inputRef.current.value = '';
    }
  };

  const getFileIcon = () => {
    if (accept.includes('image')) return <Image className="h-8 w-8 text-gray-500" />;
    if (accept.includes('video')) return <Video className="h-8 w-8 text-gray-500" />;
    if (accept.includes('audio')) return <Music className="h-8 w-8 text-gray-500" />;
    return <File className="h-8 w-8 text-gray-500" />;
  };

  const isImage = preview && (preview.startsWith('data:image') || /\.(jpg|jpeg|png|gif|webp|svg)/i.test(preview));

  return (
    <div className={cn('space-y-1.5', className)}>
      {label && (
        <label className="block text-sm font-medium text-gray-300">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      
      <div
        className={cn(
          'relative rounded-lg border-2 border-dashed transition-colors',
          isDragging ? 'border-blue-500 bg-blue-500/10' : 'border-gray-700 hover:border-gray-600',
          disabled && 'opacity-50 cursor-not-allowed',
          error && 'border-red-500'
        )}
        onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
      >
        {preview ? (
          <div className="relative p-4">
            {isImage ? (
              <img
                src={preview}
                alt="Preview"
                className="max-h-48 mx-auto rounded-lg object-contain"
              />
            ) : (
              <div className="flex items-center justify-center gap-3 py-4">
                {getFileIcon()}
                <span className="text-sm text-gray-400 truncate max-w-xs">
                  {fileName || 'File selected'}
                </span>
              </div>
            )}
            <button
              type="button"
              onClick={clearFile}
              className="absolute top-2 right-2 p-1 rounded-full bg-gray-800 hover:bg-gray-700 text-gray-400 hover:text-white"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        ) : (
          <label className={cn('flex flex-col items-center justify-center py-8 px-4 cursor-pointer', disabled && 'cursor-not-allowed')}>
            <Upload className="h-8 w-8 text-gray-500 mb-2" />
            <span className="text-sm text-gray-400">
              Drop file here or <span className="text-blue-500">browse</span>
            </span>
            <span className="text-xs text-gray-500 mt-1">
              {accept.replace(/\*/g, 'files').replace(/,/g, ', ')}
            </span>
            <input
              ref={inputRef}
              type="file"
              accept={accept}
              onChange={handleChange}
              disabled={disabled}
              className="hidden"
            />
          </label>
        )}
      </div>

      {hint && !error && (
        <p className="text-xs text-gray-500">{hint}</p>
      )}
      {error && (
        <p className="text-xs text-red-500">{error}</p>
      )}
    </div>
  );
}
