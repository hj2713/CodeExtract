"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ThemeProvider } from "next-themes";
import { Toaster } from "sonner";
import { useState } from "react";

export function Providers({ children }: { children: React.ReactNode }) {
	const [queryClient] = useState(() => new QueryClient());

	return (
		<ThemeProvider attribute="class" defaultTheme="light" enableSystem={false} forcedTheme="light">
			<QueryClientProvider client={queryClient}>
				{children}
				<Toaster richColors />
			</QueryClientProvider>
		</ThemeProvider>
	);
}
