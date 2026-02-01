import { NextResponse } from "next/server";
import { getSQSStats } from "@/lib/aws/sqs";

export async function GET() {
  try {
    const sqsStats = await getSQSStats();

    return NextResponse.json({
      success: true,
      sqs: {
        queueUrl: process.env.APP_SQS_QUEUE_URL,
        ...sqsStats,
      },
      s3: {
        bucket: process.env.APP_S3_BUCKET,
        region: process.env.APP_AWS_REGION,
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
