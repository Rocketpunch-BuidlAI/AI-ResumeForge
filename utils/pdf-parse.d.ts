declare module 'pdf-parse' {
  interface PDFData {
    text: string;
    numpages: number;
    numrender: number;
    info: {
      PDFFormatVersion: string;
      IsAcroFormPresent: boolean;
      IsXFAPresent: boolean;
      [key: string]: unknown;
    };
    metadata: Record<string, unknown>;
    version: string;
  }

  interface PDFOptions {
    pagerender?: (pageData: Record<string, unknown>) => Promise<string>;
    max?: number;
    min?: number;
    version?: string;
  }

  function PDFParse(dataBuffer: Buffer | Uint8Array, options?: PDFOptions): Promise<PDFData>;

  export = PDFParse;
}
