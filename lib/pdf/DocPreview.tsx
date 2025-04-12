'use client';

import React from 'react';
import { FileText, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface DocPreviewProps {
  file?: File | null;
  fileUrl?: string;
}

const DocPreview: React.FC<DocPreviewProps> = ({ file, fileUrl }) => {
  if (!file && !fileUrl) {
    return null;
  }

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
      // URL이 제공된 경우 직접 다운로드 링크 열기
      const a = document.createElement('a');
      a.href = fileUrl;
      a.download = fileUrl.split('/').pop() || 'download.doc';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    }
  };

  // 파일 이름 결정
  const fileName = file ? file.name : fileUrl ? fileUrl.split('/').pop() : '문서 파일';
  // 파일 타입 결정
  const fileType = file
    ? file.type
    : fileUrl
      ? fileUrl.toLowerCase().endsWith('docx')
        ? 'DOCX'
        : 'DOC'
      : '';

  return (
    <div className="flex h-full flex-col items-center justify-center space-y-6 p-8 text-center">
      <div className="bg-muted/20 rounded-full p-6">
        <FileText className="text-primary/60 h-20 w-20" />
      </div>
      <div className="max-w-md space-y-2">
        <h3 className="text-xl font-semibold">{fileName}</h3>
        <p className="text-muted-foreground">
          {fileType === 'application/msword' || fileType === 'DOC' ? 'DOC' : 'DOCX'} 파일은
          미리보기를 지원하지 않습니다.
        </p>
        <p className="text-muted-foreground mt-2 text-sm">
          문서 파일은 브라우저에서 직접 미리보기가 불가능합니다. 파일을 다운로드하여 내용을
          확인해주세요.
        </p>
      </div>
      <Button onClick={downloadFile} className="mt-4 cursor-pointer">
        <Download className="mr-2 h-4 w-4" />
        파일 다운로드
      </Button>
    </div>
  );
};

export default DocPreview;
