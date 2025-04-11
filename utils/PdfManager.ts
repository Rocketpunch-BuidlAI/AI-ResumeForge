import * as fs from 'fs';
import pdfTextExtract from 'pdf-text-extract';
import { PDFDocument, rgb, StandardFonts, PDFFont } from 'pdf-lib';
import * as path from 'path';
import * as fontkit from 'fontkit';

export class PdfManager {
  /**
   * PDF 파일에서 텍스트를 추출합니다.
   * @param filePath PDF 파일 경로
   * @returns 추출된 텍스트 문자열
   */
  public static async extractText(filePath: string): Promise<string> {
    try {
      // pdf-text-extract를 사용하여 PDF 파일에서 텍스트 추출
      return new Promise((resolve, reject) => {
        pdfTextExtract(filePath, (error: Error | null, pages: string[]) => {
          if (error) {
            console.error('PDF 텍스트 추출 중 오류 발생:', error);
            reject(new Error('PDF 텍스트 추출에 실패했습니다.'));
            return;
          }
          
          // 모든 페이지의 텍스트를 하나의 문자열로 결합
          const extractedText = pages.join('\n\n');
          resolve(extractedText.trim());
        });
      });
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
      // pdf-text-extract를 사용하여 PDF 파일에서 텍스트 추출
      return new Promise((resolve, reject) => {
        pdfTextExtract(filePath, (error: Error | null, pages: string[]) => {
          if (error) {
            console.error('PDF 페이지 텍스트 추출 중 오류 발생:', error);
            reject(new Error('PDF 페이지 텍스트 추출에 실패했습니다.'));
            return;
          }
          
          // 페이지 번호 유효성 검사
          if (pageNumber < 1 || pageNumber > pages.length) {
            reject(new Error(`유효하지 않은 페이지 번호입니다. (1-${pages.length})`));
            return;
          }
          
          // 특정 페이지의 텍스트 반환
          resolve(pages[pageNumber - 1].trim());
        });
      });
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
      // 임시 파일 생성
      const tempFilePath = `/tmp/pdf-${Date.now()}.pdf`;
      await fs.promises.writeFile(tempFilePath, pdfBytes);
      
      try {
        // 임시 파일에서 텍스트 추출
        const extractedText = await this.extractText(tempFilePath);
        return extractedText;
      } finally {
        // 임시 파일 삭제
        await fs.promises.unlink(tempFilePath).catch(err => {
          console.error('임시 파일 삭제 중 오류 발생:', err);
        });
      }
    } catch (error) {
      console.error('PDF 텍스트 추출 중 오류 발생:', error);
      throw new Error('PDF 텍스트 추출에 실패했습니다.');
    }
  }
  
  /**
   * PDF 파일 경로에서 텍스트를 추출합니다.
   * @param filePath PDF 파일 경로
   * @returns 추출된 텍스트 문자열
   */
  public static async extractTextFromFile(filePath: string): Promise<string> {
    return this.extractText(filePath);
  }
  
  /**
   * PDF 바이너리 데이터에서 특정 페이지의 텍스트를 추출합니다.
   * @param pdfBytes PDF 바이너리 데이터
   * @param pageNumber 페이지 번호 (1부터 시작)
   * @returns 추출된 텍스트 문자열
   */
  public static async extractTextFromPageBytes(pdfBytes: Uint8Array, pageNumber: number): Promise<string> {
    try {
      // 임시 파일 생성
      const tempFilePath = `/tmp/pdf-${Date.now()}.pdf`;
      await fs.promises.writeFile(tempFilePath, pdfBytes);
      
      try {
        // 임시 파일에서 특정 페이지 텍스트 추출
        const extractedText = await this.extractTextFromPage(tempFilePath, pageNumber);
        return extractedText;
      } finally {
        // 임시 파일 삭제
        await fs.promises.unlink(tempFilePath).catch(err => {
          console.error('임시 파일 삭제 중 오류 발생:', err);
        });
      }
    } catch (error) {
      console.error('PDF 페이지 텍스트 추출 중 오류 발생:', error);
      throw new Error('PDF 페이지 텍스트 추출에 실패했습니다.');
    }
  }
  
  /**
   * PDF 파일 경로에서 특정 페이지의 텍스트를 추출합니다.
   * @param filePath PDF 파일 경로
   * @param pageNumber 페이지 번호 (1부터 시작)
   * @returns 추출된 텍스트 문자열
   */
  public static async extractTextFromPageFile(filePath: string, pageNumber: number): Promise<string> {
    return this.extractTextFromPage(filePath, pageNumber);
  }
  
  /**
   * 텍스트를 PDF 파일로 변환합니다.
   * @param text 변환할 텍스트
   * @param outputPath 출력 PDF 파일 경로
   * @param options PDF 생성 옵션
   * @returns 생성된 PDF 파일 경로
   */
  public static async createPdfFromText(
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
      // 기본 옵션 설정
      const {
        fontSize = 12,
        lineHeight = 1.5,
        margin = 50,
        fontPath = path.join(process.cwd(), 'public', 'fonts', 'arial.ttf')
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
      const maxWidth = pageWidth - (margin * 2);
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
          color: rgb(0, 0, 0)
        });
        
        // 다음 줄 위치 계산
        y -= fontSize * lineHeight;
      }
      
      // PDF 파일 저장
      const pdfBytes = await pdfDoc.save();
      await fs.promises.writeFile(outputPath, pdfBytes);
      
      return outputPath;
    } catch (error) {
      console.error('PDF 생성 중 오류 발생:', error);
      throw new Error('PDF 생성에 실패했습니다.');
    }
  }
}
