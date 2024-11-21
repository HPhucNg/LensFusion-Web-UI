import "./globals.css";

export const metadata = {
  title: "LensFusion",
  description: "LensFusion AI Marketing Platform",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head className= "min-h-screen bg-gradient-to-r from-gray-900 via-gray-800 to-black text-white font-sans relative overflow-hidden">
        <link rel="icon" href="/icon.ico" />
      </head>
      <body>{children}</body>
    </html>
  );
}
