import * as fs from 'fs';
// @ts-expect-error pdf-parse 모듈은 CommonJS 모듈이지만 ESM 스타일로 import 해야 합니다.
import pdfParse from 'pdf-parse/lib/pdf-parse.js';
import { PDFDocument, rgb, StandardFonts, PDFFont } from 'pdf-lib';
import * as path from 'path';
import * as fontkit from 'fontkit';
import * as os from 'os';

export class PdfManager {
  /**
   * PDF 파일에서 텍스트를 추출합니다.
   * @param filePath PDF 파일 경로
   * @returns 추출된 텍스트 문자열
   */
  public static async extractText(filePath: string): Promise<string> {
    try {
      // 파일 데이터 읽기
      const dataBuffer = await fs.promises.readFile(filePath);
      
      // pdf-parse 사용하여 PDF 파일에서 텍스트 추출
      const data = await pdfParse(dataBuffer);
      
      return data.text.trim();
    } catch (error) {
      console.error('PDF 텍스트 추출 중 오류 발생:', error);
      throw new Error('PDF 텍스트 추출에 실패했습니다.');
    }
  }

  /**
   * PDF 파일에서 특정 페이지의 텍스트를 추출합니다.
   * @param filePath PDF 파일 경로
   * @param pageNumber 페이지 번호 (1부터 시작)
   * @returns 추출된 텍스트 문자열
   */
  public static async extractTextFromPage(filePath: string, pageNumber: number): Promise<string> {
    try {
      const dataBuffer = await fs.promises.readFile(filePath);
      
      // pdf-parse의 옵션을 사용하여 특정 페이지만 처리
      const options = {
        max: pageNumber, // 최대 이 페이지까지 처리
        min: pageNumber, // 최소 이 페이지부터 처리
      };
      
      const data = await pdfParse(dataBuffer, options);
      
      // 페이지 텍스트 반환
      return data.text.trim();
    } catch (error) {
      console.error('PDF 페이지 텍스트 추출 중 오류 발생:', error);
      throw new Error('PDF 페이지 텍스트 추출에 실패했습니다.');
    }
  }

  /**
   * PDF 바이너리 데이터에서 텍스트를 추출합니다.
   * @param pdfBytes PDF 바이너리 데이터
   * @returns 추출된 텍스트 문자열
   */
  public static async extractTextFromBytes(pdfBytes: Uint8Array): Promise<string> {
    try {
      // 시스템 임시 디렉토리 사용
      const tempDir = path.join(os.tmpdir(), 'ai-resumeforge-tmp');
      
      // 임시 디렉토리가 없으면 생성
      if (!fs.existsSync(tempDir)) {
        fs.mkdirSync(tempDir, { recursive: true });
      }
      
      const tempFilePath = path.join(tempDir, `pdf-${Date.now()}.pdf`);
      
      try {
        // 바이너리 데이터를 임시 파일로 저장
        await fs.promises.writeFile(tempFilePath, Buffer.from(pdfBytes));
        
        // 파일에서 텍스트 추출
        const result = await this.extractText(tempFilePath);
        
        return result;
      } finally {
        // 임시 파일 삭제
        if (fs.existsSync(tempFilePath)) {
          fs.unlinkSync(tempFilePath);
        }
      }
    } catch (error) {
      console.error('PDF 텍스트 추출 중 오류 발생:', error);
      throw new Error(`PDF 텍스트 추출에 실패했습니다: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * PDF 바이너리 데이터에서 특정 페이지의 텍스트를 추출합니다.
   * @param pdfBytes PDF 바이너리 데이터
   * @param pageNumber 페이지 번호 (1부터 시작)
   * @returns 추출된 텍스트 문자열
   */
  public static async extractTextFromPageBytes(
    pdfBytes: Uint8Array,
    pageNumber: number
  ): Promise<string> {
    try {
      // 시스템 임시 디렉토리 사용
      const tempDir = path.join(os.tmpdir(), 'ai-resumeforge-tmp');
      
      // 임시 디렉토리가 없으면 생성
      if (!fs.existsSync(tempDir)) {
        fs.mkdirSync(tempDir, { recursive: true });
      }
      
      const tempFilePath = path.join(tempDir, `pdf-page-${Date.now()}.pdf`);
      
      try {
        // 바이너리 데이터를 임시 파일로 저장
        await fs.promises.writeFile(tempFilePath, Buffer.from(pdfBytes));
        
        // 특정 페이지 텍스트 추출
        const result = await this.extractTextFromPage(tempFilePath, pageNumber);
        
        return result;
      } finally {
        // 임시 파일 삭제
        if (fs.existsSync(tempFilePath)) {
          fs.unlinkSync(tempFilePath);
        }
      }
    } catch (error) {
      console.error('PDF 페이지 텍스트 추출 중 오류 발생:', error);
      throw new Error(`PDF 페이지 텍스트 추출에 실패했습니다: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * 텍스트를 PDF 바이너리로 변환합니다.
   * @param text 변환할 텍스트
   * @param options PDF 생성 옵션
   * @returns 생성된 PDF 바이너리 데이터
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
      // 기본 옵션 설정
      const {
        fontSize = 12,
        lineHeight = 1.5,
        margin = 50,
        fontPath = path.join(process.cwd(), 'public', 'fonts', 'arial.ttf'),
      } = options;

      // 새 PDF 문서 생성
      const pdfDoc = await PDFDocument.create();

      // fontkit 등록
      pdfDoc.registerFontkit(fontkit);

      // 페이지 크기 설정 (A4)
      const pageWidth = 595.28;
      const pageHeight = 841.89;

      // 페이지 추가
      let currentPage = pdfDoc.addPage([pageWidth, pageHeight]);

      // 폰트 로드
      let fontObj: PDFFont;
      try {
        // 한글 폰트 파일 로드
        const fontBytes = await fs.promises.readFile(fontPath);
        fontObj = await pdfDoc.embedFont(fontBytes);
      } catch (error) {
        console.error('한글 폰트 로드 실패, 기본 폰트 사용:', error);
        // 폰트 로드 실패 시 기본 폰트 사용
        fontObj = await pdfDoc.embedFont(StandardFonts.Helvetica);
      }

      // 텍스트를 줄 단위로 분리 (원본 줄바꿈 유지)
      const originalLines = text.split('\n');
      const processedLines: string[] = [];

      // 각 줄에 대해 너비에 맞게 처리
      const maxWidth = pageWidth - margin * 2;
      for (const line of originalLines) {
        // 각 줄을 단어 단위로 분리
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
              // 단어가 너무 길면 강제로 줄바꿈
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

        // 원본 줄바꿈 추가 (빈 줄 추가하지 않음)
        if (line !== originalLines[originalLines.length - 1]) {
          processedLines.push('');
        }
      }

      // 텍스트 그리기
      let y = pageHeight - margin;
      for (const line of processedLines) {
        // 빈 줄은 줄 간격만큼만 이동
        if (!line) {
          y -= fontSize * lineHeight;
          continue;
        }

        // 페이지가 부족하면 새 페이지 추가
        if (y < margin + fontSize) {
          currentPage = pdfDoc.addPage([pageWidth, pageHeight]);
          y = pageHeight - margin;
        }

        // 텍스트 그리기
        currentPage.drawText(line, {
          x: margin,
          y,
          size: fontSize,
          font: fontObj,
          color: rgb(0, 0, 0),
        });

        // 다음 줄 위치 계산
        y -= fontSize * lineHeight;
      }

      // PDF 바이너리 반환
      return await pdfDoc.save();
    } catch (error) {
      console.error('PDF 생성 중 오류 발생:', error);
      throw new Error('PDF 생성에 실패했습니다.');
    }
  }

  /**
   * 텍스트를 PDF 파일로 변환합니다.
   * @param text 변환할 텍스트
   * @param outputPath 출력 PDF 파일 경로
   * @param options PDF 생성 옵션
   * @returns 생성된 PDF 파일 경로
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
      // PDF 바이너리 생성
      const pdfBytes = await this.createPdfFromText(text, options);

      // 파일로 저장
      await fs.promises.writeFile(outputPath, pdfBytes);

      return outputPath;
    } catch (error) {
      console.error('PDF 파일 생성 중 오류 발생:', error);
      throw new Error('PDF 파일 생성에 실패했습니다.');
    }
  }
}
