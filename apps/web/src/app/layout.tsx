import type { Metadata } from "next";

import { Inter, JetBrains_Mono } from "next/font/google";

import "@/index.css";
import { Providers } from "@/components/providers";

const inter = Inter({
	variable: "--font-inter",
	subsets: ["latin"],
	weight: ["400", "500", "600", "700"],
});

const jetbrainsMono = JetBrains_Mono({
	variable: "--font-mono",
	subsets: ["latin"],
	weight: ["400", "500", "600"],
});

export const metadata: Metadata = {
	title: "CodeExtract",
	description: "Extract and recreate UI components from any source",
};

export default async function RootLayout({
	children,
}: Readonly<{
	children: React.ReactNode;
}>) {
	return (
		<html lang="en" suppressHydrationWarning>
			<body
				className={`${inter.variable} ${jetbrainsMono.variable} antialiased`}
				style={{ fontFamily: 'var(--font-inter), system-ui, sans-serif' }}
			>
				<Providers>
					<div className="grid h-full grid-rows-[auto_1fr]">
						{/* <Header /> */}
						{children}
					</div>
				</Providers>
			</body>
		</html>
	);
}
