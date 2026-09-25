"use client";

export default function GlobalError({ unstable_retry }: { error: Error & { digest?: string }; unstable_retry: () => void }) {
  return (
    <html lang="en">
      <body style={{ fontFamily: "system-ui, sans-serif", background: "#f6f7fb", color: "#161d2e", margin: 0 }}>
        <main style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
          <div style={{ maxWidth: 440, textAlign: "center" }}>
            <h1 style={{ fontFamily: "Georgia, serif", fontSize: 28, margin: "0 0 8px" }}>Something went wrong</h1>
            <p style={{ color: "#5b6478", lineHeight: 1.6, margin: "0 0 24px" }}>
              FairAudit hit an unexpected error. No data was changed. Please try again.
            </p>
            <button
              onClick={() => unstable_retry()}
              style={{ background: "#1f3563", color: "white", border: 0, borderRadius: 10, padding: "10px 20px", fontSize: 14, cursor: "pointer" }}
            >
              Try again
            </button>
          </div>
        </main>
      </body>
    </html>
  );
}
