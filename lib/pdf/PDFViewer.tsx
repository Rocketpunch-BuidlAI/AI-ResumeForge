'use client';

import React, { useState, useEffect } from 'react';
import { Document, Page, pdfjs as pdfjsLib } from 'react-pdf';
import 'react-pdf/dist/esm/Page/AnnotationLayer.css';
import 'react-pdf/dist/esm/Page/TextLayer.css';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, Download, ZoomIn, ZoomOut } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

// PDF.js 워커 설정 - 로컬 패키지에서 불러오도록 변경
pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.mjs',
  import.meta.url
).toString();

interface PDFViewerProps {
  file: File | null;
  className?: string;
}

const PDFViewer: React.FC<PDFViewerProps> = ({ file, className }) => {
  const [numPages, setNumPages] = useState<number | null>(null);
  const [pageNumber, setPageNumber] = useState<number>(1);
  const [scale, setScale] = useState<number>(1.0);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const onDocumentLoadSuccess = ({ numPages }: { numPages: number }) => {
    setNumPages(numPages);
    setLoading(false);
    setError(null);
  };

  const onDocumentLoadError = (err: Error) => {
    console.error('PDF 로딩 오류:', err);
    setLoading(false);
    setError(`PDF 로딩 오류: ${err.message}`);
  };

  const previousPage = () => {
    setPageNumber((prev) => Math.max(prev - 1, 1));
  };

  const nextPage = () => {
    if (numPages) {
      setPageNumber((prev) => Math.min(prev + 1, numPages));
    }
  };

  const downloadFile = () => {
    if (file) {
      const url = URL.createObjectURL(file);
      const a = document.createElement('a');
      a.href = url;
      a.download = file.name;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }
  };

  const zoomIn = () => {
    setScale((prev) => Math.min(prev + 0.2, 3));
  };

  const zoomOut = () => {
    setScale((prev) => Math.max(prev - 0.2, 0.5));
  };

  useEffect(() => {
    // 파일이 변경될 때마다 로딩 상태와 에러 초기화
    if (file) {
      setLoading(true);
      setError(null);
      setPageNumber(1);
    }
  }, [file]);

  if (!file) {
    return (
      <div className="flex h-full flex-col items-center justify-center p-8 text-center">
        <p className="text-muted-foreground">PDF 파일을 선택해주세요</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex h-full flex-col items-center justify-center space-y-4 p-8 text-center">
        <p className="text-red-500">{error}</p>
        <Button onClick={downloadFile}>
          <Download className="mr-2 h-4 w-4" />
          파일 다운로드
        </Button>
      </div>
    );
  }

  return (
    <div className={cn('flex h-full w-full flex-col items-center', className)}>
      <div className="bg-muted/30 mb-4 flex w-full items-center justify-between rounded-md p-2">
        <div className="flex items-center space-x-2">
          <Button variant="outline" size="icon" onClick={previousPage} disabled={pageNumber <= 1}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="text-sm">
            {pageNumber} / {numPages || '?'}
          </span>
          <Button
            variant="outline"
            size="icon"
            onClick={nextPage}
            disabled={numPages === null || pageNumber >= numPages}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
        <div className="flex items-center space-x-2">
          <Button variant="outline" size="icon" onClick={zoomOut}>
            <ZoomOut className="h-4 w-4" />
          </Button>
          <span className="text-sm">{Math.round(scale * 100)}%</span>
          <Button variant="outline" size="icon" onClick={zoomIn}>
            <ZoomIn className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="sm" onClick={downloadFile}>
            <Download className="mr-2 h-4 w-4" />
            다운로드
          </Button>
        </div>
      </div>

      <div className="w-full flex-1 overflow-auto">
        <div className="flex min-h-full justify-center">
          <Document
            file={file}
            onLoadSuccess={onDocumentLoadSuccess}
            onLoadError={onDocumentLoadError}
            loading={
              <div className="flex justify-center py-12">
                <Skeleton className="h-[600px] w-[450px]" />
              </div>
            }
            error={<p className="py-12 text-center text-red-500">PDF 로딩에 실패했습니다</p>}
            className="max-w-full"
          >
            {loading ? (
              <div className="flex justify-center py-12">
                <Skeleton className="h-[600px] w-[450px]" />
              </div>
            ) : (
              <Page
                pageNumber={pageNumber}
                scale={scale}
                renderTextLayer={true}
                renderAnnotationLayer={true}
                className="shadow-md"
                loading={<Skeleton className="h-[600px] w-[450px]" />}
                error="PDF 페이지를 렌더링하는 데 문제가 발생했습니다"
              />
            )}
          </Document>
        </div>
      </div>
    </div>
  );
};

export default PDFViewer;
