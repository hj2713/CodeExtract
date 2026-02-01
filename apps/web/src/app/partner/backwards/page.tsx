"use client";

import { Plus, RefreshCw } from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  createSubpage,
  getLocalRoutes,
  type LocalRoutesIndex,
  refreshRoutes,
} from "./route-actions";

// Subpage Card Component
function SubpageCard({ folder }: { folder: string }) {
  return (
    <Link href={`/partner/backwards/prototypes/${folder}` as any}>
      <Card className="cursor-pointer transition-all hover:border-primary/50 hover:shadow-md">
        <CardContent className="flex items-center justify-between py-4">
          <code className="rounded bg-muted px-2 py-1 text-sm">{folder}</code>
          <span className="text-muted-foreground text-xs">→</span>
        </CardContent>
      </Card>
    </Link>
  );
}

// Create Subpage Modal
function CreateModal({
  open,
  onClose,
  onCreated,
}: {
  open: boolean;
  onClose: () => void;
  onCreated: () => void;
}) {
  const [name, setName] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleCreate = async () => {
    if (!name.trim()) {
      return;
    }

    setIsCreating(true);
    setError(null);

    const result = await createSubpage(name.trim());

    if (result.success) {
      setName("");
      onCreated();
      onClose();
    } else {
      setError(result.error || "Failed to create subpage");
    }

    setIsCreating(false);
  };

  return (
    <Dialog onOpenChange={(o) => !o && onClose()} open={open}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create New Subpage</DialogTitle>
          <DialogDescription>
            Create a new subpage under backwards/. This will create a folder
            with a page.tsx file.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <label className="font-medium text-sm" htmlFor="name">
              Page Name
            </label>
            <Input
              id="name"
              onChange={(e) => setName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleCreate()}
              placeholder="My New Page"
              value={name}
            />
            {name && (
              <p className="text-muted-foreground text-xs">
                Will create folder:{" "}
                <code className="rounded bg-muted px-1">
                  {name
                    .toLowerCase()
                    .replace(/[^a-z0-9]+/g, "-")
                    .replace(/^-|-$/g, "")}
                </code>
              </p>
            )}
          </div>

          {error && <p className="text-destructive text-sm">{error}</p>}
        </div>

        <DialogFooter>
          <Button onClick={onClose} variant="outline">
            Cancel
          </Button>
          <Button disabled={!name.trim() || isCreating} onClick={handleCreate}>
            {isCreating ? "Creating..." : "Create"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default function Page() {

  // Local routes state
  const [routes, setRoutes] = useState<LocalRoutesIndex | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);

  const loadRoutes = useCallback(() => {
    getLocalRoutes().then(setRoutes);
  }, []);

  const handleRefresh = useCallback(async () => {
    const updated = await refreshRoutes();
    setRoutes(updated);
  }, []);

  useEffect(() => {
    loadRoutes();
  }, [loadRoutes]);

  return (
    <div className="min-h-screen">
      <div className="container mx-auto px-4 py-16">
        <div className="mx-auto max-w-4xl space-y-8">
          {/* Header */}
          <div className="space-y-2">
            <Badge variant="secondary">Demo</Badge>
            <h1 className="font-bold text-3xl tracking-tight">
              Backwards Demo
            </h1>
            <p className="text-muted-foreground text-sm">
              A self-contained example with server-side routes, dynamic
              subpages, and a dashboard.
            </p>
          </div>

          {/* Subpages Dashboard Section */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="font-semibold text-xl">Subpages</h2>
                <p className="text-muted-foreground text-sm">
                  Create and navigate to subpages. Data stored in local
                  routes.json.
                </p>
              </div>
              <div className="flex gap-2">
                <Button onClick={handleRefresh} size="sm" variant="outline">
                  <RefreshCw className="mr-1.5 h-4 w-4" />
                  Refresh
                </Button>
                <Button onClick={() => setShowCreateModal(true)} size="sm">
                  <Plus className="mr-1.5 h-4 w-4" />
                  New Page
                </Button>
              </div>
            </div>

            {routes && routes.items.length > 0 ? (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {routes.items.map((item) => (
                  <SubpageCard folder={item.folder} key={item.folder} />
                ))}
              </div>
            ) : (
              <Card className="border-dashed">
                <CardContent className="flex flex-col items-center justify-center py-8 text-center">
                  <p className="text-muted-foreground text-sm">
                    No subpages yet. Click &quot;New Page&quot; to create one.
                  </p>
                </CardContent>
              </Card>
            )}
          </div>

          <CreateModal
            onClose={() => setShowCreateModal(false)}
            onCreated={loadRoutes}
            open={showCreateModal}
          />
        </div>
      </div>
    </div>
  );
}
