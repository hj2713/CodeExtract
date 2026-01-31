"use client";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useHelloWorld } from "./hooks";

export default function Page() {
  const hello = useHelloWorld();

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 p-4">
      <Card className="h-64 w-full max-w-md overflow-auto p-4 font-mono text-sm">
        {hello.data ? (
          <div>{hello.data}</div>
        ) : (
          <span className="text-muted-foreground">No response yet</span>
        )}
      </Card>
      <Button disabled={hello.isPending} onClick={() => hello.mutate()}>
        {hello.isPending ? "Loading..." : "Hello World"}
      </Button>
    </div>
  );
}
