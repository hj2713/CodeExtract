import type { Metadata } from "next";

import { Geist, Geist_Mono, Noto_Sans } from "next/font/google";

import "@/index.css";
import { Providers } from "@/components/providers";

const geistSans = Geist({
	variable: "--font-geist-sans",
	subsets: ["latin"],
});

const geistMono = Geist_Mono({
	variable: "--font-geist-mono",
	subsets: ["latin"],
});

const notoSans = Noto_Sans({ variable: '--font-sans' });

export const metadata: Metadata = {
	title: "product",
	description: "product",
};

export default async function RootLayout({
	children,
}: Readonly<{
	children: React.ReactNode;
}>) {
	return (
		<html lang="en" suppressHydrationWarning>
			<body
				className={`${geistSans.variable} ${geistMono.variable} antialiased`}
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
