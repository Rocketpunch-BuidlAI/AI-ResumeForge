'use client';

import React from 'react';
import PDFViewer from './PDFViewer';
import DocPreview from './DocPreview';
import { FileText } from 'lucide-react';

interface FilePreviewProps {
  file: File | null;
  fileUrl?: string;
}

const FilePreview: React.FC<FilePreviewProps> = ({ file, fileUrl }) => {
  console.log('file', file);
  console.log('fileUrl', fileUrl);

  // 파일이나 URL 중 하나가 없는 경우 안내 메시지 표시
  if (!file && !fileUrl) {
    return (
      <div className="flex h-full flex-col items-center justify-center p-6 text-center">
        <FileText className="text-muted-foreground/60 mb-4 h-16 w-16" />
        <p className="text-muted-foreground text-sm">미리보기할 파일이 선택되지 않았습니다</p>
      </div>
    );
  }

  // URL이 제공된 경우 (Vercel Blob 등), 파일 확장자를 URL에서 추출
  if (fileUrl) {
    // URL에서 확장자 추출
    const extension = fileUrl.split('.').pop()?.toLowerCase();

    if (extension === 'pdf') {
      return <PDFViewer fileUrl={fileUrl} />;
    } else if (extension === 'doc' || extension === 'docx') {
      return <DocPreview fileUrl={fileUrl} />;
    } else {
      // 지원되지 않는 파일 형식
      return (
        <div className="flex h-full flex-col items-center justify-center p-6 text-center">
          <div className="bg-muted/20 mb-4 rounded-full p-5">
            <FileText className="text-muted-foreground/60 h-16 w-16" />
          </div>
          <h3 className="mb-2 text-lg font-medium">지원되지 않는 파일 형식</h3>
          <p className="text-muted-foreground text-sm">
            이 파일 형식은 미리보기를 지원하지 않습니다.
            <br />
            PDF, DOC 및 DOCX 파일만 지원됩니다.
          </p>
        </div>
      );
    }
  }

  // 파일 유형에 따라 적합한 미리보기 컴포넌트 렌더링
  const fileType = file?.type;

  if (fileType === 'application/pdf') {
    return <PDFViewer file={file} />;
  } else if (
    fileType === 'application/msword' ||
    fileType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  ) {
    return <DocPreview file={file} />;
  } else {
    // 지원되지 않는 파일 형식
    return (
      <div className="flex h-full flex-col items-center justify-center p-6 text-center">
        <div className="bg-muted/20 mb-4 rounded-full p-5">
          <FileText className="text-muted-foreground/60 h-16 w-16" />
        </div>
        <h3 className="mb-2 text-lg font-medium">지원되지 않는 파일 형식</h3>
        <p className="text-muted-foreground text-sm">
          이 파일 형식({file?.type || '알 수 없음'})은 미리보기를 지원하지 않습니다.
          <br />
          PDF, DOC 및 DOCX 파일만 지원됩니다.
        </p>
      </div>
    );
  }
};

export default FilePreview;
