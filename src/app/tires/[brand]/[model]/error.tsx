"use client";

export default function ModelPageError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div style={{ padding: "2rem", fontFamily: "monospace" }}>
      <h1 style={{ color: "red" }}>Client Component Error</h1>
      <pre
        style={{
          whiteSpace: "pre-wrap",
          background: "#f5f5f5",
          padding: "1rem",
          borderRadius: "8px",
        }}
      >
        {error.message}
      </pre>
      {error.digest && <p>Digest: {error.digest}</p>}
      <details>
        <summary>Stack trace</summary>
        <pre style={{ whiteSpace: "pre-wrap", fontSize: "12px" }}>
          {error.stack}
        </pre>
      </details>
      <button
        onClick={reset}
        style={{
          marginTop: "1rem",
          padding: "0.5rem 1rem",
          background: "#333",
          color: "white",
          border: "none",
          borderRadius: "4px",
          cursor: "pointer",
        }}
      >
        Try Again
      </button>
    </div>
  );
}
