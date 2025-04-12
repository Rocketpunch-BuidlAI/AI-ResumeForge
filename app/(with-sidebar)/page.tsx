'use client';

import { useState, useEffect } from 'react';
import { WalletInfo } from '@/components/wallet-info';
import { RewardChart } from '@/components/reward-chart';
import { FileText, DownloadCloud, Briefcase, Eye, BarChart, FileUp, Loader2 } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import FilePreview from '@/lib/pdf/FilePreview';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import getSession from '@/utils/getSession';

// Resume type definitions
interface ResumeMetadata {
  jobTitle: string;
  companyName: string;
  yearsOfExperience: string;
  skills: string;
  additionalInfo: string;
  jobCategory?: string;
  jobSubcategory?: string;
  jobSpecific?: string;
  fileName?: string;
  fileSize?: number;
  fileType?: string;
  uploadDate?: string;
}

interface UploadedResume {
  id: string;
  fileName: string;
  fileUrl: string;
  rewardAmount: number;
  referenceCount: number;
  createdAt: string;
  updatedAt: string;
  metadata: ResumeMetadata;
  jobCategory?: string;
  jobSubcategory?: string;
  jobSpecific?: string;
}

interface AIGeneratedResume {
  id: string;
  name: string;
  reference: number;
  icon: string;
  createdAt: string;
  description: string;
}

// Define interface for the API response
interface CoverletterResponse {
  id: number;
  userId: number;
  cid: string;
  filePath: string;
  jobTitle?: string;
  companyName?: string;
  yearsOfExperience?: string;
  skills?: string;
  additionalInfo?: string;
  fileName?: string;
  fileSize?: number;
  fileType?: string;
  jobCategory?: string;
  jobSubcategory?: string;
  jobSpecific?: string;
  metadata?: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

// Fallback mock data in case API fails
const fallbackResumes: UploadedResume[] = [
  {
    id: '1',
    fileName: 'Frontend Developer Resume.pdf',
    fileUrl: '/path/to/resume1.pdf',
    rewardAmount: 0.5,
    referenceCount: 10,
    createdAt: '2024-04-01',
    updatedAt: '2024-04-10',
    metadata: {
      jobTitle: 'Frontend Developer',
      companyName: 'ABC Tech',
      yearsOfExperience: '3-5 years',
      skills: 'React, TypeScript, Next.js',
      additionalInfo: 'Experienced frontend specialist with various project experiences',
    },
  },
  {
    id: '2',
    fileName: 'Backend Developer Resume.pdf',
    fileUrl: '/path/to/resume2.pdf',
    rewardAmount: 0.3,
    referenceCount: 5,
    createdAt: '2024-04-05',
    updatedAt: '2024-04-08',
    metadata: {
      jobTitle: 'Backend Developer',
      companyName: 'XYZ Solutions',
      yearsOfExperience: '1-2 years',
      skills: 'Node.js, Express, MongoDB',
      additionalInfo: 'Experience in backend system development and maintenance',
    },
  },
];

// Sample data - AI generated resumes
const mockAIGeneratedResumes: AIGeneratedResume[] = [
  {
    id: '1',
    name: 'Software Developer Resume',
    reference: 65,
    icon: '💻',
    createdAt: '2024-04-11',
    description: 'Resume focused on technical stack and development experience.',
  },
  {
    id: '2',
    name: 'Frontend Expert Resume',
    reference: 25,
    icon: '🎨',
    createdAt: '2024-04-12',
    description: 'Resume emphasizing UI/UX design experience and frontend technologies.',
  },
  {
    id: '3',
    name: 'UX/UI Designer Resume',
    reference: 10,
    icon: '🖌️',
    createdAt: '2024-04-10',
    description: 'Resume highlighting user experience and design philosophy.',
  },
];

const mockRewardData = [
  { date: '2024-04-01', amount: 0.5 },
  { date: '2024-04-05', amount: 0.3 },
  { date: '2024-04-10', amount: 0.2 },
];

export default function Page() {
  const [selectedResume, setSelectedResume] = useState<UploadedResume | null>(null);
  const [previewFile, setPreviewFile] = useState<File | null>(null);
  const [uploadedResumes, setUploadedResumes] = useState<UploadedResume[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch user's resumes from API
  useEffect(() => {
    const fetchResumes = async () => {
      setIsLoading(true);
      setError(null);

      try {
        // Replace this with the actual user ID (can be from a session/auth context)
        const session = await getSession();
        const userId = session?.user?.id;
        console.log(userId);

        const response = await fetch(`/api/resumes?userId=${userId}`);

        if (!response.ok) {
          throw new Error(`Failed to fetch resumes: ${response.statusText}`);
        }

        const data = await response.json();

        console.log('data', data);

        // Transform data to match UploadedResume interface if needed
        const transformedResumes: UploadedResume[] = data.resumes.map(
          (resume: CoverletterResponse) => ({
            id: resume.id.toString(),
            fileName: resume.fileName || `Resume_${resume.id}.pdf`,
            fileUrl: resume.filePath,
            rewardAmount: 0, // Set default or calculate from data
            referenceCount: 0, // Set default or calculate from data
            createdAt: resume.created_at,
            updatedAt: resume.updated_at,
            jobCategory: resume.jobCategory,
            jobSubcategory: resume.jobSubcategory,
            jobSpecific: resume.jobSpecific,
            metadata: {
              jobTitle: resume.jobTitle || '',
              companyName: resume.companyName || '',
              yearsOfExperience: resume.yearsOfExperience || '',
              skills: resume.skills || '',
              additionalInfo: resume.additionalInfo || '',
              jobCategory: resume.jobCategory || '',
              jobSubcategory: resume.jobSubcategory || '',
              jobSpecific: resume.jobSpecific || '',
              fileName: resume.fileName,
              fileSize: resume.fileSize,
              fileType: resume.fileType,
              uploadDate: (resume.metadata?.uploadDate as string) || resume.created_at,
            },
          })
        );

        setUploadedResumes(transformedResumes);
      } catch (err) {
        console.error('Error fetching resumes:', err);
        setError('Failed to load resumes. Using fallback data.');
        // Use fallback data if API fails
        setUploadedResumes(fallbackResumes);
      } finally {
        setIsLoading(false);
      }
    };

    fetchResumes();
  }, []);

  // Create a mock file for demonstration purposes
  useEffect(() => {
    if (selectedResume) {
      // Instead of creating an empty PDF blob, we'll use the actual PDF URL
      fetch(selectedResume.fileUrl)
        .then((response) => response.blob())
        .then((pdfBlob) => {
          const file = new File([pdfBlob], selectedResume.fileName, {
            type: 'application/pdf',
          });
          setPreviewFile(file);
        })
        .catch((error) => {
          console.error('Error fetching PDF file:', error);
          setError('Failed to load PDF preview');
        });
    }
  }, [selectedResume]);

  // In a real implementation, you would need to fetch the actual file from an API
  const handleViewFile = (resume: UploadedResume) => {
    setSelectedResume(resume);

    // In a real API, you would fetch the file like this:
    // const fetchFile = async () => {
    //   const response = await fetch(`/api/files/${resume.id}`);
    //   const blob = await response.blob();
    //   const file = new File([blob], resume.fileName, { type: 'application/pdf' });
    //   setPreviewFile(file);
    // };
    // fetchFile();
  };

  // Resumes to display - either from API or fallback
  const resumes = uploadedResumes.length > 0 ? uploadedResumes : fallbackResumes;

  return (
    <div className="flex flex-1 flex-col gap-4 p-4 md:p-6">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <WalletInfo address="0x1234...5678" totalReward={1.0} />

        <Card className="p-4">
          <CardHeader className="p-0 pb-3">
            <CardTitle className="flex items-center gap-2 text-xl">
              <BarChart className="h-5 w-5" />
              Reward History
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <RewardChart data={mockRewardData} />
          </CardContent>
        </Card>

        <Card className="p-4">
          <CardHeader className="p-0 pb-3">
            <CardTitle className="flex items-center gap-2 text-xl">
              <FileUp className="h-5 w-5" />
              Resume Statistics
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-muted/30 flex flex-col items-center justify-center rounded-lg p-4">
                <p className="text-muted-foreground text-sm">Uploaded Resumes</p>
                <p className="text-3xl font-bold">{resumes.length}</p>
              </div>
              <div className="bg-muted/30 flex flex-col items-center justify-center rounded-lg p-4">
                <p className="text-muted-foreground text-sm">AI Generated Resumes</p>
                <p className="text-3xl font-bold">{mockAIGeneratedResumes.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="uploaded" className="w-full">
        <TabsList className="mb-4 grid w-full grid-cols-2">
          <TabsTrigger value="uploaded" className="text-base">
            My Uploaded Resumes
          </TabsTrigger>
          <TabsTrigger value="ai-generated" className="text-base">
            AI Generated Resumes
          </TabsTrigger>
        </TabsList>

        <TabsContent value="uploaded" className="m-0">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle>Uploaded Resumes List</CardTitle>
              <CardDescription>
                List of resumes I&apos;ve uploaded. Click on a file to view details.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              {error && (
                <Alert variant="destructive" className="mb-4">
                  <AlertTitle>Error</AlertTitle>
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              {isLoading ? (
                <div className="flex items-center justify-center p-12">
                  <Loader2 className="text-primary h-8 w-8 animate-spin" />
                  <span className="ml-2">Loading your resumes...</span>
                </div>
              ) : resumes.length === 0 ? (
                <div className="flex flex-col items-center justify-center p-12 text-center">
                  <FileText className="text-muted-foreground/60 mb-4 h-16 w-16" />
                  <h3 className="mb-2 text-lg font-medium">No Resumes Found</h3>
                  <p className="text-muted-foreground text-sm">
                    You haven&apos;t uploaded any resumes yet.
                  </p>
                  <Button className="mt-4">
                    <FileUp className="mr-2 h-4 w-4" />
                    Upload a Resume
                  </Button>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[250px]">Filename</TableHead>
                      <TableHead>Metadata</TableHead>
                      <TableHead className="text-center">Reward Amount</TableHead>
                      <TableHead className="text-center">Reference Count</TableHead>
                      <TableHead className="text-center">Creation Date</TableHead>
                      <TableHead className="w-[100px] text-center">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {resumes.map((resume) => (
                      <TableRow key={resume.id}>
                        <TableCell>
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button
                                variant="link"
                                className="flex items-center gap-2 p-0 text-left font-medium"
                                onClick={() => handleViewFile(resume)}
                              >
                                <FileText className="h-4 w-4" />
                                {resume.fileName}
                              </Button>
                            </DialogTrigger>
                            <DialogContent
                              className="!important max-h-[90vh] w-full max-w-[95vw] overflow-hidden"
                              style={{
                                maxWidth: '40vw',
                                width: '40vw',
                                maxHeight: '90vh',
                                height: '90vh',
                              }}
                            >
                              <DialogHeader>
                                <DialogTitle className="flex items-center gap-2">
                                  <FileText className="h-5 w-5" />
                                  {selectedResume?.fileName}
                                </DialogTitle>
                                <DialogDescription>
                                  {selectedResume?.createdAt
                                    ? new Date(selectedResume.createdAt).toLocaleDateString(
                                        'en-US',
                                        { year: 'numeric', month: 'numeric', day: 'numeric' }
                                      )
                                    : ''}{' '}
                                  Uploaded
                                </DialogDescription>
                              </DialogHeader>
                              <div className="h-[75vh] overflow-hidden rounded-md border">
                                <FilePreview file={previewFile} />
                              </div>
                              <DialogFooter>
                                <Button
                                  variant="outline"
                                  onClick={() => window.open(selectedResume?.fileUrl)}
                                >
                                  <DownloadCloud className="mr-2 h-4 w-4" />
                                  Download
                                </Button>
                                <DialogClose asChild>
                                  <Button>Close</Button>
                                </DialogClose>
                              </DialogFooter>
                            </DialogContent>
                          </Dialog>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-col gap-1 text-sm">
                            <div className="flex items-center gap-1">
                              <Briefcase className="text-muted-foreground h-3 w-3" />
                              {resume.metadata.jobSpecific ? (
                                <>
                                  <span>{resume.metadata.jobSpecific}</span>
                                  {resume.metadata.companyName && (
                                    <>
                                      <span className="text-muted-foreground mx-1">|</span>
                                      <span>{resume.metadata.companyName}</span>
                                    </>
                                  )}
                                </>
                              ) : (
                                <>
                                  <span>{resume.metadata.jobTitle}</span>
                                  {resume.metadata.companyName && (
                                    <>
                                      <span className="text-muted-foreground mx-1">|</span>
                                      <span>{resume.metadata.companyName}</span>
                                    </>
                                  )}
                                </>
                              )}
                            </div>
                            <div className="mt-1 flex flex-wrap gap-1">
                              {resume.metadata.skills.split(',').map((skill, idx) => (
                                <Badge
                                  key={idx}
                                  variant="secondary"
                                  className="text-xs font-normal"
                                >
                                  {skill.trim()}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="text-center font-medium">
                          {resume.rewardAmount} ETH
                        </TableCell>
                        <TableCell className="text-center">{resume.referenceCount} times</TableCell>
                        <TableCell className="text-center">
                          {new Date(resume.createdAt).toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'numeric',
                            day: 'numeric',
                          })}
                        </TableCell>
                        <TableCell className="text-center">
                          <div className="flex justify-center gap-2">
                            <Dialog>
                              <DialogTrigger asChild>
                                <Button
                                  variant="outline"
                                  size="icon"
                                  className="h-8 w-8"
                                  onClick={() => handleViewFile(resume)}
                                >
                                  <TooltipProvider>
                                    <Tooltip>
                                      <TooltipTrigger asChild>
                                        <Eye className="h-4 w-4" />
                                      </TooltipTrigger>
                                      <TooltipContent>View Details</TooltipContent>
                                    </Tooltip>
                                  </TooltipProvider>
                                </Button>
                              </DialogTrigger>
                              <DialogContent
                                className="!important max-h-[90vh] w-full max-w-[95vw] overflow-hidden"
                                style={{ maxWidth: '95vw', width: '95vw' }}
                              >
                                <DialogHeader>
                                  <DialogTitle className="flex items-center gap-2">
                                    <FileText className="h-5 w-5" />
                                    {selectedResume?.fileName}
                                  </DialogTitle>
                                  <DialogDescription>
                                    {selectedResume?.createdAt
                                      ? new Date(selectedResume.createdAt).toLocaleDateString(
                                          'en-US',
                                          { year: 'numeric', month: 'numeric', day: 'numeric' }
                                        )
                                      : ''}{' '}
                                    Uploaded
                                  </DialogDescription>
                                </DialogHeader>
                                <div className="h-[75vh] overflow-hidden rounded-md border">
                                  <FilePreview file={previewFile} />
                                </div>
                                <DialogFooter>
                                  <Button
                                    variant="outline"
                                    onClick={() => window.open(selectedResume?.fileUrl)}
                                  >
                                    <DownloadCloud className="mr-2 h-4 w-4" />
                                    Download
                                  </Button>
                                  <DialogClose asChild>
                                    <Button>Close</Button>
                                  </DialogClose>
                                </DialogFooter>
                              </DialogContent>
                            </Dialog>
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button
                                    variant="outline"
                                    size="icon"
                                    className="h-8 w-8"
                                    onClick={() => window.open(resume.fileUrl)}
                                  >
                                    <DownloadCloud className="h-4 w-4" />
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>Download</TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="ai-generated" className="m-0">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle>AI Generated Resume List</CardTitle>
              <CardDescription>
                List of resumes generated using AI. Click to view content.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                {mockAIGeneratedResumes.map((resume) => (
                  <Card
                    key={resume.id}
                    className="hover:border-primary overflow-hidden transition-colors"
                  >
                    <CardHeader className="flex flex-row items-center gap-3 space-y-0 p-4 pb-2">
                      <Avatar className="h-9 w-9 border">
                        <AvatarFallback className="text-sm">{resume.icon}</AvatarFallback>
                      </Avatar>
                      <div className="space-y-1">
                        <CardTitle className="text-base">{resume.name}</CardTitle>
                        <CardDescription className="text-xs">
                          Created on{' '}
                          {new Date(resume.createdAt).toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'numeric',
                            day: 'numeric',
                          })}
                        </CardDescription>
                      </div>
                    </CardHeader>
                    <CardContent className="p-4 pt-2">
                      <p className="text-muted-foreground mb-3 text-sm">{resume.description}</p>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5">
                          <div className="bg-muted h-1.5 w-24 overflow-hidden rounded-full">
                            <div
                              className="bg-primary h-full rounded-full"
                              style={{ width: `${resume.reference}%` }}
                            />
                          </div>
                          <span className="text-muted-foreground text-xs">
                            {resume.reference}% reference rate
                          </span>
                        </div>
                        <Button variant="outline" size="sm">
                          <Eye className="mr-2 h-3 w-3" />
                          View Details
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
