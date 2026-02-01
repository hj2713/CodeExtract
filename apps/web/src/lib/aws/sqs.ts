import {
  SQSClient,
  SendMessageCommand,
  ReceiveMessageCommand,
  DeleteMessageCommand,
  GetQueueAttributesCommand,
} from "@aws-sdk/client-sqs";

const sqsClient = new SQSClient({
  region: process.env.APP_AWS_REGION || "us-east-2",
  credentials: {
    accessKeyId: process.env.APP_AWS_ACCESS_KEY!,
    secretAccessKey: process.env.APP_AWS_SECRET_KEY!,
  },
});

const QUEUE_URL = process.env.APP_SQS_QUEUE_URL!;

export interface SQSJobMessage {
  jobId: string;
  type: string;
  payload: Record<string, unknown>;
  priority?: number;
  createdAt: string;
}

/**
 * Send a job to SQS queue
 */
export async function sendToSQS(message: SQSJobMessage): Promise<string | undefined> {
  const command = new SendMessageCommand({
    QueueUrl: QUEUE_URL,
    MessageBody: JSON.stringify(message),
    MessageAttributes: {
      JobType: {
        DataType: "String",
        StringValue: message.type,
      },
      JobId: {
        DataType: "String",
        StringValue: message.jobId,
      },
    },
    // Higher priority jobs get lower delay (optional feature)
    DelaySeconds: message.priority && message.priority > 5 ? 0 : undefined,
  });

  const result = await sqsClient.send(command);
  console.log(`[SQS] Sent message ${result.MessageId} for job ${message.jobId}`);
  return result.MessageId;
}

/**
 * Receive messages from SQS queue (for worker processing)
 */
export async function receiveFromSQS(maxMessages = 1): Promise<
  Array<{
    message: SQSJobMessage;
    receiptHandle: string;
  }>
> {
  const command = new ReceiveMessageCommand({
    QueueUrl: QUEUE_URL,
    MaxNumberOfMessages: maxMessages,
    WaitTimeSeconds: 10, // Long polling - waits up to 10s for messages
    VisibilityTimeout: 300, // 5 minutes to process before message becomes visible again
    MessageAttributeNames: ["All"],
  });

  const result = await sqsClient.send(command);

  if (!result.Messages || result.Messages.length === 0) {
    return [];
  }

  return result.Messages.map((msg) => ({
    message: JSON.parse(msg.Body!) as SQSJobMessage,
    receiptHandle: msg.ReceiptHandle!,
  }));
}

/**
 * Delete a message from SQS after successful processing
 */
export async function deleteFromSQS(receiptHandle: string): Promise<void> {
  const command = new DeleteMessageCommand({
    QueueUrl: QUEUE_URL,
    ReceiptHandle: receiptHandle,
  });

  await sqsClient.send(command);
  console.log("[SQS] Message deleted after successful processing");
}

/**
 * Get queue statistics (for monitoring/dashboard)
 */
export async function getSQSStats(): Promise<{
  messagesAvailable: number;
  messagesInFlight: number;
  messagesDelayed: number;
}> {
  const command = new GetQueueAttributesCommand({
    QueueUrl: QUEUE_URL,
    AttributeNames: [
      "ApproximateNumberOfMessages",
      "ApproximateNumberOfMessagesNotVisible",
      "ApproximateNumberOfMessagesDelayed",
    ],
  });

  const result = await sqsClient.send(command);
  const attrs = result.Attributes || {};

  return {
    messagesAvailable: parseInt(attrs.ApproximateNumberOfMessages || "0"),
    messagesInFlight: parseInt(attrs.ApproximateNumberOfMessagesNotVisible || "0"),
    messagesDelayed: parseInt(attrs.ApproximateNumberOfMessagesDelayed || "0"),
  };
}
