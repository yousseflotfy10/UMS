import "./globals.css";

export const metadata = {
  title: "UMS",
  description: "University Management System",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
