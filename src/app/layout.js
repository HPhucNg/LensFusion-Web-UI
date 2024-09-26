import "./globals.css";

export const metadata = {
  title: "LensFusion",
  description: "LensFusion AI Marketing Platform",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
