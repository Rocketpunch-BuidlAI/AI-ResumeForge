'use client';

import { useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Upload, FileText, X, Check, CloudUpload, AlertTriangle, FileIcon, Briefcase, Clock, Tag } from 'lucide-react';
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
  SheetFooter
} from '@/components/ui/sheet';
import { Skeleton } from '@/components/ui/skeleton';
import { Textarea } from '@/components/ui/textarea';
import { z } from 'zod';
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import FilePreview from '@/lib/pdf/FilePreview';
import Link from 'next/link';

// Form validation schema
const formSchema = z.object({
  companyName: z.string().min(1, "Company name is required"),
  yearsOfExperience: z.string().min(1, "Years of experience is required"),
  skills: z.string().min(3, "Skills are required"),
  jobTitle: z.string().min(1, "Job title is required"),
  additionalInfo: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

const experienceOptions = [
  "Less than 1 year",
  "1-2 years", 
  "3-5 years", 
  "5-10 years", 
  "10+ years"
];

export default function ResumeUploadPage() {
  const [file, setFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [progressValue, setProgressValue] = useState(0);
  const [showPreview, setShowPreview] = useState(false);
  const [isHovering, setIsHovering] = useState(false);
  const [currentStep, setCurrentStep] = useState<'upload' | 'metadata' | 'complete'>('upload');

  console.log(progressValue);
  
  // Form setup with react-hook-form and zod validation
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      companyName: "",
      yearsOfExperience: "",
      skills: "",
      jobTitle: "",
      additionalInfo: "",
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
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
      ];
      
      if (!validTypes.includes(fileType)) {
        toast("Invalid file type", {
          description: "Please upload a PDF, DOC, or DOCX file",
          style: { backgroundColor: 'hsl(var(--destructive))' },
          icon: <X className="h-4 w-4 text-white" />,
        });
        return;
      }
      
      setFile(selectedFile);
      setCurrentStep('metadata');
      toast("File selected", {
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
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
      ];
      
      if (!validTypes.includes(fileType)) {
        toast("Invalid file type", {
          description: "Please upload a PDF, DOC, or DOCX file",
          style: { backgroundColor: 'hsl(var(--destructive))' },
          icon: <X className="h-4 w-4 text-white" />,
        });
        return;
      }
      
      setFile(droppedFile);
      setCurrentStep('metadata');
      toast("File uploaded", {
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
    toast("File removed", {
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

    // Upload progress simulation
    const interval = setInterval(() => {
      setProgressValue(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          setIsUploading(false);
          setCurrentStep('complete');
          toast("Upload complete!", {
            description: "Your resume and metadata have been successfully uploaded.",
            icon: <Check className="h-4 w-4 text-green-500" />,
          });
          return 100;
        }
        return prev + 5;
      });
    }, 200);

    // TODO: Integrate with file upload API
    console.log('File to upload:', file);
    console.log('Form data:', data);
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
                  'hover:border-primary/70 cursor-pointer group'
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
                    className="bg-gray-100 dark:bg-gray-800 p-5 rounded-full cursor-pointer"
                  >
                    <CloudUpload className="text-primary h-10 w-10" />
                  </motion.div>
                  <div className="text-muted-foreground text-sm space-y-1">
                    <motion.p 
                      className="font-medium group-hover:text-primary transition-colors"
                      animate={{ scale: isDragging ? 1.05 : 1 }}
                    >
                      {isDragging ? 'Drop your file here!' : 'Drag and drop your file here'}
                    </motion.p>
                    <p>or click the button below to upload</p>
                  </div>
                  <div className="flex items-center gap-2 mt-2">
                    <Badge variant="outline" className="bg-blue-50 text-blue-600 dark:bg-blue-950/50 dark:text-blue-400 dark:border-blue-900">DOC</Badge>
                    <Badge variant="outline" className="bg-blue-50 text-blue-600 dark:bg-blue-950/50 dark:text-blue-400 dark:border-blue-900">DOCX</Badge>
                    <Badge variant="outline" className="bg-red-50 text-red-600 dark:bg-red-950/50 dark:text-red-400 dark:border-red-900">PDF</Badge>
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">
                    Maximum file size: 10MB
                </div>
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
                      className="mt-2 group-hover:bg-primary group-hover:text-primary-foreground transition-colors cursor-pointer"
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
                  className="rounded-lg border border-border bg-card shadow-sm p-4 mb-6"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={cn("p-3 rounded-lg", getFileTypeColor(getFileExtension(file.name)))}>
                        {getFileTypeIcon(getFileExtension(file.name))}
                      </div>
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium truncate max-w-[240px]">{file.name}</span>
                          <Badge variant="outline" className="font-mono">
                            {getFileExtension(file.name)}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-3">
                          <p className="text-xs text-muted-foreground">
                            {(file.size / 1024 / 1024).toFixed(2)} MB
                          </p>
                          <Button 
                            variant="link" 
                            size="sm" 
                            className="p-0 h-auto text-xs text-primary cursor-pointer"
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
                      className="h-8 w-8 rounded-full opacity-70 hover:opacity-100 cursor-pointer"
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
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="flex items-center gap-2">
                            <Briefcase className="h-4 w-4 text-muted-foreground" />
                            Job Title
                          </FormLabel>
                          <FormControl>
                            <Input placeholder="e.g. Frontend Developer" {...field} />
                          </FormControl>
                          <FormDescription>
                            The position you&apos;re applying for
                          </FormDescription>
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
                            <Briefcase className="h-4 w-4 text-muted-foreground" />
                            Company Name
                          </FormLabel>
                          <FormControl>
                            <Input placeholder="e.g. Acme Inc." {...field} />
                          </FormControl>
                          <FormDescription>
                            Company you&apos;re applying to
                          </FormDescription>
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
                            <Clock className="h-4 w-4 text-muted-foreground" />
                            Years of Experience
                          </FormLabel>
                          <div>
                            <div className="flex flex-wrap gap-2 mt-1">
                              {experienceOptions.map((option) => (
                                <Badge
                                  key={option}
                                  variant={field.value === option ? "default" : "outline"}
                                  className={cn(
                                    "cursor-pointer hover:bg-primary/20 transition-colors",
                                    field.value === option 
                                      ? "bg-primary text-primary-foreground"
                                      : ""
                                  )}
                                  onClick={() => form.setValue("yearsOfExperience", option, { shouldValidate: true })}
                                >
                                  {option}
                                  {field.value === option && <Check className="ml-1 h-3 w-3" />}
                                </Badge>
                              ))}
                            </div>
                            {form.formState.errors.yearsOfExperience && (
                              <p className="text-sm text-destructive mt-2">
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
                            <Tag className="h-4 w-4 text-muted-foreground" />
                            Skills & Keywords
                          </FormLabel>
                          <FormControl>
                            <Textarea 
                              placeholder="e.g. React, TypeScript, UI Design, Project Management"
                              className="min-h-[100px] resize-none"
                              {...field} 
                            />
                          </FormControl>
                          <FormDescription>
                            Separate skills with commas
                          </FormDescription>
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
                              placeholder="Any other details you&apos;d like to share..."
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
                          <Skeleton className="h-4 w-4 rounded-full animate-pulse mr-2" />
                          Uploading...
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
              className="flex flex-col items-center justify-center py-8 text-center space-y-4"
            >
              <motion.div 
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ type: "spring", stiffness: 500, damping: 30 }}
                className="bg-green-100 dark:bg-green-900/30 p-4 rounded-full"
              >
                <Check className="h-12 w-12 text-green-600 dark:text-green-500" />
              </motion.div>
              <h3 className="text-xl font-bold">Upload Complete!</h3>
              <p className="text-muted-foreground max-w-md">
                Your resume and information have been successfully uploaded. We&apos;ll analyze your resume and provide feedback soon.
              </p>
              <div className="flex gap-3 mt-4">
                <Button 
                  variant="outline" 
                  onClick={() => {
                    setFile(null);
                    setCurrentStep('upload');
                    form.reset();
                  }}
                  className="cursor-pointer"
                >
                  Upload Another
                </Button>
                <Link href="/">
                <Button className="cursor-pointer">
                  View Dashboard
                </Button>
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
      case 'upload': return 0;
      case 'metadata': return file ? 33 : 0;
      case 'complete': return 100;
      default: return 0;
    }
  };

  // Get step title based on current step
  const getStepTitle = () => {
    switch (currentStep) {
      case 'upload': return 'Resume Upload';
      case 'metadata': return 'Resume Information';
      case 'complete': return 'Upload Complete';
      default: return 'Resume Upload';
    }
  };

  // Get status badge text based on current step
  const getStepBadge = () => {
    switch (currentStep) {
      case 'upload': return 'Step 1/3';
      case 'metadata': return 'Step 2/3'; 
      case 'complete': return 'Complete';
      default: return 'Step 1/3';
    }
  };

  return (
    <div className="container mx-auto w-full max-w-3xl py-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <Card className="overflow-hidden dark:bg-slate-900/60 backdrop-blur-sm">
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="bg-primary p-2 rounded-full text-primary-foreground ring-4 ring-primary/20">
                  {currentStep === 'complete' ? (
                    <Check className="h-6 w-6" />
                  ) : (
                    <Upload className="h-6 w-6" />
                  )}
                </div>
                <div>
                  <CardTitle className="text-2xl font-bold">{getStepTitle()}</CardTitle>
                  <CardDescription className="text-base mt-1">
                    {currentStep === 'upload' && "Upload your existing resume to receive AI analysis"}
                    {currentStep === 'metadata' && "Add details to help us analyze your resume better"}
                    {currentStep === 'complete' && "Your resume has been uploaded successfully"}
                  </CardDescription>
                </div>
              </div>
              <Badge variant={currentStep === 'complete' ? "default" : "outline"} className={cn(
                currentStep === 'complete' ? "bg-green-500" : "bg-primary/10 text-primary",
                "font-medium"
              )}>
                {getStepBadge()}
              </Badge>
            </div>
          </CardHeader>

          <CardContent className="pt-6">
            <div className="mb-6 space-y-1">
              <div className="flex justify-between mb-2">
                <h3 className="text-sm font-medium">Upload Progress</h3>
                <span className="text-xs text-muted-foreground">
                  {currentStep === 'upload' && 'Select a file to get started'}
                  {currentStep === 'metadata' && 'Fill in resume details'}
                  {currentStep === 'complete' && 'All steps complete'}
                </span>
              </div>
              <div className="bg-muted rounded-full h-2.5 w-full overflow-hidden">
                <div 
                  className="bg-primary h-full transition-all duration-500 rounded-full"
                  style={{ width: `${getProgressPercentage()}%` }}
                />
              </div>
              <div className="flex justify-between mt-2">
                <div className="flex flex-col items-center text-center w-1/3">
                  <div 
                    className={cn(
                      "w-8 h-8 rounded-full flex items-center justify-center mb-1 transition-colors",
                      (currentStep === 'metadata' || currentStep === 'complete')
                        ? "bg-primary text-primary-foreground" 
                        : "bg-muted text-muted-foreground"
                    )}
                  >
                    {(currentStep === 'metadata' || currentStep === 'complete') ? <Check className="h-4 w-4" /> : 1}
                  </div>
                  <span className="text-xs font-medium">Select File</span>
                </div>
                <div className="flex flex-col items-center text-center w-1/3">
                  <div 
                    className={cn(
                      "w-8 h-8 rounded-full flex items-center justify-center mb-1 transition-colors",
                      currentStep === 'metadata' && isFormComplete
                        ? "bg-primary text-primary-foreground"
                        : currentStep === 'complete'
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted text-muted-foreground"
                    )}
                  >
                    {currentStep === 'complete' ? <Check className="h-4 w-4" /> : 2}
                  </div>
                  <span className="text-xs font-medium">Add Details</span>
                </div>
                <div className="flex flex-col items-center text-center w-1/3">
                  <div 
                    className={cn(
                      "w-8 h-8 rounded-full flex items-center justify-center mb-1 transition-colors",
                      currentStep === 'complete' 
                        ? "bg-primary text-primary-foreground" 
                        : "bg-muted text-muted-foreground"
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
          <CardFooter className="flex flex-col border-t pt-4 text-sm text-muted-foreground space-y-2">
            <div className="flex justify-between w-full text-xs items-center">
              <div className="flex items-center gap-1.5">
                <AlertTriangle className="h-3.5 w-3.5 text-yellow-500" />
                <span>Supported file formats: PDF, DOC, DOCX</span>
              </div>
              <Badge variant="secondary" className="font-mono text-[10px]">v1.0</Badge>
            </div>
            <p className="text-xs text-center">Files are used only for AI analysis and your security is maintained.</p>
          </CardFooter>
        </Card>
      </motion.div>

      <Sheet open={showPreview} onOpenChange={setShowPreview}>
        <SheetContent 
          side="right" 
          className="w-[100vw] max-w-none p-4" 
          style={{ width: '100vw', maxWidth: '100vw' }}
        >
          <SheetHeader className="mb-6">
            <SheetTitle className="flex items-center gap-2">
              {file && getFileTypeIcon(getFileExtension(file.name))}
              File Preview
            </SheetTitle>
            <SheetDescription className="flex items-center justify-between">
              <span>{file?.name}</span>
              <span className="text-xs text-muted-foreground">
                {file && `${(file.size / 1024 / 1024).toFixed(2)} MB`}
              </span>
            </SheetDescription>
          </SheetHeader>
          <div className="h-[70vh] overflow-hidden rounded-md border border-muted">
            <FilePreview file={file} />
          </div>
          <SheetFooter className="mt-6">
            <Button variant="outline" onClick={() => setShowPreview(false)} className="cursor-pointer">
              Close
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>
    </div>
  );
}
