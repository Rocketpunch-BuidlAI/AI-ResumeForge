'use client';

import { useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
  Upload,
  FileText,
  X,
  Check,
  CloudUpload,
  AlertTriangle,
  FileIcon,
  Briefcase,
  Clock,
  Tag,
  ChevronRight,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
} from '@/components/ui/sheet';
import { Textarea } from '@/components/ui/textarea';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import FilePreview from '@/lib/pdf/FilePreview';
import Link from 'next/link';
import getSession from '@/utils/getSession';
import {
  Command,
  CommandEmpty,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';

// Job role hierarchical data
type JobRolesData = {
  [category: string]: {
    [subcategory: string]: string[];
  };
};

const jobRolesData: JobRolesData = {
  'Technical Roles': {
    'Web/ Software Dev': [
      'Backend Engineer',
      'Frontend Developer',
      'Full-Stack Developer',
      'Web Developer',
    ],
    'Blockchain / Web3': ['Smart Contract', 'Protocol Engineer'],
    'Data/ AI': ['Machine Learning', 'AI'],
    Security: ['Security Engineer'],
  },
  'Business Roles': {
    Marketing: ['Marketer', 'Brand Strategist', 'Content Creator'],
    'Product/Strategy': ['Product Manager', 'Business Analyst'],
    'Human Resources': ['People Operations', 'HR Manager', 'Talent Acquisition'],
    'Customer / Operations': [
      'Customer Success Manager',
      'Customer Support Specialist',
      'Operations Manager',
    ],
  },
  'Creative Roles': {
    Design: [
      'UI/UX Designer',
      'Visual Designer',
      'Illustrator',
      'Video Editor',
      '3D Artist',
      'AI Artist',
      'Copywriter',
      'Sound Designer',
      'VFX Artist',
    ],
    Contents: ['Songwriter', 'Photographer'],
  },
  'Professional Services': {
    '': [
      'Consultant',
      'Auditor',
      'Lawyer/ Legal Counsel',
      'Pharmacist',
      'Clinical Researcher',
      'Counselor',
    ],
  },
};

// Form validation schema
const formSchema = z.object({
  companyName: z.string().min(1, 'Company name is required'),
  yearsOfExperience: z.string().min(1, 'Years of experience is required'),
  skills: z.string().min(3, 'Skills are required'),
  jobTitle: z.string().min(1, 'Job title is required'),
  additionalInfo: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

const experienceOptions = ['Less than 1 year', '1-2 years', '3-5 years', '5-10 years', '10+ years'];

export default function ResumeUploadPage() {
  const [file, setFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [progressValue, setProgressValue] = useState(0);
  const [showPreview, setShowPreview] = useState(false);
  const [isHovering, setIsHovering] = useState(false);
  const [currentStep, setCurrentStep] = useState<'upload' | 'metadata' | 'complete'>('upload');
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [selectedSubcategory, setSelectedSubcategory] = useState<string>('');
  const [selectedJobTitle, setSelectedJobTitle] = useState<string>('');
  const [openJobCategory, setOpenJobCategory] = useState(false);
  const [openJobSubcategory, setOpenJobSubcategory] = useState(false);
  const [openJobTitle, setOpenJobTitle] = useState(false);

  // Form setup with react-hook-form and zod validation
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      companyName: '',
      yearsOfExperience: '',
      skills: '',
      jobTitle: '',
      additionalInfo: '',
    },
  });

  // Track form completion status
  const isFormComplete = form.formState.isValid;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];

      // Check if file is PDF, DOC or DOCX
      const fileType = selectedFile.type;
      const validTypes = [
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      ];

      if (!validTypes.includes(fileType)) {
        toast('Invalid file type', {
          description: 'Please upload a PDF, DOC, or DOCX file',
          style: { backgroundColor: 'hsl(var(--destructive))' },
          icon: <X className="h-4 w-4 text-white" />,
        });
        return;
      }

      setFile(selectedFile);
      setCurrentStep('metadata');
      toast('File selected', {
        description: `${selectedFile.name}`,
        icon: <Check className="h-4 w-4 text-green-500" />,
      });
    }
  };

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const droppedFile = e.dataTransfer.files[0];

      // Check if file is PDF, DOC or DOCX
      const fileType = droppedFile.type;
      const validTypes = [
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      ];

      if (!validTypes.includes(fileType)) {
        toast('Invalid file type', {
          description: 'Please upload a PDF, DOC, or DOCX file',
          style: { backgroundColor: 'hsl(var(--destructive))' },
          icon: <X className="h-4 w-4 text-white" />,
        });
        return;
      }

      setFile(droppedFile);
      setCurrentStep('metadata');
      toast('File uploaded', {
        description: `${droppedFile.name}`,
        icon: <Check className="h-4 w-4 text-green-500" />,
      });
    }
  }, []);

  const handleRemoveFile = () => {
    setFile(null);
    setProgressValue(0);
    setCurrentStep('upload');
    form.reset();
    toast('File removed', {
      style: { backgroundColor: 'hsl(var(--destructive))' },
      icon: <X className="h-4 w-4 text-white" />,
    });
  };

  const getFileExtension = (filename: string) => {
    return filename.split('.').pop()?.toUpperCase() || '';
  };

  const getFileTypeColor = (extension: string) => {
    switch (extension.toLowerCase()) {
      case 'pdf':
        return 'text-red-500 bg-red-50 dark:bg-red-950/30 dark:text-red-400';
      case 'doc':
      case 'docx':
        return 'text-blue-500 bg-blue-50 dark:bg-blue-950/30 dark:text-blue-400';
      default:
        return 'text-gray-500 bg-gray-50 dark:bg-gray-800 dark:text-gray-400';
    }
  };

  const getFileTypeIcon = (extension: string) => {
    switch (extension.toLowerCase()) {
      case 'pdf':
        return <FileText className="h-5 w-5" />;
      case 'doc':
      case 'docx':
        return <FileIcon className="h-5 w-5" />;
      default:
        return <FileText className="h-5 w-5" />;
    }
  };

  const onSubmit = async (data: FormValues) => {
    if (!file) return;

    setIsUploading(true);
    setProgressValue(0);

    try {
      // 진행률 표시를 위한 시뮬레이션 (실제 업로드와 병행)
      const interval = setInterval(() => {
        setProgressValue((prev) => {
          if (prev >= 90) {
            clearInterval(interval);
            return 90; // 90%에서 대기 (실제 업로드가 완료될 때까지)
          }
          return prev + 1;
        });
      }, 100);

      const session = await getSession();

      console.log('session', session?.user?.id);

      // 실제 파일 업로드 구현
      const formData = new FormData();
      formData.append('file', file);
      formData.append('userId', session?.user?.id || '');

      // 메타데이터에 선택된 직업 정보 추가
      const fullJobTitle = selectedJobTitle
        ? selectedCategory === 'Professional Services'
          ? selectedJobTitle
          : `${selectedCategory} > ${selectedSubcategory} > ${selectedJobTitle}`
        : data.jobTitle;

      // 메타데이터 추가
      formData.append(
        'metadata',
        JSON.stringify({
          jobTitle: fullJobTitle,
          companyName: data.companyName,
          yearsOfExperience: data.yearsOfExperience,
          skills: data.skills,
          additionalInfo: data.additionalInfo || '',
          fileName: file.name,
          fileSize: file.size,
          fileType: file.type,
          uploadDate: new Date().toISOString(),
          // 계층적 직업 정보 추가
          jobCategory: selectedCategory || '',
          jobSubcategory: selectedSubcategory || '',
          jobSpecific: selectedJobTitle || '',
        })
      );

      console.log('Submitting with job info:', {
        jobTitle: fullJobTitle,
        category: selectedCategory,
        subcategory: selectedSubcategory,
        specific: selectedJobTitle,
      });

      // API 호출하여 파일 업로드
      const uploadResponse = await fetch('/api/resumes', {
        method: 'POST',
        body: formData,
      });

      if (!uploadResponse.ok) {
        console.error('Upload failed with status:', uploadResponse.status);
        console.error(
          'Response headers:',
          Object.fromEntries([...uploadResponse.headers.entries()])
        );

        // 응답 타입 확인
        const contentType = uploadResponse.headers.get('content-type');
        console.error('Content-Type:', contentType);

        let errorData;

        if (contentType && contentType.includes('application/json')) {
          errorData = await uploadResponse.json();
          console.error('Error response (JSON):', errorData);
        } else {
          errorData = { message: await uploadResponse.text() };
          console.error('Error response (Text):', errorData.message);
        }

        throw new Error(errorData.message || 'An error occurred while uploading the file.');
      }

      const result = await uploadResponse.json();

      // 업로드 완료 후 진행률 100%로 설정
      clearInterval(interval);
      setProgressValue(100);

      // 업로드 완료 후 상태 업데이트
      setIsUploading(false);
      setCurrentStep('complete');

      toast('Upload Complete!', {
        description: 'Your resume and metadata have been successfully uploaded.',
        icon: <Check className="h-4 w-4 text-green-500" />,
      });

      // 콘솔에 결과 로깅 (디버깅용)
      console.log('Upload result:', result);
      console.log('File uploaded:', file);
      console.log('Form data:', data);
    } catch (error) {
      console.error('Upload error:', error);

      // 에러 발생 시 업로드 상태 초기화
      setIsUploading(false);
      setProgressValue(0);

      toast('Upload Failed', {
        description:
          error instanceof Error ? error.message : 'An error occurred while uploading the file.',
        style: { backgroundColor: 'hsl(var(--destructive))' },
        icon: <X className="h-4 w-4 text-white" />,
      });
    }
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 'upload':
        return (
          <AnimatePresence mode="wait">
            <motion.div
              key="upload-area"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <div
                className={cn(
                  'rounded-lg border-2 border-dashed p-8 text-center transition-all duration-300',
                  isDragging
                    ? 'border-primary bg-primary/10 scale-[1.02] shadow-lg'
                    : 'border-muted',
                  isHovering && 'border-primary/60 bg-primary/5',
                  'hover:border-primary/70 group cursor-pointer'
                )}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onMouseEnter={() => setIsHovering(true)}
                onMouseLeave={() => setIsHovering(false)}
              >
                <div className="flex flex-col items-center gap-4">
                  <motion.div
                    whileHover={{ scale: 1.1, rotate: 5 }}
                    whileTap={{ scale: 0.95 }}
                    className="cursor-pointer rounded-full bg-gray-100 p-5 dark:bg-gray-800"
                  >
                    <CloudUpload className="text-primary h-10 w-10" />
                  </motion.div>
                  <div className="text-muted-foreground space-y-1 text-sm">
                    <motion.p
                      className="group-hover:text-primary font-medium transition-colors"
                      animate={{ scale: isDragging ? 1.05 : 1 }}
                    >
                      {isDragging ? 'Drop your file here!' : 'Drag and drop your file here'}
                    </motion.p>
                    <p>or click the button below to upload</p>
                  </div>
                  <div className="mt-2 flex items-center gap-2">
                    <Badge
                      variant="outline"
                      className="bg-blue-50 text-blue-600 dark:border-blue-900 dark:bg-blue-950/50 dark:text-blue-400"
                    >
                      DOC
                    </Badge>
                    <Badge
                      variant="outline"
                      className="bg-blue-50 text-blue-600 dark:border-blue-900 dark:bg-blue-950/50 dark:text-blue-400"
                    >
                      DOCX
                    </Badge>
                    <Badge
                      variant="outline"
                      className="bg-red-50 text-red-600 dark:border-red-900 dark:bg-red-950/50 dark:text-red-400"
                    >
                      PDF
                    </Badge>
                  </div>
                  <div className="text-muted-foreground mt-1 text-xs">Maximum file size: 10MB</div>
                  <Input
                    id="file"
                    type="file"
                    accept=".pdf,.doc,.docx"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                  <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
                    <Button
                      variant="outline"
                      onClick={() => document.getElementById('file')?.click()}
                      className="group-hover:bg-primary group-hover:text-primary-foreground mt-2 cursor-pointer transition-colors"
                    >
                      <Upload className="mr-2 h-4 w-4" />
                      Select File
                    </Button>
                  </motion.div>
                </div>
              </div>
            </motion.div>
          </AnimatePresence>
        );

      case 'metadata':
        return (
          <AnimatePresence>
            <motion.div
              key="metadata-form"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="space-y-6"
            >
              {file && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="border-border bg-card mb-6 rounded-lg border p-4 shadow-sm"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div
                        className={cn(
                          'rounded-lg p-3',
                          getFileTypeColor(getFileExtension(file.name))
                        )}
                      >
                        {getFileTypeIcon(getFileExtension(file.name))}
                      </div>
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="max-w-[240px] truncate text-sm font-medium">
                            {file.name}
                          </span>
                          <Badge variant="outline" className="font-mono">
                            {getFileExtension(file.name)}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-3">
                          <p className="text-muted-foreground text-xs">
                            {(file.size / 1024 / 1024).toFixed(2)} MB
                          </p>
                          <Button
                            variant="link"
                            size="sm"
                            className="text-primary h-auto cursor-pointer p-0 text-xs"
                            onClick={() => setShowPreview(true)}
                          >
                            Preview
                          </Button>
                        </div>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleRemoveFile}
                      className="h-8 w-8 cursor-pointer rounded-full opacity-70 hover:opacity-100"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </motion.div>
              )}

              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                  <motion.div
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                  >
                    <FormField
                      control={form.control}
                      name="jobTitle"
                      render={() => (
                        <FormItem>
                          <FormLabel className="flex items-center gap-2">
                            <Briefcase className="text-muted-foreground h-4 w-4" />
                            Job Title
                          </FormLabel>
                          <FormControl>
                            <div className="flex flex-col space-y-4">
                              {/* 직업 카테고리 선택 */}
                              <Popover open={openJobCategory} onOpenChange={setOpenJobCategory}>
                                <PopoverTrigger asChild>
                                  <Button
                                    variant="outline"
                                    role="combobox"
                                    aria-expanded={openJobCategory}
                                    className="w-full justify-between"
                                  >
                                    {selectedCategory || 'Select job category...'}
                                    <ChevronRight
                                      className={`ml-2 h-4 w-4 shrink-0 opacity-50 ${selectedCategory ? 'text-primary' : ''}`}
                                    />
                                  </Button>
                                </PopoverTrigger>
                                <PopoverContent
                                  className="p-0"
                                  style={{
                                    width: 'var(--radix-popover-trigger-width)',
                                    minWidth: '100%',
                                  }}
                                >
                                  <Command className="w-full">
                                    <CommandList className="w-full">
                                      <CommandInput placeholder="Search job category..." />
                                      <CommandEmpty>No category found.</CommandEmpty>
                                      {Object.keys(jobRolesData).map((category) => (
                                        <CommandItem
                                          key={category}
                                          value={category}
                                          onSelect={() => handleCategoryChange(category)}
                                          className="cursor-pointer"
                                        >
                                          {category}
                                          {selectedCategory === category && (
                                            <Check className="text-primary ml-auto h-4 w-4" />
                                          )}
                                        </CommandItem>
                                      ))}
                                    </CommandList>
                                  </Command>
                                </PopoverContent>
                              </Popover>

                              {/* 직업 서브카테고리 선택 */}
                              {selectedCategory && selectedCategory !== 'Professional Services' && (
                                <Popover
                                  open={openJobSubcategory}
                                  onOpenChange={setOpenJobSubcategory}
                                >
                                  <PopoverTrigger asChild>
                                    <Button
                                      variant="outline"
                                      role="combobox"
                                      aria-expanded={openJobSubcategory}
                                      className="w-full justify-between"
                                    >
                                      {selectedSubcategory || 'Select subcategory...'}
                                      <ChevronRight
                                        className={`ml-2 h-4 w-4 shrink-0 opacity-50 ${selectedSubcategory ? 'text-primary' : ''}`}
                                      />
                                    </Button>
                                  </PopoverTrigger>
                                  <PopoverContent
                                    className="p-0"
                                    style={{
                                      width: 'var(--radix-popover-trigger-width)',
                                      minWidth: '100%',
                                    }}
                                  >
                                    <Command className="w-full">
                                      <CommandList className="w-full">
                                        <CommandInput placeholder="Search subcategory..." />
                                        <CommandEmpty>No subcategory found.</CommandEmpty>
                                        {selectedCategory &&
                                          Object.keys(
                                            jobRolesData[
                                              selectedCategory as keyof typeof jobRolesData
                                            ]
                                          ).map((subcategory) => (
                                            <CommandItem
                                              key={subcategory}
                                              value={subcategory}
                                              onSelect={() => handleSubcategoryChange(subcategory)}
                                              className="cursor-pointer"
                                            >
                                              {subcategory}
                                              {selectedSubcategory === subcategory && (
                                                <Check className="text-primary ml-auto h-4 w-4" />
                                              )}
                                            </CommandItem>
                                          ))}
                                      </CommandList>
                                    </Command>
                                  </PopoverContent>
                                </Popover>
                              )}

                              {/* 직업 타이틀 선택 */}
                              {(selectedCategory === 'Professional Services' ||
                                (selectedCategory && selectedSubcategory)) && (
                                <Popover open={openJobTitle} onOpenChange={setOpenJobTitle}>
                                  <PopoverTrigger asChild>
                                    <Button
                                      variant="outline"
                                      role="combobox"
                                      aria-expanded={openJobTitle}
                                      className="w-full justify-between"
                                    >
                                      {selectedJobTitle || 'Select job title...'}
                                      <ChevronRight
                                        className={`ml-2 h-4 w-4 shrink-0 opacity-50 ${selectedJobTitle ? 'text-primary' : ''}`}
                                      />
                                    </Button>
                                  </PopoverTrigger>
                                  <PopoverContent
                                    className="p-0"
                                    style={{
                                      width: 'var(--radix-popover-trigger-width)',
                                      minWidth: '100%',
                                    }}
                                  >
                                    <Command className="w-full">
                                      <CommandList className="w-full">
                                        <CommandInput placeholder="Search job title..." />
                                        <CommandEmpty>No job title found.</CommandEmpty>
                                        {selectedCategory === 'Professional Services'
                                          ? jobRolesData['Professional Services'][''].map(
                                              (jobTitle) => (
                                                <CommandItem
                                                  key={jobTitle}
                                                  value={jobTitle}
                                                  onSelect={() => handleJobTitleChange(jobTitle)}
                                                  className="cursor-pointer"
                                                >
                                                  {jobTitle}
                                                  {selectedJobTitle === jobTitle && (
                                                    <Check className="text-primary ml-auto h-4 w-4" />
                                                  )}
                                                </CommandItem>
                                              )
                                            )
                                          : selectedCategory &&
                                            selectedSubcategory &&
                                            jobRolesData[
                                              selectedCategory as keyof typeof jobRolesData
                                            ][selectedSubcategory]?.map((jobTitle) => (
                                              <CommandItem
                                                key={jobTitle}
                                                value={jobTitle}
                                                onSelect={() => handleJobTitleChange(jobTitle)}
                                                className="cursor-pointer"
                                              >
                                                {jobTitle}
                                                {selectedJobTitle === jobTitle && (
                                                  <Check className="text-primary ml-auto h-4 w-4" />
                                                )}
                                              </CommandItem>
                                            ))}
                                      </CommandList>
                                    </Command>
                                  </PopoverContent>
                                </Popover>
                              )}

                              {/* 선택된 직업 표시 */}
                              {selectedJobTitle && (
                                <div className="mt-2 flex items-center">
                                  <Badge variant="outline" className="bg-primary/10 text-primary">
                                    {selectedJobTitle}
                                    <Check className="ml-1 h-3 w-3" />
                                  </Badge>
                                </div>
                              )}
                            </div>
                          </FormControl>
                          {/* <FormDescription>Select the job posi&apos;re applying for</FormDescription> */}
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </motion.div>

                  <motion.div
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                  >
                    <FormField
                      control={form.control}
                      name="companyName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="flex items-center gap-2">
                            <Briefcase className="text-muted-foreground h-4 w-4" />
                            Company Name
                          </FormLabel>
                          <FormControl>
                            <Input placeholder="e.g. Acme Inc." {...field} />
                          </FormControl>
                          <FormDescription>Company you&apos;re applying to</FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </motion.div>

                  <motion.div
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                  >
                    <FormField
                      control={form.control}
                      name="yearsOfExperience"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="flex items-center gap-2">
                            <Clock className="text-muted-foreground h-4 w-4" />
                            Years of Experience
                          </FormLabel>
                          <div>
                            <div className="mt-1 flex flex-wrap gap-2">
                              {experienceOptions.map((option) => (
                                <Badge
                                  key={option}
                                  variant={field.value === option ? 'default' : 'outline'}
                                  className={cn(
                                    'hover:bg-primary/20 cursor-pointer transition-colors',
                                    field.value === option
                                      ? 'bg-primary text-primary-foreground'
                                      : ''
                                  )}
                                  onClick={() =>
                                    form.setValue('yearsOfExperience', option, {
                                      shouldValidate: true,
                                    })
                                  }
                                >
                                  {option}
                                  {field.value === option && <Check className="ml-1 h-3 w-3" />}
                                </Badge>
                              ))}
                            </div>
                            {form.formState.errors.yearsOfExperience && (
                              <p className="text-destructive mt-2 text-sm">
                                {form.formState.errors.yearsOfExperience.message}
                              </p>
                            )}
                          </div>
                        </FormItem>
                      )}
                    />
                  </motion.div>

                  <motion.div
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 }}
                  >
                    <FormField
                      control={form.control}
                      name="skills"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="flex items-center gap-2">
                            <Tag className="text-muted-foreground h-4 w-4" />
                            Skills & Keywords
                          </FormLabel>
                          <FormControl>
                            <Textarea
                              placeholder="e.g. React, TypeScript, UI Design, Project Management"
                              className="min-h-[100px] resize-none"
                              {...field}
                            />
                          </FormControl>
                          <FormDescription>Separate skills with commas</FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </motion.div>

                  <motion.div
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5 }}
                  >
                    <FormField
                      control={form.control}
                      name="additionalInfo"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Additional Information (Optional)</FormLabel>
                          <FormControl>
                            <Textarea
                              placeholder="Any other details you'd like to share..."
                              className="min-h-[80px] resize-none"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </motion.div>

                  <motion.div
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.98 }}
                    className="pt-2"
                  >
                    <Button
                      type="submit"
                      className="w-full cursor-pointer"
                      disabled={!isFormComplete || isUploading}
                    >
                      {isUploading ? (
                        <>
                          <div className="flex items-center gap-2">
                            <div className="border-primary/30 border-t-primary h-4 w-4 animate-spin rounded-full border-2"></div>
                            <span>Uploading: {progressValue}%</span>
                          </div>
                        </>
                      ) : (
                        <>
                          <CloudUpload className="mr-2 h-4 w-4" />
                          Upload Resume & Information
                        </>
                      )}
                    </Button>
                  </motion.div>
                </form>
              </Form>
            </motion.div>
          </AnimatePresence>
        );

      case 'complete':
        return (
          <AnimatePresence>
            <motion.div
              key="complete"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex flex-col items-center justify-center space-y-4 py-8 text-center"
            >
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                className="rounded-full bg-green-100 p-4 dark:bg-green-900/30"
              >
                <Check className="h-12 w-12 text-green-600 dark:text-green-500" />
              </motion.div>
              <h3 className="text-xl font-bold">Upload Complete!</h3>
              <p className="text-muted-foreground max-w-md">
                Your resume and information have been successfully uploaded. We&apos;ll analyze your
                resume and provide feedback soon.
              </p>
              <div className="mt-4 flex gap-3">
                <Button
                  variant="outline"
                  onClick={() => {
                    window.location.reload();
                  }}
                  className="cursor-pointer"
                >
                  Upload Another
                </Button>
                <Link href="/">
                  <Button className="cursor-pointer">View Dashboard</Button>
                </Link>
              </div>
            </motion.div>
          </AnimatePresence>
        );
    }
  };

  // Calculate progress percentage based on current step
  const getProgressPercentage = () => {
    switch (currentStep) {
      case 'upload':
        return 0;
      case 'metadata':
        if (isUploading) {
          return 33 + (progressValue * 0.67) / 100; // Scale upload progress to remaining 67%
        }
        return file ? 33 : 0;
      case 'complete':
        return 100;
      default:
        return 0;
    }
  };

  // Get step title based on current step
  const getStepTitle = () => {
    switch (currentStep) {
      case 'upload':
        return 'Resume Upload';
      case 'metadata':
        return 'Resume Information';
      case 'complete':
        return 'Upload Complete';
      default:
        return 'Resume Upload';
    }
  };

  // Get status badge text based on current step
  const getStepBadge = () => {
    switch (currentStep) {
      case 'upload':
        return 'Step 1/3';
      case 'metadata':
        return 'Step 2/3';
      case 'complete':
        return 'Complete';
      default:
        return 'Step 1/3';
    }
  };

  // 직업 카테고리 변경 시 서브카테고리와 직업 초기화
  const handleCategoryChange = (category: string) => {
    setSelectedCategory(category);
    setSelectedSubcategory('');
    setSelectedJobTitle('');
    setOpenJobCategory(false);

    // 폼에 직업 타이틀 값 설정
    if (category === 'Professional Services') {
      // Professional Services는 서브카테고리가 없으므로 바로 직업 선택 가능
      setOpenJobTitle(true);
    }
  };

  // 서브카테고리 변경 시 직업 초기화
  const handleSubcategoryChange = (subcategory: string) => {
    setSelectedSubcategory(subcategory);
    setSelectedJobTitle('');
    setOpenJobSubcategory(false);
    setOpenJobTitle(true);
  };

  // 직업 선택 시
  const handleJobTitleChange = (jobTitle: string) => {
    setSelectedJobTitle(jobTitle);
    setOpenJobTitle(false);
    form.setValue('jobTitle', jobTitle, { shouldValidate: true });
  };

  return (
    <div className="container mx-auto w-full max-w-3xl py-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <Card className="overflow-hidden backdrop-blur-sm">
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="bg-primary text-primary-foreground ring-primary/20 rounded-full p-2 ring-4">
                  {currentStep === 'complete' ? (
                    <Check className="h-6 w-6" />
                  ) : (
                    <Upload className="h-6 w-6" />
                  )}
                </div>
                <div>
                  <CardTitle className="text-2xl font-bold">{getStepTitle()}</CardTitle>
                  <CardDescription className="mt-1 text-base">
                    {currentStep === 'upload' &&
                      'Upload your existing resume to receive AI analysis'}
                    {currentStep === 'metadata' &&
                      'Add details to help us analyze your resume better'}
                    {currentStep === 'complete' && 'Your resume has been uploaded successfully'}
                  </CardDescription>
                </div>
              </div>
              <Badge
                variant={currentStep === 'complete' ? 'default' : 'outline'}
                className={cn(
                  currentStep === 'complete' ? 'bg-green-500' : 'bg-primary/10 text-primary',
                  'font-medium'
                )}
              >
                {getStepBadge()}
              </Badge>
            </div>
          </CardHeader>

          <CardContent className="pt-6">
            <div className="mb-6 space-y-1">
              <div className="mb-2 flex justify-between">
                <h3 className="text-sm font-medium">Upload Progress</h3>
                <span className="text-muted-foreground text-xs">
                  {currentStep === 'upload' && 'Select a file to get started'}
                  {currentStep === 'metadata' && 'Fill in resume details'}
                  {currentStep === 'complete' && 'All steps complete'}
                </span>
              </div>
              <div className="bg-muted h-2.5 w-full overflow-hidden rounded-full">
                <div
                  className="bg-primary h-full rounded-full transition-all duration-500"
                  style={{ width: `${getProgressPercentage()}%` }}
                />
              </div>
              <div className="mt-2 flex justify-between">
                <div className="flex w-1/3 flex-col items-center text-center">
                  <div
                    className={cn(
                      'mb-1 flex h-8 w-8 items-center justify-center rounded-full transition-colors',
                      currentStep === 'metadata' || currentStep === 'complete'
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted text-muted-foreground'
                    )}
                  >
                    {currentStep === 'metadata' || currentStep === 'complete' ? (
                      <Check className="h-4 w-4" />
                    ) : (
                      1
                    )}
                  </div>
                  <span className="text-xs font-medium">Select File</span>
                </div>
                <div className="flex w-1/3 flex-col items-center text-center">
                  <div
                    className={cn(
                      'mb-1 flex h-8 w-8 items-center justify-center rounded-full transition-colors',
                      currentStep === 'metadata' && isFormComplete
                        ? 'bg-primary text-primary-foreground'
                        : currentStep === 'complete'
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-muted text-muted-foreground'
                    )}
                  >
                    {currentStep === 'complete' ? <Check className="h-4 w-4" /> : 2}
                  </div>
                  <span className="text-xs font-medium">Add Details</span>
                </div>
                <div className="flex w-1/3 flex-col items-center text-center">
                  <div
                    className={cn(
                      'mb-1 flex h-8 w-8 items-center justify-center rounded-full transition-colors',
                      currentStep === 'complete'
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted text-muted-foreground'
                    )}
                  >
                    {currentStep === 'complete' ? <Check className="h-4 w-4" /> : 3}
                  </div>
                  <span className="text-xs font-medium">Complete</span>
                </div>
              </div>
            </div>

            {renderStepContent()}
          </CardContent>
          <CardFooter className="text-muted-foreground flex flex-col space-y-2 border-t pt-4 text-sm">
            <div className="flex w-full items-center justify-between text-xs">
              <div className="flex items-center gap-1.5">
                <AlertTriangle className="h-3.5 w-3.5 text-yellow-500" />
                <span>Supported file formats: PDF, DOC, DOCX</span>
              </div>
              <Badge variant="secondary" className="font-mono text-[10px]">
                v1.0
              </Badge>
            </div>
            <p className="text-center text-xs">
              Files are used only for AI analysis and your security is maintained.
            </p>
          </CardFooter>
        </Card>
      </motion.div>

      <Sheet open={showPreview} onOpenChange={setShowPreview}>
        <SheetContent
          side="right"
          style={{
            position: 'absolute',
            width: '100%',
            height: '100%',
            maxWidth: '100%',
            padding: '24px',
            margin: 0,
            top: 0,
            right: 0,
            border: 0,
            boxShadow: 'none',
          }}
          className="!right-0 !left-0 m-0 w-screen max-w-none border-none p-6"
        >
          <SheetHeader className="mb-6">
            <SheetTitle className="flex items-center gap-2">
              {file && getFileTypeIcon(getFileExtension(file.name))}
              File Preview
            </SheetTitle>
            <SheetDescription className="flex items-center justify-between">
              <span>{file?.name}</span>
              <span className="text-muted-foreground text-xs">
                {file && `${(file.size / 1024 / 1024).toFixed(2)} MB`}
              </span>
            </SheetDescription>
          </SheetHeader>
          <div className="border-muted h-[70vh] overflow-hidden rounded-md border">
            <FilePreview file={file} />
          </div>
          <SheetFooter className="mt-6">
            <Button
              variant="outline"
              onClick={() => setShowPreview(false)}
              className="cursor-pointer"
            >
              Close
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>
    </div>
  );
}
