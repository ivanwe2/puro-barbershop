export default async function LegalLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <style>{`
        @media print {
          .prose a {
            color: #000;
            text-decoration: underline;
          }
          .prose a::after {
            content: " (" attr(href) ") ";
            font-size: 0.8em;
          }
          h1, h2, h3 {
            break-after: avoid;
          }
        }
      `}</style>
      {children}
    </>
  );
}
