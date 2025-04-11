'use client';

import { useState } from 'react';

export default function Home() {
  const [file, setFile] = useState<File>();
  const [url, setUrl] = useState('');
  const [cid, setCid] = useState('');
  const [uploading, setUploading] = useState(false);

  const uploadFile = async () => {
    try {
      if (!file) {
        alert('Please select a file');
        return;
      }

      setUploading(true);
      const data = new FormData();
      data.set('file', file);
      data.set('userId', '13');
      const uploadRequest = await fetch('/api/pinata', {
        method: 'POST',
        body: data,
      });
      const response = await uploadRequest.json();
      setUrl(response.url);
      setCid(response.cid);
      setUploading(false);
    } catch (e) {
      console.log(e);
      setUploading(false);
      alert('Error occurred while uploading');
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFile(e.target?.files?.[0]);
  };

  return (
    <div className="grid min-h-screen grid-rows-[20px_1fr_20px] items-center justify-items-center gap-16 p-8 pb-20 sm:p-20">
      <main className="row-start-2 flex flex-col items-center gap-8">
        <h1 className="text-2xl font-bold">PDF File Upload</h1>
        <div className="flex flex-col items-center gap-4">
          <label className="flex cursor-pointer flex-col items-center gap-2">
            <span className="text-sm text-gray-500">{file ? file.name : 'Select a PDF file'}</span>
            <input type="file" onChange={handleChange} accept=".pdf" className="hidden" />
          </label>
          <button
            className="bg-foreground text-background flex h-10 items-center justify-center gap-2 rounded-full border border-solid border-transparent px-4 text-sm font-medium transition-colors hover:bg-[#383838] sm:h-12 sm:w-auto sm:px-5 sm:text-base dark:hover:bg-[#ccc]"
            type="button"
            disabled={uploading}
            onClick={uploadFile}
          >
            {uploading ? 'Uploading...' : 'Upload'}
          </button>
        </div>
        {url && (
          <div className="mt-4 text-center">
            <p className="mb-2 text-sm text-gray-500">Uploaded file URL:</p>
            <a
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-500 hover:underline"
            >
              {url}
            </a>
            <p className="mt-2 text-sm text-gray-500">CID: {cid}</p>
          </div>
        )}
      </main>
    </div>
  );
}
