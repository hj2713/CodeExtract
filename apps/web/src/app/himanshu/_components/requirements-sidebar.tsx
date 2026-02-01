"use client";

import { useState } from "react";
import { 
  FileCode, 
  Sparkles,
  Clock,
  Rocket,
  ExternalLink,
  Package,
  Search,
  Layers,
  Code2,
  Zap,
  Eye,
  Image as ImageIcon,
  Camera,
  Globe,
  X,
  ZoomIn,
  ChevronLeft,
  ChevronRight
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { deleteRequirement, startExtraction } from "../actions";
import { cn } from "@/lib/utils";
import { ComponentDetailModal, type ComponentDetail } from "./component-detail-modal";
import { RequirementDetailModal, type RequirementDetail } from "./requirement-detail-modal";

interface Requirement {
  id: string;
  title: string | null;
  requirement: string;
  status: string;
  context?: string | null;
  relevantFiles?: string[] | null;
  dependencies?: string[] | null;
  chatSummary?: string | null;
  createdAt: string | null;
}

interface ComponentInfo {
  name: string;
  description: string;
  filePath: string;
  dependencies?: string[];
}

interface SourceData {
  id: string;
  name: string;
  originUrl: string | null;
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
  // Multiple screenshots support
  allScreenshots?: string[];
}

interface RequirementsSidebarProps {
  source: SourceData | null;
  requirements: Requirement[];
  analysisContent: string | null;
  onRefresh: () => void;
  onComponentMention?: (componentName: string) => void;
}

export function RequirementsSidebar({
  source,
  requirements,
  analysisContent,
  onRefresh,
  onComponentMention,
}: RequirementsSidebarProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [showTechStack, setShowTechStack] = useState(false);
  const [showImageModal, setShowImageModal] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  
  // Modal state
  const [selectedComponent, setSelectedComponent] = useState<ComponentDetail | null>(null);
  const [selectedRequirement, setSelectedRequirement] = useState<RequirementDetail | null>(null);

  const components = source?.components || [];
  const techStack = source?.techStack || [];
  const dependencies = source?.dependencies || [];
  
  // Check if this is a visual source (screenshot or live_url)
  const isVisualSource = source?.inputType === "screenshot" || source?.inputType === "live_url";
  
  // Get all screenshots - check visualData.allScreenshots first, then allScreenshots, then single screenshotBase64
  const allScreenshots = source?.visualData?.allScreenshots && source.visualData.allScreenshots.length > 0 
    ? source.visualData.allScreenshots 
    : source?.allScreenshots && source.allScreenshots.length > 0
      ? source.allScreenshots
      : source?.visualData?.screenshotBase64 
        ? [source.visualData.screenshotBase64] 
        : [];
  
  const hasMultipleImages = allScreenshots.length > 1;
  
  const nextImage = () => {
    setCurrentImageIndex((prev) => (prev + 1) % allScreenshots.length);
  };
  
  const prevImage = () => {
    setCurrentImageIndex((prev) => (prev - 1 + allScreenshots.length) % allScreenshots.length);
  };

  // Filter components based on search
  const filteredComponents = components.filter(c => 
    c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (c.description && c.description.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const savedRequirements = requirements.filter((r) => r.status === "saved");
  const extractingRequirements = requirements.filter((r) => r.status === "extracting");

  const handleStartExtraction = async (reqId: string) => {
    await startExtraction(reqId);
    onRefresh();
  };

  const handleDelete = async (reqId: string) => {
    await deleteRequirement(reqId);
    onRefresh();
  };

  const handleComponentClick = (comp: ComponentInfo) => {
    setSelectedComponent({
      name: comp.name,
      description: comp.description,
      filePath: comp.filePath,
      dependencies: comp.dependencies,
    });
  };

  const handleRequirementClick = (req: Requirement) => {
    setSelectedRequirement(req as RequirementDetail);
  };

  return (
    <>
      <div className="w-80 bg-white border-r border-gray-200 flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-emerald-600 shadow-lg">
                <Sparkles className="w-4 h-4 text-white" />
              </div>
              <h2 className="font-semibold text-lg text-gray-900">Context</h2>
            </div>
            <Button 
              variant="ghost" 
              size="sm" 
              className={cn(
                "h-8 w-8 p-0 rounded-lg transition-colors",
                showTechStack ? "bg-emerald-100 text-emerald-600" : "text-gray-500 hover:text-gray-900 hover:bg-gray-100"
              )}
              onClick={() => setShowTechStack(!showTechStack)}
            >
              <Code2 size={16} />
            </Button>
          </div>
          
          {source?.originUrl ? (
            <a 
              href={source.originUrl} 
              target="_blank" 
              rel="noopener noreferrer" 
              className="text-sm text-gray-500 truncate hover:text-emerald-600 flex items-center gap-1 transition-colors"
            >
              {source.name}
              <ExternalLink className="w-3 h-3" />
            </a>
          ) : (
            <div className="flex items-center gap-2">
              {isVisualSource && (
                <Badge className="bg-purple-100 text-purple-700 border-purple-200 text-[10px]">
                  {source?.inputType === "screenshot" ? (
                    <><Camera className="w-3 h-3 mr-1" /> Screenshot</>
                  ) : (
                    <><Globe className="w-3 h-3 mr-1" /> Live URL</>
                  )}
                </Badge>
              )}
              <p className="text-sm text-gray-500 truncate">{source?.name || "Screenshot Analysis"}</p>
            </div>
          )}
          
          {/* Tech Stack & Dependencies */}
          {showTechStack && (techStack.length > 0 || dependencies.length > 0) && (
            <div className="mt-4 pt-4 border-t border-gray-200 space-y-4 animate-in slide-in-from-top-2 duration-200">
              {techStack.length > 0 && (
                <div>
                  <h3 className="text-[10px] font-semibold uppercase text-gray-500 mb-2 tracking-wider">Tech Stack</h3>
                  <div className="flex flex-wrap gap-1.5">
                    {techStack.map((tech) => (
                      <Badge key={tech} className="bg-emerald-100 text-emerald-700 border-emerald-200 text-[10px] px-2 py-0.5">
                        {tech}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
              {dependencies.length > 0 && (
                <div>
                  <h3 className="text-[10px] font-semibold uppercase text-gray-500 mb-2 tracking-wider">Dependencies</h3>
                  <div className="flex flex-wrap gap-1.5">
                    {dependencies.slice(0, 8).map((dep) => (
                      <Badge key={dep} className="bg-gray-100 text-gray-600 border-gray-200 text-[10px] px-2 py-0.5">
                        {dep}
                      </Badge>
                    ))}
                    {dependencies.length > 8 && (
                      <Badge className="bg-gray-50 text-gray-500 border-gray-200 text-[10px]">
                        +{dependencies.length - 8} more
                      </Badge>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        <ScrollArea className="flex-1">
          <div className="p-3 space-y-4">
            {/* Discovered Components */}
            <div className="border-b border-gray-200 pb-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-xs font-semibold uppercase text-gray-500 flex items-center gap-2 tracking-wider">
                  {isVisualSource ? (
                    <ImageIcon size={12} className="text-purple-600" />
                  ) : (
                    <Package size={12} className="text-emerald-600" />
                  )}
                  {isVisualSource ? "Reference Image" : "Components"}
                  {!isVisualSource && components.length > 0 && (
                    <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200 text-[10px] ml-1">
                      {components.length}
                    </Badge>
                  )}
                </h3>
              </div>
              
              {/* Screenshot Preview for Visual Sources */}
              {isVisualSource && allScreenshots.length > 0 && (
                <div className="mb-4">
                  {/* Image count badge */}
                  {hasMultipleImages && (
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs text-gray-500">
                        {currentImageIndex + 1} of {allScreenshots.length} images
                      </span>
                      <div className="flex gap-1">
                        {allScreenshots.map((_, idx) => (
                          <button
                            key={idx}
                            onClick={() => setCurrentImageIndex(idx)}
                            className={cn(
                              "w-2 h-2 rounded-full transition-colors",
                              idx === currentImageIndex 
                                ? "bg-purple-500" 
                                : "bg-gray-300 hover:bg-gray-400"
                            )}
                          />
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {/* Main image preview with navigation */}
                  <div className="relative">
                    <button
                      onClick={() => setShowImageModal(true)}
                      className="group relative w-full rounded-xl overflow-hidden border-2 border-gray-200 hover:border-purple-400 transition-all"
                    >
                      <img
                        src={allScreenshots[currentImageIndex]}
                        alt={`Screenshot ${currentImageIndex + 1}`}
                        className="w-full h-auto max-h-48 object-cover"
                      />
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-all flex items-center justify-center">
                        <div className="opacity-0 group-hover:opacity-100 transition-opacity bg-white rounded-full p-2 shadow-lg">
                          <ZoomIn className="w-5 h-5 text-gray-700" />
                        </div>
                      </div>
                      {currentImageIndex === 0 && hasMultipleImages && (
                        <span className="absolute top-2 left-2 px-1.5 py-0.5 bg-purple-500 text-white text-[10px] rounded">
                          Primary
                        </span>
                      )}
                    </button>
                    
                    {/* Navigation arrows */}
                    {hasMultipleImages && (
                      <>
                        <button
                          onClick={(e) => { e.stopPropagation(); prevImage(); }}
                          className="absolute left-1 top-1/2 -translate-y-1/2 p-1 bg-white/90 rounded-full shadow-md hover:bg-white transition-colors"
                        >
                          <ChevronLeft className="w-4 h-4 text-gray-700" />
                        </button>
                        <button
                          onClick={(e) => { e.stopPropagation(); nextImage(); }}
                          className="absolute right-1 top-1/2 -translate-y-1/2 p-1 bg-white/90 rounded-full shadow-md hover:bg-white transition-colors"
                        >
                          <ChevronRight className="w-4 h-4 text-gray-700" />
                        </button>
                      </>
                    )}
                  </div>
                  
                  {/* Thumbnail strip for multiple images */}
                  {hasMultipleImages && (
                    <div className="mt-2 flex gap-1.5 overflow-x-auto pb-1">
                      {allScreenshots.map((img, idx) => (
                        <button
                          key={idx}
                          onClick={() => setCurrentImageIndex(idx)}
                          className={cn(
                            "flex-shrink-0 w-12 h-12 rounded-lg overflow-hidden border-2 transition-all",
                            idx === currentImageIndex 
                              ? "border-purple-500 ring-1 ring-purple-300" 
                              : "border-gray-200 hover:border-gray-400"
                          )}
                        >
                          <img
                            src={img}
                            alt={`Thumbnail ${idx + 1}`}
                            className="w-full h-full object-cover"
                          />
                        </button>
                      ))}
                    </div>
                  )}
                  
                  {source?.visionAnalysis?.componentType && (
                    <div className="mt-2 p-2 bg-purple-50 border border-purple-200 rounded-lg">
                      <p className="text-xs font-medium text-purple-700">{source.visionAnalysis.componentType}</p>
                      {source.visionAnalysis.description && (
                        <p className="text-[10px] text-purple-600 mt-1 line-clamp-2">{source.visionAnalysis.description}</p>
                      )}
                    </div>
                  )}
                </div>
              )}
              
              {/* Components Search & List (GitHub mode) */}
              {!isVisualSource && (
                <>
                  {components.length > 0 && (
                    <div className="mb-3 relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400" />
                      <Input 
                        placeholder="Search components..." 
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="h-9 pl-9 text-xs bg-white border-gray-200 rounded-xl text-gray-900 placeholder:text-gray-400 focus:border-emerald-500 focus:ring-emerald-500/20"
                      />
                    </div>
                  )}

                  <div className="flex flex-wrap gap-1.5 max-h-48 overflow-y-auto pr-1">
                    {components.length === 0 ? (
                      <div className="text-center py-4 w-full">
                        <div className="p-3 rounded-2xl bg-gray-100 border border-gray-200 w-fit mx-auto mb-2">
                          <Layers className="w-4 h-4 text-gray-400" />
                        </div>
                        <p className="text-xs text-gray-500">No components discovered</p>
                      </div>
                    ) : filteredComponents.length === 0 ? (
                      <p className="text-xs text-gray-500 italic w-full text-center py-4">
                        No components match your search.
                      </p>
                    ) : (
                      filteredComponents.map((comp) => (
                        <button
                          key={comp.name}
                          onClick={() => handleComponentClick(comp)}
                          className="group px-2.5 py-1.5 bg-gray-50 border border-gray-200 rounded-lg text-xs text-gray-900 hover:bg-emerald-50 hover:border-emerald-300 hover:text-emerald-700 transition-all truncate max-w-full text-left"
                          title={comp.description || comp.filePath}
                        >
                          <span className="flex items-center gap-1.5">
                            <FileCode className="w-3 h-3 text-gray-400 group-hover:text-emerald-600 transition-colors" />
                            {comp.name}
                          </span>
                        </button>
                      ))
                    )}
                  </div>
                </>
              )}
              
              {/* No screenshot uploaded message */}
              {isVisualSource && allScreenshots.length === 0 && (
                <div className="text-center py-4 w-full">
                  <div className="p-3 rounded-2xl bg-purple-50 border border-purple-200 w-fit mx-auto mb-2">
                    <Camera className="w-4 h-4 text-purple-400" />
                  </div>
                  <p className="text-xs text-gray-500">No screenshot uploaded</p>
                </div>
              )}
            </div>

            {/* Saved Requirements */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-xs font-semibold uppercase text-gray-500 tracking-wider flex items-center gap-2">
                  <Zap size={12} className="text-blue-600" />
                  Saved Requirements
                </h3>
                <span className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">
                  {savedRequirements.length}
                </span>
              </div>

              {savedRequirements.length === 0 ? (
                <div className="text-xs text-gray-500 bg-gray-100 rounded-xl p-4 text-center">
                  No requirements saved yet. Chat with the AI to define what you want to extract.
                </div>
              ) : (
                <div className="space-y-2">
                  {savedRequirements.map((req) => (
                    <button
                      key={req.id}
                      onClick={() => handleRequirementClick(req)}
                      className="w-full text-left bg-gray-50 rounded-xl border border-gray-200 overflow-hidden hover:border-emerald-300 hover:bg-emerald-50 transition-all duration-200 p-3"
                    >
                      <div className="flex items-start gap-2">
                        <Zap className="w-4 h-4 text-emerald-600 mt-0.5 flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <h4 className="text-sm font-medium text-gray-900 truncate">
                            {req.title || "Untitled Requirement"}
                          </h4>
                          <p className="text-xs text-gray-500 mt-0.5 flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {req.createdAt
                              ? new Date(req.createdAt).toLocaleDateString()
                              : "Just now"}
                          </p>
                          <p className="text-xs text-gray-500 mt-1 line-clamp-2">
                            {req.requirement}
                          </p>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Extracting Requirements */}
            {extractingRequirements.length > 0 && (
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-xs font-semibold uppercase text-gray-500 tracking-wider">
                    Extracting
                  </h3>
                  <span className="text-xs text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full animate-pulse">
                    {extractingRequirements.length} active
                  </span>
                </div>

                <div className="space-y-2">
                  {extractingRequirements.map((req) => (
                    <button
                      key={req.id}
                      onClick={() => handleRequirementClick(req)}
                      className="w-full text-left bg-emerald-50 rounded-xl border border-emerald-200 p-3 hover:bg-emerald-100 transition-colors"
                    >
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-emerald-600 animate-pulse" />
                        <h4 className="text-sm font-medium text-emerald-700 truncate flex-1">
                          {req.title || "Extracting..."}
                        </h4>
                        <Eye className="w-3 h-3 text-emerald-600" />
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </ScrollArea>

        {/* Footer - Start Extraction CTA */}
        {savedRequirements.length > 0 && (
          <div className="p-3 border-t border-gray-200">
            <Button
              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg"
              onClick={() => {
                savedRequirements.forEach((req) => {
                  handleStartExtraction(req.id);
                });
              }}
            >
              <Rocket className="w-4 h-4 mr-2" />
              Extract All ({savedRequirements.length})
            </Button>
          </div>
        )}
      </div>

      {/* Component Detail Modal */}
      <ComponentDetailModal
        component={selectedComponent}
        onClose={() => setSelectedComponent(null)}
        onMentionInChat={(name) => {
          onComponentMention?.(name);
        }}
      />

      {/* Requirement Detail Modal */}
      <RequirementDetailModal
        requirement={selectedRequirement}
        onClose={() => setSelectedRequirement(null)}
        onExtract={handleStartExtraction}
        onDelete={handleDelete}
      />

      {/* Screenshot Image Modal */}
      {showImageModal && allScreenshots.length > 0 && (
        <div 
          className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4"
          onClick={() => setShowImageModal(false)}
        >
          <div className="relative max-w-4xl max-h-[90vh] overflow-auto" onClick={(e) => e.stopPropagation()}>
            <button
              onClick={() => setShowImageModal(false)}
              className="absolute top-4 right-4 p-2 bg-white rounded-full shadow-lg hover:bg-gray-100 transition-colors z-10"
            >
              <X className="w-5 h-5 text-gray-700" />
            </button>
            
            {/* Image counter */}
            {hasMultipleImages && (
              <div className="absolute top-4 left-4 px-3 py-1.5 bg-black/60 text-white text-sm rounded-full z-10">
                {currentImageIndex + 1} / {allScreenshots.length}
              </div>
            )}
            
            <img
              src={allScreenshots[currentImageIndex]}
              alt={`Screenshot ${currentImageIndex + 1} - full size`}
              className="rounded-xl shadow-2xl max-w-full max-h-[85vh] object-contain"
            />
            
            {/* Navigation arrows in modal */}
            {hasMultipleImages && (
              <>
                <button
                  onClick={prevImage}
                  className="absolute left-4 top-1/2 -translate-y-1/2 p-3 bg-white/90 rounded-full shadow-lg hover:bg-white transition-colors"
                >
                  <ChevronLeft className="w-6 h-6 text-gray-700" />
                </button>
                <button
                  onClick={nextImage}
                  className="absolute right-4 top-1/2 -translate-y-1/2 p-3 bg-white/90 rounded-full shadow-lg hover:bg-white transition-colors"
                >
                  <ChevronRight className="w-6 h-6 text-gray-700" />
                </button>
              </>
            )}
            
            {/* Thumbnail strip in modal */}
            {hasMultipleImages && (
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2 bg-black/60 p-2 rounded-xl">
                {allScreenshots.map((img, idx) => (
                  <button
                    key={idx}
                    onClick={() => setCurrentImageIndex(idx)}
                    className={cn(
                      "w-14 h-14 rounded-lg overflow-hidden border-2 transition-all",
                      idx === currentImageIndex 
                        ? "border-white ring-2 ring-purple-400" 
                        : "border-transparent opacity-70 hover:opacity-100"
                    )}
                  >
                    <img
                      src={img}
                      alt={`Thumbnail ${idx + 1}`}
                      className="w-full h-full object-cover"
                    />
                  </button>
                ))}
              </div>
            )}
            
            {source?.visionAnalysis?.componentType && !hasMultipleImages && (
              <div className="absolute bottom-4 left-4 right-4 bg-white/95 backdrop-blur-sm rounded-xl p-4 shadow-lg">
                <h3 className="font-semibold text-gray-900">{source.visionAnalysis.componentType}</h3>
                {source.visionAnalysis.description && (
                  <p className="text-sm text-gray-600 mt-1">{source.visionAnalysis.description}</p>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
