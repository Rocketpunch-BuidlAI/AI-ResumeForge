declare module 'pdf-text-extract' {
  function pdfTextExtract(
    filePath: string,
    callback: (error: Error | null, pages: string[]) => void
  ): void;
  export = pdfTextExtract;
} 