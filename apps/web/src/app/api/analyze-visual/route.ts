import { NextRequest, NextResponse } from "next/server";
import { analyzeImage, generateVisualAnalysisMarkdown } from "@/lib/ai/vision-analyzer";
import { db, sources, eq } from "@my-better-t-app/db";
import { randomUUID } from "crypto";

export const maxDuration = 60;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { imageBase64, url, inputType, sourceId, allImages } = body;

    if (!imageBase64 && !url) {
      return NextResponse.json(
        { error: "Either imageBase64 or url is required" },
        { status: 400 }
      );
    }

    if (!inputType || !["screenshot", "live_url"].includes(inputType)) {
      return NextResponse.json(
        { error: "Invalid input type" },
        { status: 400 }
      );
    }

    let base64Image = imageBase64;
    let capturedUrl = url;
    let capturedHtml: string | null = null;
    
    // Extract all screenshot base64s from allImages array if provided
    const allScreenshots: string[] = allImages?.map((img: { base64: string }) => img.base64) || [];
    // Ensure the primary image is in the array
    if (base64Image && !allScreenshots.includes(base64Image)) {
      allScreenshots.unshift(base64Image);
    }

    // If it's a live URL, try to fetch HTML for context
    if (inputType === "live_url" && url) {
      try {
        const response = await fetch(url, {
          headers: {
            "User-Agent": "Mozilla/5.0 (compatible; CodeExtract/1.0)",
          },
        });
        capturedHtml = await response.text();
        capturedUrl = url;
        
        // If no base64 image provided, return guidance
        if (!base64Image) {
          return NextResponse.json({
            status: "needs_screenshot",
            message: "Please take a screenshot of the webpage and upload it for visual analysis.",
            capturedUrl,
          });
        }
      } catch (error) {
        console.error("Failed to fetch URL:", error);
        if (!base64Image) {
          return NextResponse.json(
            { error: "Could not access URL. Please upload a screenshot instead." },
            { status: 400 }
          );
        }
      }
    }

    // Ensure we have an image to analyze
    if (!base64Image) {
      return NextResponse.json(
        { error: "No image provided for analysis" },
        { status: 400 }
      );
    }

    // Analyze the image with Gemini Vision
    const visionAnalysis = await analyzeImage(base64Image);
    
    // Generate markdown summary for the chat
    const analysisMarkdown = generateVisualAnalysisMarkdown(visionAnalysis);

    // Create visual data object (matching schema type)
    const visualData = {
      screenshotBase64: base64Image,
      allScreenshots: allScreenshots.length > 0 ? allScreenshots : [base64Image],
      capturedUrl: capturedUrl || undefined,
      capturedHtml: capturedHtml ? capturedHtml.substring(0, 10000) : undefined,
    };

    // Format visionAnalysis to match schema type exactly
    const formattedVisionAnalysis = {
      componentType: visionAnalysis.componentType,
      description: visionAnalysis.description,
      layout: {
        type: visionAnalysis.layout.type as "flex" | "grid" | "absolute" | "block",
        direction: visionAnalysis.layout.direction,
        alignment: visionAnalysis.layout.alignItems,
        gap: visionAnalysis.layout.gap,
      },
      colors: {
        primary: visionAnalysis.colors.primary,
        secondary: visionAnalysis.colors.secondary,
        background: visionAnalysis.colors.background,
        text: visionAnalysis.colors.text,
        accent: visionAnalysis.colors.accent,
      },
      typography: {
        fontFamily: visionAnalysis.typography.fontFamily,
        heading: visionAnalysis.typography.heading,
        body: visionAnalysis.typography.body,
      },
      spacing: visionAnalysis.spacing,
      borders: visionAnalysis.borders,
      shadows: visionAnalysis.shadows,
      interactions: visionAnalysis.interactions.map(i => ({
        trigger: i.trigger as "hover" | "click" | "focus",
        effect: i.effect,
        timing: i.timing,
      })),
      animations: visionAnalysis.animations,
      responsive: visionAnalysis.responsive,
      accessibility: visionAnalysis.accessibility,
      assets: visionAnalysis.assets.map(a => ({
        type: a.type as "icon" | "image" | "illustration" | "logo",
        description: a.description,
        fallback: a.fallback,
      })),
    };

    // Derive name from component type or URL
    const imageCount = allScreenshots.length || 1;
    const sourceName = inputType === "live_url" && capturedUrl 
      ? new URL(capturedUrl).hostname
      : imageCount > 1 
        ? `${visionAnalysis.componentType} (${imageCount} images)`
        : `${visionAnalysis.componentType} Screenshot`;

    // Create or update source record
    let source;
    
    if (sourceId) {
      // Update existing source
      const [updated] = await db
        .update(sources)
        .set({
          inputType: inputType as "github" | "screenshot" | "live_url",
          visualData,
          visionAnalysis: formattedVisionAnalysis,
          analysisStatus: "analyzed",
          analysisMarkdown,
        })
        .where(eq(sources.id, sourceId))
        .returning();
      source = updated;
    } else {
      // Create new source
      const newId = randomUUID();
      const [created] = await db
        .insert(sources)
        .values({
          id: newId,
          name: sourceName,
          type: "github_repo", // Using github_repo as fallback since visual isn't in enum
          inputType: inputType as "github" | "screenshot" | "live_url",
          originUrl: capturedUrl || null,
          visualData,
          visionAnalysis: formattedVisionAnalysis,
          analysisStatus: "analyzed",
          analysisMarkdown,
        })
        .returning();
      source = created;
    }

    return NextResponse.json({
      success: true,
      sourceId: source.id,
      analysis: visionAnalysis,
      analysisMarkdown,
      componentType: visionAnalysis.componentType,
      description: visionAnalysis.description,
    });

  } catch (error) {
    console.error("Visual analysis error:", error);
    return NextResponse.json(
      { error: "Failed to analyze visual", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}
