import { Html, Head, Main, NextScript } from "next/document";

export default function Document() {
  return (
    <Html lang="en" className="scroll-smooth">
      <Head>
        <meta name="theme-color" content="#020617" />
        <meta name="description" content="AI-Powered Smart Payment and Fraud Detection Platform" />
      </Head>
      <body className="bg-[#020617] text-slate-100 min-h-screen antialiased">
        <Main />
        <NextScript />
      </body>
    </Html>
  );
}
