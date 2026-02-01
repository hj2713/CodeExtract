"use client";

import { useState, useEffect, useCallback, Suspense, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { 
  GitBranch, 
  Loader2, 
  Sparkles, 
  ArrowRight,
  CheckCircle2,
  Code2,
  MessageSquare,
  Zap,
  Camera,
  Globe,
  Upload,
  Image as ImageIcon,
  X
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { 
  getOrCreateSource, 
  getSource, 
  cloneAndAnalyze, 
  getAnalysisContent,
  getOrCreateConversation,
  getRequirements
} from "./actions";
import { InterviewChat } from "./_components/interview-chat";
import { RequirementsSidebar } from "./_components/requirements-sidebar";
import { AnalysisReel } from "./_components/analysis-reel";

type InputMode = "github" | "screenshot" | "live_url";

type FlowStage = "input" | "analyzing" | "interview";

interface ComponentInfo {
  name: string;
  description: string;
  filePath: string;
}

interface SourceData {
  id: string;
  name: string;
  originUrl: string | null;
  analysisStatus: string;
  localPath?: string | null;
  analysisPath?: string | null;
  analysisMarkdown?: string | null;
  techStack?: string[] | null;
  dependencies?: string[] | null;
  components?: ComponentInfo[] | null;
  // Visual extraction fields
  inputType?: "github" | "screenshot" | "live_url" | null;
  visualData?: {
    screenshotBase64?: string;
    allScreenshots?: string[];
    capturedUrl?: string;
  } | null;
  visionAnalysis?: {
    componentType?: string;
    description?: string;
  } | null;
}

interface Requirement {
  id: string;
  title: string | null;
  requirement: string;
  status: string;
  createdAt: string | null;
}

// Main page wrapper with Suspense
export default function ExtractPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-emerald-600 animate-spin" />
      </div>
    }>
      <ExtractPageContent />
    </Suspense>
  );
}

function ExtractPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  // Flow state
  const [stage, setStage] = useState<FlowStage>("input");
  const [inputMode, setInputMode] = useState<InputMode>("github");
  const [githubUrl, setGithubUrl] = useState("");
  const [liveUrl, setLiveUrl] = useState("");
  // Support multiple images
  const [screenshotFiles, setScreenshotFiles] = useState<File[]>([]);
  const [screenshotPreviews, setScreenshotPreviews] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  
  // Source state
  const [source, setSource] = useState<SourceData | null>(null);
  const [analysisContent, setAnalysisContent] = useState<string | null>(null);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [requirements, setRequirements] = useState<Requirement[]>([]);
  
  // Component mention for chat
  const [mentionedComponent, setMentionedComponent] = useState<string | null>(null);
  
  // Analysis progress
  const [analysisStep, setAnalysisStep] = useState(0);
  const analysisSteps = [
    { label: "Fetching structure", icon: GitBranch },
    { label: "Analyzing files", icon: Code2 },
    { label: "AI processing", icon: Sparkles },
    { label: "Ready to chat", icon: MessageSquare },
  ];
  
  // Streaming analysis state
  const [reelFiles, setReelFiles] = useState<Array<{ path: string; type: "config" | "doc" | "component" }>>([]);
  const [currentFile, setCurrentFile] = useState<string | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [totalFiles, setTotalFiles] = useState(0);
  const [progress, setProgress] = useState(0);
  const [aiPhase, setAiPhase] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isVisualAnalyzing, setIsVisualAnalyzing] = useState(false);
  const [analyzingImageIndex, setAnalyzingImageIndex] = useState(0);
  
  // Placeholder files to show immediately while connecting
  const placeholderFiles: Array<{ path: string; type: "config" | "doc" | "component" }> = [
    { path: "package.json", type: "config" },
    { path: "README.md", type: "doc" },
    { path: "src/index.ts", type: "component" },
    { path: "src/app/page.tsx", type: "component" },
    { path: "src/components/ui/button.tsx", type: "component" },
    { path: "tsconfig.json", type: "config" },
    { path: "src/lib/utils.ts", type: "component" },
  ];

  // Animate through placeholder files while connecting (GitHub mode)
  useEffect(() => {
    if (!isConnecting || stage !== "analyzing" || isVisualAnalyzing) return;
    
    let idx = 0;
    const interval = setInterval(() => {
      idx = (idx + 1) % placeholderFiles.length;
      setCurrentIndex(idx);
      setCurrentFile(placeholderFiles[idx].path);
      setProgress(Math.min(15, idx * 2)); // Slowly increment progress up to 15%
    }, 400); // Animate every 400ms
    
    return () => clearInterval(interval);
  }, [isConnecting, stage, isVisualAnalyzing]);

  // Animate through images while analyzing visually
  useEffect(() => {
    if (!isVisualAnalyzing || stage !== "analyzing" || screenshotPreviews.length === 0) return;
    
    let idx = 0;
    const interval = setInterval(() => {
      idx = (idx + 1) % screenshotPreviews.length;
      setAnalyzingImageIndex(idx);
    }, 1200); // Slower for images - 1.2 seconds per image
    
    return () => clearInterval(interval);
  }, [isVisualAnalyzing, stage, screenshotPreviews.length]);

  // Handle file selection - supports multiple files
  const handleFileSelect = (files: FileList | File[]) => {
    const fileArray = Array.from(files);
    const validFiles: File[] = [];
    const validPreviews: string[] = [];
    
    for (const file of fileArray) {
      if (!file.type.startsWith("image/")) {
        setError("Please upload image files only (PNG, JPG, WEBP)");
        continue;
      }
      validFiles.push(file);
    }
    
    if (validFiles.length === 0) return;
    
    setError(null);
    
    // Create previews for all files
    validFiles.forEach((file) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result as string;
        setScreenshotPreviews(prev => [...prev, result]);
      };
      reader.readAsDataURL(file);
    });
    
    setScreenshotFiles(prev => [...prev, ...validFiles]);
  };

  // Drag and drop handlers
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      handleFileSelect(files);
    }
  };

  const removeScreenshot = (index: number) => {
    setScreenshotFiles(prev => prev.filter((_, i) => i !== index));
    setScreenshotPreviews(prev => prev.filter((_, i) => i !== index));
  };

  const clearAllScreenshots = () => {
    setScreenshotFiles([]);
    setScreenshotPreviews([]);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  // Check for sourceId in URL params
  useEffect(() => {
    const sourceId = searchParams.get("source");
    if (sourceId) {
      loadExistingSource(sourceId);
    }
  }, [searchParams]);

  const loadExistingSource = async (sourceId: string) => {
    try {
      const sourceData = await getSource(sourceId);
      if (!sourceData) {
        // Source not found, go back to input
        console.log("Source not found, redirecting to input");
        router.replace("/himanshu");
        return;
      }
      
      setSource(sourceData as unknown as SourceData);
      
      if ((sourceData.analysisStatus === "analyzed" || sourceData.analysisStatus === "complete") && (sourceData.analysisPath || sourceData.analysisMarkdown)) {
        // Already analyzed, go to interview
        const content = sourceData.analysisMarkdown || await getAnalysisContent(sourceData.analysisPath);
        setAnalysisContent(content);
        
        const conv = await getOrCreateConversation(sourceId);
        setConversationId(conv.id);
        
        const reqs = await getRequirements(sourceId);
        setRequirements(reqs as unknown as Requirement[]);
        
        setStage("interview");
      } else {
        // Need to analyze (pending, cloned, or any intermediate/error state)
        setGithubUrl(sourceData.originUrl || "");
        handleAnalyze(sourceData as unknown as SourceData);
      }
    } catch (err) {
      console.error("Error loading source:", err);
      setError("Failed to load source. Please try again.");
      setStage("input");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);
    
    // Route based on input mode
    if (inputMode === "github") {
      await handleGitHubSubmit();
    } else if (inputMode === "screenshot") {
      await handleVisualSubmit("screenshot");
    } else if (inputMode === "live_url") {
      await handleVisualSubmit("live_url");
    }
  };

  const handleGitHubSubmit = async () => {
    console.log("handleGitHubSubmit called with URL:", githubUrl);
    
    // Validate GitHub URL
    const githubRegex = /^https?:\/\/github\.com\/[\w-]+\/[\w.-]+\/?$/;
    if (!githubRegex.test(githubUrl.trim())) {
      console.log("URL validation failed");
      setError("Please enter a valid GitHub repository URL");
      setIsSubmitting(false);
      return;
    }

    console.log("URL validation passed, calling getOrCreateSource...");
    
    // IMMEDIATELY show analyzing stage with placeholders for instant feedback
    setStage("analyzing");
    setAnalysisStep(0);
    setReelFiles(placeholderFiles);
    setCurrentFile(placeholderFiles[0].path);
    setCurrentIndex(0);
    setTotalFiles(placeholderFiles.length);
    setProgress(0);
    setIsConnecting(true);
    setStatusMessage("Connecting to repository...");

    try {
      // Get or create source
      const sourceData = await getOrCreateSource(githubUrl.trim());
      console.log("getOrCreateSource returned:", sourceData);
      setSource(sourceData as unknown as SourceData);
      setIsConnecting(false);
      
      // Update URL
      router.push(`/himanshu?source=${sourceData.id}`);
      
      // Start analysis if not already done
      if (sourceData.analysisStatus !== "analyzed" && sourceData.analysisStatus !== "complete") {
        console.log("Starting analysis...");
        // Don't call setStage again - we're already in analyzing stage
        handleAnalyze(sourceData as unknown as SourceData, false);
      } else {
        console.log("Already analyzed, loading interview...");
        // Already analyzed, load and go to interview
        const content = sourceData.analysisMarkdown || await getAnalysisContent(sourceData.analysisPath || null);
        setAnalysisContent(content);
        
        const conv = await getOrCreateConversation(sourceData.id);
        setConversationId(conv.id);
        
        const reqs = await getRequirements(sourceData.id);
        setRequirements(reqs as unknown as Requirement[]);
        
        setStage("interview");
      }
    } catch (err) {
      console.error("Error in handleSubmit:", err);
      setError("Failed to process repository. Please try again.");
      setIsSubmitting(false);
      setIsConnecting(false);
      setStage("input");  // Go back to input on error
    }
  };

  // Handle visual (screenshot/live_url) submission
  const handleVisualSubmit = async (mode: "screenshot" | "live_url") => {
    console.log("handleVisualSubmit called with mode:", mode);

    // Validation
    if (mode === "screenshot" && screenshotPreviews.length === 0) {
      setError("Please upload at least one screenshot");
      setIsSubmitting(false);
      return;
    }

    if (mode === "live_url") {
      const urlRegex = /^https?:\/\/.+/;
      if (!urlRegex.test(liveUrl.trim())) {
        setError("Please enter a valid URL (starting with http:// or https://)");
        setIsSubmitting(false);
        return;
      }
    }

    // Show analyzing stage with visual-specific steps
    setStage("analyzing");
    setAnalysisStep(0);
    setStatusMessage(mode === "screenshot" ? `Analyzing ${screenshotPreviews.length} image(s)...` : "Capturing website...");
    setProgress(10);
    setIsConnecting(true);
    setIsVisualAnalyzing(true);
    setAnalyzingImageIndex(0);
    
    // Clear file reel for visual mode - we'll show images instead
    setReelFiles([]);
    setTotalFiles(screenshotPreviews.length);

    try {
      // Prepare request body - use first image as primary, include all as array
      const body: Record<string, unknown> = {
        inputType: mode,
        // Primary image for analysis (first one)
        imageBase64: screenshotPreviews[0] || null,
        // All images for storage
        allImages: screenshotPreviews.map((preview, index) => ({
          base64: preview,
          type: "screenshot" as const,
          addedAt: new Date().toISOString(),
        })),
      };

      if (mode === "live_url") {
        body.url = liveUrl.trim();
      }

      // Call visual analysis API
      setStatusMessage("AI analyzing visual design...");
      setAnalysisStep(1);
      setProgress(30);

      const response = await fetch("/api/analyze-visual", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const result = await response.json();

      // Check if we need a screenshot for live URL (can come with 200 status)
      if (result.status === "needs_screenshot") {
        setError("Please upload a screenshot of the webpage for visual analysis");
        setStage("input");
        setIsSubmitting(false);
        setIsConnecting(false);
        setIsVisualAnalyzing(false);
        return;
      }

      if (!response.ok) {
        throw new Error(result.error || "Failed to analyze visual");
      }

      setAnalysisStep(2);
      setProgress(80);
      setStatusMessage("Extracting design specifications...");

      // Use the analysis markdown as our content
      setAnalysisContent(result.analysisMarkdown);
      
      // Create source with visual data - include all screenshots for sidebar display
      setSource({
        id: result.sourceId,
        name: mode === "live_url" ? new URL(liveUrl).hostname : `Screenshot Analysis (${screenshotPreviews.length} image${screenshotPreviews.length > 1 ? 's' : ''})`,
        originUrl: mode === "live_url" ? liveUrl : null,
        analysisStatus: "analyzed",
        analysisMarkdown: result.analysisMarkdown,
        inputType: mode,
        visualData: {
          screenshotBase64: screenshotPreviews[0] || undefined,
          allScreenshots: screenshotPreviews,
          capturedUrl: mode === "live_url" ? liveUrl : undefined,
        },
        visionAnalysis: {
          componentType: result.componentType,
          description: result.description,
        },
      } as SourceData);

      // Get or create conversation
      const conv = await getOrCreateConversation(result.sourceId);
      setConversationId(conv.id);

      // Get any existing requirements
      const reqs = await getRequirements(result.sourceId);
      setRequirements(reqs as unknown as Requirement[]);

      // Update URL with source ID
      router.push(`/himanshu?source=${result.sourceId}`);

      setAnalysisStep(3);
      setProgress(100);
      setStatusMessage("Ready to discuss your component!");

      // Transition to interview
      setTimeout(() => {
        setStage("interview");
        setIsSubmitting(false);
        setIsConnecting(false);
        setIsVisualAnalyzing(false);
      }, 500);

    } catch (err) {
      console.error("Visual analysis error:", err);
      setError(err instanceof Error ? err.message : "Failed to analyze visual. Please try again.");
      setIsSubmitting(false);
      setIsConnecting(false);
      setIsVisualAnalyzing(false);
      setStage("input");
    }
  };

  const handleAnalyze = async (sourceData: SourceData, setStageToAnalyzing = true) => {
    if (setStageToAnalyzing) {
      setStage("analyzing");
    }
    setAnalysisStep(0);
    // Keep placeholder files if we have them, otherwise reset
    if (reelFiles.length === 0) {
      setReelFiles(placeholderFiles);
      setCurrentFile(placeholderFiles[0].path);
      setTotalFiles(placeholderFiles.length);
    }
    setCurrentIndex(0);
    setProgress(0);
    setAiPhase(null);
    setStatusMessage("Fetching repository structure...");
    setError(null);

    try {
      // Use streaming API for real-time progress
      const response = await fetch("/api/analyze-stream", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sourceId: sourceData.id }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error: ${response.status}`);
      }

      if (!response.body) {
        throw new Error("No response body");
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n\n");
        buffer = lines.pop() || "";

        for (const line of lines) {
          if (line.startsWith("data: ")) {
            try {
              const data = JSON.parse(line.slice(6));
              
              switch (data.type) {
                case "step":
                  setAnalysisStep(data.step);
                  setStatusMessage(data.message);
                  break;
                  
                case "tree":
                  setStatusMessage(`Found ${data.totalFiles} files`);
                  break;
                  
                case "files":
                  setReelFiles(data.files);
                  setTotalFiles(data.files.length);
                  break;
                  
                case "analyzing":
                  setCurrentFile(data.file);
                  setCurrentIndex(data.index);
                  setTotalFiles(data.total);
                  setProgress(data.progress || Math.round((data.index / data.total) * 100));
                  setAnalysisStep(1);
                  break;
                  
                case "ai":
                  setAiPhase(data.message);
                  setAnalysisStep(2);
                  setProgress(90);
                  break;
                  
                case "complete":
                  setAnalysisStep(3);
                  setProgress(100);
                  setAiPhase(null);
                  break;
                  
                case "error":
                  setError(data.message);
                  setStage("input");
                  return;
              }
            } catch (e) {
              // Skip invalid JSON
            }
          }
        }
      }

      // Refresh source data
      const updatedSource = await getSource(sourceData.id);
      if (updatedSource) {
        setSource(updatedSource as unknown as SourceData);
        
        const content = updatedSource.analysisMarkdown || await getAnalysisContent(updatedSource.analysisPath || null);
        setAnalysisContent(content);
        
        const conv = await getOrCreateConversation(sourceData.id);
        setConversationId(conv.id);
        
        const reqs = await getRequirements(sourceData.id);
        setRequirements(reqs as unknown as Requirement[]);
      }

      // Small delay before transitioning
      setTimeout(() => {
        setStage("interview");
      }, 500);
    } catch (err) {
      console.error("Analysis error:", err);
      setError("Failed to analyze repository");
      setStage("input");
    }
  };

  const refreshRequirements = useCallback(async () => {
    if (source) {
      const reqs = await getRequirements(source.id);
      setRequirements(reqs);
    }
  }, [source]);

  // Render based on stage
  if (stage === "input") {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="relative w-full max-w-2xl">
          {/* Logo/Title */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center p-4 rounded-2xl bg-emerald-100 mb-6">
              <Sparkles className="w-10 h-10 text-emerald-600" />
            </div>
            <h1 className="text-4xl font-bold text-gray-900 mb-3">
              Code<span className="text-emerald-600">Extract</span>
            </h1>
            <p className="text-gray-500 text-lg">
              Extract code patterns from any source
            </p>
          </div>

          {/* Input Mode Tabs */}
          <div className="flex justify-center mb-6">
            <div className="inline-flex bg-gray-100 p-1 rounded-xl">
              <button
                type="button"
                onClick={() => setInputMode("github")}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${
                  inputMode === "github"
                    ? "bg-white text-gray-900 shadow-sm"
                    : "text-gray-500 hover:text-gray-700"
                }`}
              >
                <GitBranch className="w-4 h-4" />
                GitHub
              </button>
              <button
                type="button"
                onClick={() => setInputMode("screenshot")}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${
                  inputMode === "screenshot"
                    ? "bg-white text-gray-900 shadow-sm"
                    : "text-gray-500 hover:text-gray-700"
                }`}
              >
                <Camera className="w-4 h-4" />
                Screenshot
              </button>
              <button
                type="button"
                onClick={() => setInputMode("live_url")}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${
                  inputMode === "live_url"
                    ? "bg-white text-gray-900 shadow-sm"
                    : "text-gray-500 hover:text-gray-700"
                }`}
              >
                <Globe className="w-4 h-4" />
                Live URL
              </button>
            </div>
          </div>

          {/* Input Card */}
          <div className="bg-white border border-gray-200 rounded-2xl p-8 shadow-lg">
            <form onSubmit={handleSubmit}>
              {/* GitHub Input */}
              {inputMode === "github" && (
                <>
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    GitHub Repository URL
                  </label>
                  <div className="flex gap-3">
                    <div className="flex-1 relative">
                      <GitBranch className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <input
                        type="url"
                        value={githubUrl}
                        onChange={(e) => setGithubUrl(e.target.value)}
                        placeholder="https://github.com/owner/repository"
                        className="w-full pl-12 pr-4 py-4 rounded-xl border border-gray-300 bg-white text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all duration-200"
                      />
                    </div>
                    <Button
                      type="submit"
                      size="lg"
                      disabled={isSubmitting}
                      className="bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg px-8"
                    >
                      {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <ArrowRight className="w-5 h-5" />}
                    </Button>
                  </div>
                </>
              )}

              {/* Screenshot Upload */}
              {/* Screenshot Upload */}
              {inputMode === "screenshot" && (
                <>
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    Upload Screenshots
                    {screenshotPreviews.length > 0 && (
                      <span className="ml-2 text-emerald-600">({screenshotPreviews.length} image{screenshotPreviews.length > 1 ? 's' : ''})</span>
                    )}
                  </label>
                  
                  {/* Drop zone - always visible for adding more */}
                  <div
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                    onClick={() => fileInputRef.current?.click()}
                    className={`relative border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all ${
                      isDragOver
                        ? "border-emerald-500 bg-emerald-50"
                        : "border-gray-300 hover:border-emerald-400 hover:bg-gray-50"
                    }`}
                  >
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/png,image/jpeg,image/webp"
                      multiple
                      onChange={(e) => e.target.files && handleFileSelect(e.target.files)}
                      className="hidden"
                    />
                    <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                    <p className="text-gray-600 font-medium">Drop images here or click to upload</p>
                    <p className="text-gray-400 text-sm mt-1">PNG, JPG or WEBP • Multiple files supported</p>
                  </div>
                  
                  {/* Image previews grid */}
                  {screenshotPreviews.length > 0 && (
                    <div className="mt-4">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs text-gray-500">Uploaded images</span>
                        <button
                          type="button"
                          onClick={clearAllScreenshots}
                          className="text-xs text-red-500 hover:text-red-700"
                        >
                          Remove all
                        </button>
                      </div>
                      <div className="grid grid-cols-3 gap-2">
                        {screenshotPreviews.map((preview, index) => (
                          <div key={index} className="relative group">
                            <img
                              src={preview}
                              alt={`Screenshot ${index + 1}`}
                              className="w-full h-24 object-cover rounded-lg border border-gray-200"
                            />
                            <button
                              type="button"
                              onClick={() => removeScreenshot(index)}
                              className="absolute top-1 right-1 p-1 bg-white rounded-full shadow-md opacity-0 group-hover:opacity-100 transition-opacity hover:bg-gray-100"
                            >
                              <X className="w-3 h-3 text-gray-600" />
                            </button>
                            {index === 0 && (
                              <span className="absolute bottom-1 left-1 text-[10px] bg-emerald-600 text-white px-1.5 py-0.5 rounded">
                                Primary
                              </span>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  <div className="mt-4 flex justify-end">
                    <Button
                      type="submit"
                      size="lg"
                      disabled={isSubmitting || screenshotPreviews.length === 0}
                      className="bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg px-8"
                    >
                      {isSubmitting ? (
                        <>
                          <Loader2 className="w-5 h-5 animate-spin mr-2" />
                          Analyzing...
                        </>
                      ) : (
                        <>
                          <Sparkles className="w-5 h-5 mr-2" />
                          Analyze {screenshotPreviews.length > 1 ? `${screenshotPreviews.length} Images` : 'Screenshot'}
                        </>
                      )}
                    </Button>
                  </div>
                </>
              )}

              {/* Live URL Input */}
              {inputMode === "live_url" && (
                <>
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    Website URL
                  </label>
                  <div className="relative mb-4">
                    <Globe className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="url"
                      value={liveUrl}
                      onChange={(e) => setLiveUrl(e.target.value)}
                      placeholder="https://example.com"
                      className="w-full pl-12 pr-4 py-4 rounded-xl border border-gray-300 bg-white text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all duration-200"
                    />
                  </div>
                  
                  <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 mb-4">
                    <p className="text-amber-800 text-sm">
                      <strong>Note:</strong> For best results, please also upload screenshots of the component you want to extract.
                    </p>
                  </div>
                  
                  {/* Upload Area - Always visible for adding more */}
                  <div
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                    onClick={() => fileInputRef.current?.click()}
                    className={`relative border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all ${
                      isDragOver
                        ? "border-emerald-500 bg-emerald-50"
                        : "border-gray-200 hover:border-emerald-400 hover:bg-gray-50"
                    }`}
                  >
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/png,image/jpeg,image/webp"
                      multiple
                      onChange={(e) => e.target.files && handleFileSelect(e.target.files)}
                      className="hidden"
                    />
                    <ImageIcon className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                    <p className="text-gray-500 text-sm">
                      {screenshotPreviews.length > 0 
                        ? "Drop more screenshots or click to add" 
                        : "Add screenshots (optional but recommended)"}
                    </p>
                  </div>
                  
                  {/* Preview Grid for Live URL */}
                  {screenshotPreviews.length > 0 && (
                    <div className="mt-4">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm text-gray-600">
                          {screenshotPreviews.length} screenshot{screenshotPreviews.length > 1 ? 's' : ''} added
                        </span>
                        <button
                          type="button"
                          onClick={clearAllScreenshots}
                          className="text-sm text-red-500 hover:text-red-600 flex items-center gap-1"
                        >
                          <X className="w-3 h-3" />
                          Remove all
                        </button>
                      </div>
                      <div className="grid grid-cols-3 gap-3">
                        {screenshotPreviews.map((preview, index) => (
                          <div key={index} className="relative group">
                            <img
                              src={preview}
                              alt={`Screenshot ${index + 1}`}
                              className="w-full aspect-video rounded-lg border border-gray-200 object-cover bg-gray-50"
                            />
                            {index === 0 && (
                              <span className="absolute top-1 left-1 px-1.5 py-0.5 bg-emerald-500 text-white text-xs rounded">
                                Primary
                              </span>
                            )}
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                removeScreenshot(index);
                              }}
                              className="absolute top-1 right-1 p-1 bg-white/90 rounded-full shadow-md opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-50"
                            >
                              <X className="w-3 h-3 text-gray-600" />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  <div className="mt-4 flex justify-end">
                    <Button
                      type="submit"
                      size="lg"
                      disabled={isSubmitting || !liveUrl}
                      className="bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg px-8"
                    >
                      {isSubmitting ? (
                        <>
                          <Loader2 className="w-5 h-5 animate-spin mr-2" />
                          Analyzing...
                        </>
                      ) : (
                        <>
                          <Globe className="w-5 h-5 mr-2" />
                          Analyze Website{screenshotPreviews.length > 0 ? ` + ${screenshotPreviews.length} Image${screenshotPreviews.length > 1 ? 's' : ''}` : ''}
                        </>
                      )}
                    </Button>
                  </div>
                </>
              )}
              
              {error && (
                <p className="mt-3 text-sm text-red-600 bg-red-50 px-4 py-2 rounded-lg">
                  {error}
                </p>
              )}
            </form>

            {/* Features */}
            <div className="mt-8 pt-8 border-t border-gray-200">
              <div className="grid grid-cols-3 gap-4">
                <div className="text-center">
                  <div className="w-10 h-10 rounded-lg bg-emerald-100 flex items-center justify-center mx-auto mb-2">
                    <Code2 className="w-5 h-5 text-emerald-600" />
                  </div>
                  <p className="text-xs text-gray-500">AI-Powered Analysis</p>
                </div>
                <div className="text-center">
                  <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center mx-auto mb-2">
                    <MessageSquare className="w-5 h-5 text-blue-600" />
                  </div>
                  <p className="text-xs text-gray-500">Interactive Interview</p>
                </div>
                <div className="text-center">
                  <div className="w-10 h-10 rounded-lg bg-amber-100 flex items-center justify-center mx-auto mb-2">
                    <Zap className="w-5 h-5 text-amber-600" />
                  </div>
                  <p className="text-xs text-gray-500">Instant Extraction</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (stage === "analyzing") {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="relative w-full max-w-5xl flex items-start gap-8">
          {/* Left side - Progress steps */}
          <div className="flex-1 text-center">
            {/* Main loader */}
            <div className="relative mb-8">
              <div className="w-24 h-24 mx-auto relative">
                <div className={`absolute inset-0 rounded-full blur-xl opacity-50 animate-pulse ${isVisualAnalyzing ? 'bg-purple-200' : 'bg-emerald-200'}`}></div>
                <div className={`relative w-full h-full rounded-full border flex items-center justify-center ${isVisualAnalyzing ? 'bg-purple-100 border-purple-200' : 'bg-emerald-100 border-emerald-200'}`}>
                  <Loader2 className={`w-10 h-10 animate-spin ${isVisualAnalyzing ? 'text-purple-600' : 'text-emerald-600'}`} />
                </div>
              </div>
            </div>

            {/* Title - different for visual vs GitHub */}
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              {isVisualAnalyzing ? "Analyzing Images" : "Analyzing Repository"}
            </h2>
            <p className="text-gray-500 mb-2 font-mono text-sm">
              {isVisualAnalyzing 
                ? `Image ${analyzingImageIndex + 1} of ${screenshotPreviews.length}`
                : (source?.name || githubUrl.split("/").slice(-2).join("/"))}
            </p>
            {statusMessage && (
              <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full mb-8 ${isVisualAnalyzing ? 'bg-purple-50 border border-purple-200' : 'bg-emerald-50 border border-emerald-200'}`}>
                <div className={`w-2 h-2 rounded-full animate-pulse ${isVisualAnalyzing ? 'bg-purple-500' : 'bg-emerald-500'}`} />
                <p className={`text-sm font-medium ${isVisualAnalyzing ? 'text-purple-700' : 'text-emerald-700'}`}>{statusMessage}</p>
              </div>
            )}
            {!statusMessage && <div className="mb-8" />}

            {/* Progress steps */}
            <div className="bg-white border border-gray-200 rounded-2xl p-6 max-w-md mx-auto shadow-lg">
              <div className="space-y-4">
                {analysisSteps.map((step, index) => {
                  const Icon = step.icon;
                  const isActive = index === analysisStep;
                  const isComplete = index < analysisStep;
                  const activeColor = isVisualAnalyzing ? 'purple' : 'emerald';
                  
                  return (
                    <div
                      key={step.label}
                      className={`flex items-center gap-4 p-3 rounded-xl transition-all duration-300 ${
                        isActive ? `bg-${activeColor}-50 border border-${activeColor}-200` :
                        isComplete ? "bg-gray-50" : "opacity-40"
                      }`}
                      style={isActive ? { backgroundColor: isVisualAnalyzing ? 'rgb(250, 245, 255)' : 'rgb(236, 253, 245)', borderColor: isVisualAnalyzing ? 'rgb(221, 214, 254)' : 'rgb(167, 243, 208)' } : {}}
                    >
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                        isComplete ? "bg-emerald-100" :
                        isActive ? "bg-emerald-100" : "bg-gray-100"
                      }`}>
                        {isComplete ? (
                          <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                        ) : isActive ? (
                          <Loader2 className="w-5 h-5 text-emerald-600 animate-spin" />
                        ) : (
                          <Icon className="w-5 h-5 text-gray-400" />
                        )}
                      </div>
                      <span className={`text-sm ${
                        isComplete ? "text-emerald-700" :
                        isActive ? "text-gray-900 font-medium" : "text-gray-400"
                      }`}>
                        {step.label}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Right side - File Reel OR Image Preview */}
          {isVisualAnalyzing && screenshotPreviews.length > 0 ? (
            <div className="flex-1 animate-in fade-in-0 slide-in-from-right-8 duration-500">
              <div className="bg-white border border-gray-200 rounded-2xl p-4 shadow-lg">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                    <Camera className="w-5 h-5 text-purple-600" />
                    Analyzing Files
                  </h3>
                  <span className="text-sm text-gray-500">
                    {analyzingImageIndex + 1} / {screenshotPreviews.length}
                  </span>
                </div>
                
                {/* Progress bar */}
                <div className="w-full h-1.5 bg-gray-100 rounded-full mb-4 overflow-hidden">
                  <div 
                    className="h-full bg-purple-500 rounded-full transition-all duration-500"
                    style={{ width: `${progress}%` }}
                  />
                </div>
                
                {/* Main image being analyzed */}
                <div className="relative aspect-video rounded-xl overflow-hidden bg-gray-100 mb-4">
                  <img
                    src={screenshotPreviews[analyzingImageIndex]}
                    alt={`Analyzing image ${analyzingImageIndex + 1}`}
                    className="w-full h-full object-contain"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
                  <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between">
                    <span className="text-white text-sm font-medium">
                      Image {analyzingImageIndex + 1}
                    </span>
                    <span className="text-white/80 text-xs flex items-center gap-1">
                      <div className="w-2 h-2 bg-purple-400 rounded-full animate-pulse" />
                      analyzing
                    </span>
                  </div>
                </div>
                
                {/* Thumbnail strip */}
                {screenshotPreviews.length > 1 && (
                  <div className="flex gap-2 overflow-x-auto pb-1">
                    {screenshotPreviews.map((preview, idx) => (
                      <div 
                        key={idx}
                        className={`flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden border-2 transition-all ${
                          idx === analyzingImageIndex 
                            ? 'border-purple-500 ring-2 ring-purple-200' 
                            : idx < analyzingImageIndex 
                              ? 'border-emerald-400 opacity-70'
                              : 'border-gray-200 opacity-50'
                        }`}
                      >
                        <img src={preview} alt={`Thumbnail ${idx + 1}`} className="w-full h-full object-cover" />
                        {idx < analyzingImageIndex && (
                          <div className="absolute inset-0 bg-emerald-500/20 flex items-center justify-center">
                            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ) : reelFiles.length > 0 && (
            <div className="flex-1 animate-in fade-in-0 slide-in-from-right-8 duration-500">
              <AnalysisReel
                files={reelFiles}
                currentFile={currentFile}
                currentIndex={currentIndex}
                totalFiles={totalFiles}
                progress={progress}
                aiPhase={aiPhase}
              />
            </div>
          )}
        </div>
      </div>
    );
  }

  // Interview stage
  return (
    <div className="h-screen bg-gray-50 flex overflow-hidden">
      {/* Sidebar */}
      <RequirementsSidebar
        source={source}
        requirements={requirements}
        analysisContent={analysisContent}
        onRefresh={refreshRequirements}
        onComponentMention={(name) => {
          setMentionedComponent(`I want to extract the ${name} component. Can you help me understand how it works?`);
        }}
      />

      {/* Main chat area */}
      <div className="flex-1 flex flex-col min-w-0">
        <InterviewChat
          sourceId={source?.id || ""}
          conversationId={conversationId}
          analysisContent={analysisContent}
          onRequirementSaved={refreshRequirements}
          images={source?.visualData?.allScreenshots || screenshotPreviews}
          initialInput={mentionedComponent}
          onInputConsumed={() => setMentionedComponent(null)}
        />
      </div>
    </div>
  );
}
