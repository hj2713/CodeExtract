"use client";

import { useHelloWorld } from "./hooks";

export default function Page() {
  const hello = useHelloWorld();

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 p-4">
      <div>{hello.data}</div>
      <button disabled={hello.isPending} onClick={() => hello.mutate()} type="button" >
        {hello.isPending ? "Loading..." : "Hello World"}
      </button>
    </div>
  );
}
