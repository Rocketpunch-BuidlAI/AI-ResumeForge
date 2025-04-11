import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { FileText, Eye } from "lucide-react"
import Link from "next/link"

interface Resume {
  id: string
  fileName: string
  rewardAmount: number
  referenceCount: number
  createdAt: string
  updatedAt: string
}

interface ResumeTableProps {
  resumes: Resume[]
}

export function ResumeTable({ resumes }: ResumeTableProps) {
  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>파일</TableHead>
            <TableHead>보상 금액</TableHead>
            <TableHead>참조된 수</TableHead>
            <TableHead>생성/수정 일자</TableHead>
            <TableHead className="text-right">작업</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {resumes.map((resume) => (
            <TableRow key={resume.id}>
              <TableCell className="font-medium">
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  {resume.fileName}
                </div>
              </TableCell>
              <TableCell>{resume.rewardAmount} ETH</TableCell>
              <TableCell>{resume.referenceCount}</TableCell>
              <TableCell>
                <div className="flex flex-col">
                  <span>생성: {new Date(resume.createdAt).toLocaleDateString()}</span>
                  <span>수정: {new Date(resume.updatedAt).toLocaleDateString()}</span>
                </div>
              </TableCell>
              <TableCell className="text-right">
                <div className="flex justify-end gap-2">
                  <Button variant="outline" size="sm" asChild>
                    <Link href={`/resumes/${resume.id}`}>
                      <Eye className="h-4 w-4 mr-2" />
                      상세보기
                    </Link>
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
} 