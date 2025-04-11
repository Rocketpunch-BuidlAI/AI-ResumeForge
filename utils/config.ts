import { PinataSDK } from 'pinata';

export const pinata = new PinataSDK({
  pinataJwt: process.env.PINATA_JWT,
  pinataGateway: process.env.NEXT_PUBLIC_GATEWAY_URL,
});

// 메타데이터 타입 정의
export interface PinataMetadata {
  name: string;
  keyvalues: {
    referenceCids: string[];
  };
}

// 업로드 옵션 타입 정의
export interface UploadOptions {
  pinataMetadata?: PinataMetadata;
}
