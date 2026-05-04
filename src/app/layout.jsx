import "./globals.css";

export const metadata = {
  title: "University Management System",
  description: "Sprint 1 community module implementation",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
