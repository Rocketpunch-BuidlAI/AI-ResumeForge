'use client';

import React from 'react';
import PDFViewer from './PDFViewer';
import DocPreview from './DocPreview';
import { FileText } from 'lucide-react';

interface FilePreviewProps {
  file: File | null;
}

const FilePreview: React.FC<FilePreviewProps> = ({ file }) => {
  if (!file) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-6 text-center">
        <FileText className="h-16 w-16 text-muted-foreground/60 mb-4" />
        <p className="text-sm text-muted-foreground">미리보기할 파일이 선택되지 않았습니다</p>
      </div>
    );
  }

  // 파일 유형에 따라 적합한 미리보기 컴포넌트 렌더링
  const fileType = file.type;
  
  if (fileType === 'application/pdf') {
    return <PDFViewer file={file} />;
  } else if (fileType === 'application/msword' || fileType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
    return <DocPreview file={file} />;
  } else {
    // 지원되지 않는 파일 형식
    return (
      <div className="flex flex-col items-center justify-center h-full p-6 text-center">
        <div className="p-5 bg-muted/20 rounded-full mb-4">
          <FileText className="h-16 w-16 text-muted-foreground/60" />
        </div>
        <h3 className="text-lg font-medium mb-2">지원되지 않는 파일 형식</h3>
        <p className="text-sm text-muted-foreground">
          이 파일 형식({file.type || '알 수 없음'})은 미리보기를 지원하지 않습니다.
          <br />PDF, DOC 및 DOCX 파일만 지원됩니다.
        </p>
      </div>
    );
  }
};

export default FilePreview; 