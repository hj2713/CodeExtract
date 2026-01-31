"use client";

import { useMutation } from "@tanstack/react-query";
import { helloWorld } from "./actions";

export function useHelloWorld() {
  return useMutation({ mutationFn: helloWorld });
}
