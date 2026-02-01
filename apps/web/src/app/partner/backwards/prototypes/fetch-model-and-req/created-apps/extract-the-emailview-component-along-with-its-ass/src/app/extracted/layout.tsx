import "./globals.css";

export const metadata = {
  title: "EmailView Component Demo",
  description: "Extracted EmailView component from EchoPilot",
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <body>{children}</body>
    </html>
  );
}
