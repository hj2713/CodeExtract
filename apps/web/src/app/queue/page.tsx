"use client";

import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Package } from "lucide-react";

function QueueContent() {
  const searchParams = useSearchParams();
  const jobIds = searchParams.get("jobIds")?.split(",") || [];

  return (
    <div className="min-h-screen p-8 bg-muted/20">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center gap-3 mb-8">
          <div className="h-10 w-10 bg-blue-600 rounded-lg flex items-center justify-center text-white font-bold">
            P4
          </div>
          <div>
            <h1 className="text-2xl font-bold">Phase 4: Extraction Queue</h1>
            <p className="text-muted-foreground">Processing queued components...</p>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Package className="h-5 w-5" />
              Queued Jobs ({jobIds.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {jobIds.length === 0 ? (
              <p className="text-sm text-yellow-600 bg-yellow-50 p-3 rounded border border-yellow-200">
                No job IDs received. Something went wrong with the navigation.
              </p>
            ) : (
              <div className="space-y-2">
                {jobIds.map((id) => (
                  <div key={id} className="p-3 bg-background border rounded flex items-center justify-between font-mono text-sm">
                    <span className="text-muted-foreground">ID:</span>
                    <span className="font-medium">{id}</span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default function QueuePage() {
  return (
    <Suspense fallback={<div>Loading queue...</div>}>
      <QueueContent />
    </Suspense>
  );
}
