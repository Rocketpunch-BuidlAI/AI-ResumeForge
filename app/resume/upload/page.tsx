"use client"

import { useState, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Upload, FileText } from "lucide-react"
import { cn } from "@/lib/utils"

export default function ResumeUploadPage() {
  const [file, setFile] = useState<File | null>(null)
  const [isDragging, setIsDragging] = useState(false)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0])
    }
  }

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setFile(e.dataTransfer.files[0])
    }
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!file) return

    // TODO: 파일 업로드 API 연동
    console.log("File to upload:", file)
  }

  return (
    <div className="container mx-auto py-8 w-full max-w-2xl">
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl font-bold">Resume Upload</CardTitle>
          <CardDescription className="text-base">
            Upload your existing resume to receive AI analysis.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div
              className={cn(
                "border-2 border-dashed rounded-lg p-8 text-center transition-colors",
                isDragging ? "border-primary bg-primary/5" : "border-muted-foreground/25",
                "hover:border-primary hover:bg-primary/5 cursor-pointer"
              )}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
            >
              <div className="flex flex-col items-center gap-2">
                <Upload className="h-10 w-10 text-muted-foreground" />
                <div className="text-sm text-muted-foreground">
                  <p>Drag and drop your file here or</p>
                  <p>click the button below to upload</p>
                </div>
                <Input
                  id="file"
                  type="file"
                  accept=".pdf,.doc,.docx"
                  onChange={handleFileChange}
                  className="hidden"
                />
                <Button
                  variant="outline"
                  onClick={() => document.getElementById("file")?.click()}
                >
                  파일 선택
                </Button>
              </div>
            </div>

            {file && (
              <div className="flex items-center gap-2 p-3 border rounded-lg">
                <FileText className="h-5 w-5 text-muted-foreground" />
                <span className="text-sm font-medium">{file.name}</span>
              </div>
            )}

            <Button type="submit" className="w-full" disabled={!file}>
              Upload
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
} 