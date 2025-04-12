'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Document, Page, pdfjs as pdfjsLib } from 'react-pdf';
import 'react-pdf/dist/esm/Page/AnnotationLayer.css';
import 'react-pdf/dist/esm/Page/TextLayer.css';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, Download, ZoomIn, ZoomOut } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

// PDF.js 워커 설정 - 한 번만 초기화
if (typeof window !== 'undefined' && !pdfjsLib.GlobalWorkerOptions.workerSrc) {
  pdfjsLib.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.js';
}

interface PDFViewerProps {
  file?: File | null;
  fileUrl?: string;
  className?: string;
}

const PDFViewer: React.FC<PDFViewerProps> = ({ file, fileUrl, className }) => {
  const [numPages, setNumPages] = useState<number | null>(null);
  const [pageNumber, setPageNumber] = useState<number>(1);
  const [scale, setScale] = useState<number>(1.0);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [fileSource, setFileSource] = useState<{ url: string } | null>(null);
  const documentRef = useRef<React.ComponentRef<typeof Document>>(null);

  // 파일 소스 설정 및 cleanup
  useEffect(() => {
    let source = null;
    let objectUrl: string | null = null;

    try {
      if (file) {
        objectUrl = URL.createObjectURL(file);
        source = { url: objectUrl };
      } else if (fileUrl) {
        source = { url: fileUrl };
      }
      setFileSource(source);
      setLoading(true);
      setError(null);
      setPageNumber(1);
    } catch (err) {
      console.error('PDF 파일 소스 설정 오류:', err);
      setError('PDF 파일을 로드할 수 없습니다.');
      setLoading(false);
    }

    // cleanup 함수
    return () => {
      if (objectUrl) {
        URL.revokeObjectURL(objectUrl);
      }
      
      // PDF 인스턴스 정리
      if (documentRef.current) {
        try {
          documentRef.current = null;
        } catch (e) {
          console.warn('PDF 문서 정리 중 오류:', e);
        }
      }
      
      setFileSource(null);
    };
  }, [file, fileUrl]);

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
    } else if (fileUrl) {
      window.open(fileUrl, '_blank');
    }
  };

  const zoomIn = () => {
    setScale((prev) => Math.min(prev + 0.2, 3));
  };

  const zoomOut = () => {
    setScale((prev) => Math.max(prev - 0.2, 0.5));
  };

  if (!fileSource) {
    return (
      <div className="flex h-full flex-col items-center justify-center p-8 text-center">
        <p className="text-muted-foreground">PDF 파일을 불러올 수 없습니다</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex h-full flex-col items-center justify-center space-y-4 p-8 text-center">
        <p className="text-red-500">{error}</p>
        <p className="text-sm text-muted-foreground">PDF 미리보기를 불러오는 데 문제가 발생했습니다.</p>
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
          {fileSource && (
            <Document
              ref={documentRef}
              file={fileSource}
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
                  key={`page_${pageNumber}`}
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
          )}
        </div>
      </div>
    </div>
  );
};

export default PDFViewer;
