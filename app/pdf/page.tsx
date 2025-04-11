"use client";

import { useState } from "react";

export default function Home() {
  const [file, setFile] = useState<File>();
  const [url, setUrl] = useState("");
  const [cid, setCid] = useState("");
  const [uploading, setUploading] = useState(false);

  const uploadFile = async () => {
    try {
      if (!file) {
        alert("파일을 올려주세요");
        return;
      }

      setUploading(true);
      const data = new FormData();
      data.set("file", file);
      data.set("userId", "13"); // TODO : 유저 id 받아오기
      const uploadRequest = await fetch("/api/pinata", {
        method: "POST",
        body: data,
      });
      const response = await uploadRequest.json();
      setUrl(response.url);
      setCid(response.cid);
      setUploading(false);
    } catch (e) {
      console.log(e);
      setUploading(false);
      alert("업로드 중 오류 발생");
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFile(e.target?.files?.[0]);
  };

  return (
    <div className="grid grid-rows-[20px_1fr_20px] items-center justify-items-center min-h-screen p-8 pb-20 gap-16 sm:p-20">
      <main className="flex flex-col gap-8 row-start-2 items-center">
        <h1 className="text-2xl font-bold">PDF 파일 업로드</h1>
        <div className="flex flex-col items-center gap-4">
          <label className="flex flex-col items-center gap-2 cursor-pointer">
            <span className="text-sm text-gray-500">
              {file ? file.name : "PDF 파일을 선택하세요"}
            </span>
            <input 
              type="file" 
              onChange={handleChange} 
              accept=".pdf"
              className="hidden"
            />
          </label>
          <button 
            className="rounded-full border border-solid border-transparent transition-colors flex items-center justify-center bg-foreground text-background gap-2 hover:bg-[#383838] dark:hover:bg-[#ccc] font-medium text-sm sm:text-base h-10 sm:h-12 px-4 sm:px-5 sm:w-auto" 
            type="button" 
            disabled={uploading} 
            onClick={uploadFile}
          >
            {uploading ? "업로드 중..." : "업로드"}
          </button>
        </div>
        {url && (
          <div className="mt-4 text-center">
            <p className="text-sm text-gray-500 mb-2">업로드된 파일 URL:</p>
            <a 
              href={url} 
              target="_blank" 
              rel="noopener noreferrer" 
              className="text-blue-500 hover:underline"
            >
              {url}
            </a>
            <p className="text-sm text-gray-500 mt-2">CID: {cid}</p>
          </div>
        )}
      </main>
    </div>
  );
}