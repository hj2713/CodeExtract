"use server";

export async function helloWorld() {
  await new Promise((resolve) => setTimeout(resolve, 1));
  return "hello world";
}
