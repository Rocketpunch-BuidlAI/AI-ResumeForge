import * as fs from 'fs';
// @ts-expect-error pdf-parse module is a CommonJS module but needs to be imported in ESM style.
import pdfParse from 'pdf-parse/lib/pdf-parse.js';
import { PDFDocument, rgb, StandardFonts, PDFFont } from 'pdf-lib';
import * as path from 'path';
import * as fontkit from 'fontkit';
import * as os from 'os';

export class PdfManager {
  /**
   * Extracts text from a PDF file.
   * @param filePath PDF file path
   * @returns Extracted text string
   */
  public static async extractText(filePath: string): Promise<string> {
    try {
      // Read file data
      const dataBuffer = await fs.promises.readFile(filePath);

      // Use pdf-parse to extract text from PDF file
      const data = await pdfParse(dataBuffer);

      return data.text.trim();
    } catch (error) {
      console.error('Error extracting PDF text:', error);
      throw new Error('Failed to extract PDF text.');
    }
  }

  /**
   * Extracts text from a specific page of a PDF file.
   * @param filePath PDF file path
   * @param pageNumber Page number (1-based)
   * @returns Extracted text string
   */
  public static async extractTextFromPage(filePath: string, pageNumber: number): Promise<string> {
    try {
      const dataBuffer = await fs.promises.readFile(filePath);

      // Use pdf-parse options to process only the specified page
      const options = {
        max: pageNumber, // Process up to this page
        min: pageNumber, // Process from this page onwards
      };

      const data = await pdfParse(dataBuffer, options);

      // Return page text
      return data.text.trim();
    } catch (error) {
      console.error('Error extracting PDF page text:', error);
      throw new Error('Failed to extract PDF page text.');
    }
  }

  /**
   * Extracts text from a PDF binary.
   * @param pdfBytes PDF binary data
   * @returns Extracted text string
   */
  public static async extractTextFromBytes(pdfBytes: Uint8Array): Promise<string> {
    try {
      // Use system temporary directory
      const tempDir = path.join(os.tmpdir(), 'ai-resumeforge-tmp');

      // Create directory if it doesn't exist
      if (!fs.existsSync(tempDir)) {
        fs.mkdirSync(tempDir, { recursive: true });
      }

      const tempFilePath = path.join(tempDir, `pdf-${Date.now()}.pdf`);

      try {
        // Save binary data to temporary file
        await fs.promises.writeFile(tempFilePath, Buffer.from(pdfBytes));

        // Extract text from file
        const result = await this.extractText(tempFilePath);

        return result;
      } finally {
        // Delete temporary file
        if (fs.existsSync(tempFilePath)) {
          fs.unlinkSync(tempFilePath);
        }
      }
    } catch (error) {
      console.error('Error extracting PDF text:', error);
      throw new Error(
        `Failed to extract PDF text: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  /**
   * Extracts text from a specific page of a PDF binary.
   * @param pdfBytes PDF binary data
   * @param pageNumber Page number (1-based)
   * @returns Extracted text string
   */
  public static async extractTextFromPageBytes(
    pdfBytes: Uint8Array,
    pageNumber: number
  ): Promise<string> {
    try {
      // Use system temporary directory
      const tempDir = path.join(os.tmpdir(), 'ai-resumeforge-tmp');

      // Create directory if it doesn't exist
      if (!fs.existsSync(tempDir)) {
        fs.mkdirSync(tempDir, { recursive: true });
      }

      const tempFilePath = path.join(tempDir, `pdf-page-${Date.now()}.pdf`);

      try {
        // Save binary data to temporary file
        await fs.promises.writeFile(tempFilePath, Buffer.from(pdfBytes));

        // Extract specific page text
        const result = await this.extractTextFromPage(tempFilePath, pageNumber);

        return result;
      } finally {
        // Delete temporary file
        if (fs.existsSync(tempFilePath)) {
          fs.unlinkSync(tempFilePath);
        }
      }
    } catch (error) {
      console.error('Error extracting PDF page text:', error);
      throw new Error(
        `Failed to extract PDF page text: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  /**
   * Converts text to a PDF binary.
   * @param text Text to convert
   * @param options PDF generation options
   * @returns Generated PDF binary data
   */
  public static async createPdfFromText(
    text: string,
    options: {
      fontSize?: number;
      lineHeight?: number;
      margin?: number;
      fontPath?: string;
    } = {}
  ): Promise<Uint8Array> {
    try {
      // Default options
      const {
        fontSize = 12,
        lineHeight = 1.5,
        margin = 50,
        fontPath = path.join(process.cwd(), 'public', 'fonts', 'arial.ttf'),
      } = options;

      // Create new PDF document
      const pdfDoc = await PDFDocument.create();

      // Register fontkit
      pdfDoc.registerFontkit(fontkit);

      // Set page size (A4)
      const pageWidth = 595.28;
      const pageHeight = 841.89;

      // Add page
      let currentPage = pdfDoc.addPage([pageWidth, pageHeight]);

      // Load font
      let fontObj: PDFFont;
      try {
        // Load font file
        const fontBytes = await fs.promises.readFile(fontPath);
        fontObj = await pdfDoc.embedFont(fontBytes);
      } catch (error) {
        console.error('Failed to load font, using default font:', error);
        // Use default font if font loading fails
        fontObj = await pdfDoc.embedFont(StandardFonts.Helvetica);
      }

      // Split text into lines (preserve original line breaks)
      const originalLines = text.split('\n');
      const processedLines: string[] = [];

      // Process each line to fit within width
      const maxWidth = pageWidth - margin * 2;
      for (const line of originalLines) {
        // Split line into words
        const words = line.split(/\s+/);
        let currentLine = '';

        for (const word of words) {
          const testLine = currentLine ? `${currentLine} ${word}` : word;
          const width = fontObj.widthOfTextAtSize(testLine, fontSize);

          if (width > maxWidth) {
            if (currentLine) {
              processedLines.push(currentLine);
              currentLine = word;
            } else {
              // If word is too long, force line break
              processedLines.push(word);
              currentLine = '';
            }
          } else {
            currentLine = testLine;
          }
        }

        if (currentLine) {
          processedLines.push(currentLine);
        }

        // Add original line break (no empty line added)
        if (line !== originalLines[originalLines.length - 1]) {
          processedLines.push('');
        }
      }

      // Draw text
      let y = pageHeight - margin;
      for (const line of processedLines) {
        // Move only by line spacing if empty line
        if (!line) {
          y -= fontSize * lineHeight;
          continue;
        }

        // Add new page if page is insufficient
        if (y < margin + fontSize) {
          currentPage = pdfDoc.addPage([pageWidth, pageHeight]);
          y = pageHeight - margin;
        }

        // Draw text
        currentPage.drawText(line, {
          x: margin,
          y,
          size: fontSize,
          font: fontObj,
          color: rgb(0, 0, 0),
        });

        // Calculate next line position
        y -= fontSize * lineHeight;
      }

      // PDF binary returned
      return await pdfDoc.save();
    } catch (error) {
      console.error('Error creating PDF:', error);
      throw new Error('Failed to create PDF.');
    }
  }

  /**
   * Converts text to a PDF file.
   * @param text Text to convert
   * @param outputPath Output PDF file path
   * @param options PDF generation options
   * @returns Generated PDF file path
   */
  public static async createPdfFileFromText(
    text: string,
    outputPath: string,
    options: {
      fontSize?: number;
      lineHeight?: number;
      margin?: number;
      fontPath?: string;
    } = {}
  ): Promise<string> {
    try {
      // Generate PDF binary
      const pdfBytes = await this.createPdfFromText(text, options);

      // Save to file
      await fs.promises.writeFile(outputPath, pdfBytes);

      return outputPath;
    } catch (error) {
      console.error('Error creating PDF file:', error);
      throw new Error('Failed to create PDF file.');
    }
  }
}
