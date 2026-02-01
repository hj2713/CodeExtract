import { NextResponse } from "next/server";
import { getSQSStats } from "@/lib/aws/sqs";

export async function GET() {
  try {
    const sqsStats = await getSQSStats();

    return NextResponse.json({
      success: true,
      sqs: {
        queueUrl: process.env.AWS_SQS_QUEUE_URL,
        ...sqsStats,
      },
      s3: {
        bucket: process.env.AWS_S3_BUCKET,
        region: process.env.AWS_REGION,
      },
    });
  } catch (error) {
    console.error("AWS stats error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Failed to get AWS stats",
      },
      { status: 500 }
    );
  }
}
