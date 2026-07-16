"use client";

import { useState, useCallback, useRef } from "react";

const LOCATION_MAP: Record<string, { code: string; name: string }> = {
  "ShipTiresAZ.csv": { code: "AZ", name: "Phoenix, AZ" },
  "ShipTiresChicago.csv": { code: "CHI", name: "Chicago, IL" },
  "ShipTiresFL.csv": { code: "FL", name: "Miami, FL" },
  "ShipTiresGA.csv": { code: "GA", name: "Atlanta, GA" },
  "ShipTiresNH.csv": { code: "NH", name: "North Highlands, CA" },
  "ShipTiresNY.csv": { code: "NY", name: "New York, NY" },
  "ShipTiresOH.csv": { code: "OH", name: "Columbus, OH" },
  "ShipTiresPA.csv": { code: "PA", name: "Philadelphia, PA" },
  "ShipTiresTX.csv": { code: "TX", name: "Dallas, TX" },
};

interface LocationResult {
  code: string;
  name: string;
  totalRows: number;
  matched: number;
  unmatched: number;
}

interface ImportResult {
  locations: LocationResult[];
  totalMatched: number;
  totalUnmatched: number;
  inventoryUpdated: number;
  errors: number;
  errorMessages: string[];
}

export default function ExpressUploadPage() {
  const [files, setFiles] = useState<File[]>([]);
  const [dragging, setDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [result, setResult] = useState<ImportResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const addFiles = useCallback((newFiles: FileList | File[]) => {
    const csvFiles = Array.from(newFiles).filter((f) => f.name.endsWith(".csv"));
    if (csvFiles.length === 0) return;

    setFiles((prev) => {
      const existing = new Set(prev.map((f) => f.name));
      const toAdd = csvFiles.filter((f) => !existing.has(f.name));
      return [...prev, ...toAdd];
    });
    setResult(null);
    setError(null);
  }, []);

  const removeFile = (name: string) => {
    setFiles((prev) => prev.filter((f) => f.name !== name));
  };

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragging(false);
      addFiles(e.dataTransfer.files);
    },
    [addFiles]
  );

  const handleUpload = async () => {
    if (files.length === 0) return;
    setUploading(true);
    setResult(null);
    setError(null);

    try {
      const formData = new FormData();
      for (const file of files) {
        formData.append("files", file);
      }

      const res = await fetch("/api/admin/express-import", {
        method: "POST",
        body: formData,
      });

      const contentType = res.headers.get("content-type") || "";
      if (!contentType.includes("application/json")) {
        const text = await res.text();
        throw new Error(
          res.status === 504
            ? "Request timed out — the import is too large. Try uploading fewer files at once."
            : `Server returned ${res.status}: ${text.slice(0, 200)}`
        );
      }

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Import failed");
      } else {
        setResult(data as ImportResult);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Network error");
    } finally {
      setUploading(false);
    }
  };

  const recognizedCount = files.filter((f) => LOCATION_MAP[f.name]).length;
  const unrecognizedFiles = files.filter((f) => !LOCATION_MAP[f.name]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-gray-900">Express Tire Import</h1>
        <p className="text-sm text-gray-500 mt-1">
          Upload warehouse CSV files from Express Tire to update per-location inventory
        </p>
      </div>

      {/* Drop zone */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => inputRef.current?.click()}
        className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
          dragging
            ? "border-safety-orange bg-orange-50"
            : "border-gray-300 hover:border-gray-400 bg-white"
        }`}
      >
        <input
          ref={inputRef}
          type="file"
          accept=".csv"
          multiple
          onChange={(e) => {
            if (e.target.files) addFiles(e.target.files);
            e.target.value = "";
          }}
          className="hidden"
        />
        <svg
          className="mx-auto h-10 w-10 text-gray-400"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          strokeWidth={1.5}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5"
          />
        </svg>
        <p className="mt-2 text-sm text-gray-600">
          Drag and drop CSV files here, or click to browse
        </p>
        <p className="text-xs text-gray-400 mt-1">
          Expected: ShipTiresAZ.csv, ShipTiresChicago.csv, ShipTiresFL.csv, etc.
        </p>
      </div>

      {/* File list */}
      {files.length > 0 && (
        <div className="bg-white rounded-lg border border-gray-200 p-5">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-gray-700">
              {files.length} file{files.length !== 1 ? "s" : ""} selected
              {recognizedCount > 0 && (
                <span className="text-gray-400 font-normal">
                  {" "}
                  ({recognizedCount} of 9 locations)
                </span>
              )}
            </h2>
            <button
              onClick={() => {
                setFiles([]);
                setResult(null);
                setError(null);
              }}
              className="text-xs text-red-500 hover:text-red-700 font-medium"
            >
              Clear all
            </button>
          </div>

          <div className="space-y-1.5">
            {files.map((file) => {
              const loc = LOCATION_MAP[file.name];
              return (
                <div
                  key={file.name}
                  className="flex items-center justify-between py-1.5 px-3 rounded bg-gray-50 text-sm"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <svg
                      className="w-4 h-4 text-gray-400 shrink-0"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                      strokeWidth={1.5}
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z"
                      />
                    </svg>
                    <span className="truncate text-gray-700">{file.name}</span>
                    {loc ? (
                      <span className="inline-block px-2 py-0.5 rounded-full text-xs bg-green-100 text-green-700 shrink-0">
                        {loc.code} — {loc.name}
                      </span>
                    ) : (
                      <span className="inline-block px-2 py-0.5 rounded-full text-xs bg-yellow-100 text-yellow-700 shrink-0">
                        Unknown location
                      </span>
                    )}
                  </div>
                  <button
                    onClick={() => removeFile(file.name)}
                    className="text-gray-400 hover:text-red-500 ml-2 shrink-0"
                    title="Remove file"
                  >
                    <svg
                      className="w-4 h-4"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                      strokeWidth={1.5}
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              );
            })}
          </div>

          {unrecognizedFiles.length > 0 && (
            <p className="text-xs text-yellow-600 mt-3">
              {unrecognizedFiles.length} file{unrecognizedFiles.length !== 1 ? "s" : ""} not
              recognized — will be skipped during import
            </p>
          )}

          <div className="mt-4 flex items-center gap-3">
            <button
              onClick={handleUpload}
              disabled={uploading || recognizedCount === 0}
              className="px-5 py-2 bg-safety-orange text-white rounded font-medium text-sm hover:bg-orange-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {uploading ? "Importing..." : `Import ${recognizedCount} Location${recognizedCount !== 1 ? "s" : ""}`}
            </button>
            {uploading && (
              <span className="text-xs text-gray-500">
                Processing CSVs and updating Supabase — this may take a moment
              </span>
            )}
          </div>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="rounded-lg px-4 py-3 text-sm bg-red-50 border border-red-200 text-red-700">
          {error}
        </div>
      )}

      {/* Results */}
      {result && (
        <div className="space-y-4">
          {/* Summary card */}
          <div className="bg-white rounded-lg border border-gray-200 p-5">
            <h2 className="text-sm font-semibold text-gray-700 mb-3">Import Results</h2>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div>
                <p className="text-xs text-gray-500">Matched</p>
                <p className="text-lg font-bold text-green-700">{result.totalMatched.toLocaleString()}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Unmatched</p>
                <p className="text-lg font-bold text-yellow-600">{result.totalUnmatched.toLocaleString()}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Inventory Updated</p>
                <p className="text-lg font-bold text-blue-700">{result.inventoryUpdated.toLocaleString()}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Errors</p>
                <p className={`text-lg font-bold ${result.errors > 0 ? "text-red-600" : "text-gray-400"}`}>
                  {result.errors}
                </p>
              </div>
            </div>
          </div>

          {/* Per-location breakdown */}
          <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="py-2.5 px-4 text-left font-medium text-gray-500">Location</th>
                  <th className="py-2.5 px-4 text-right font-medium text-gray-500">Rows</th>
                  <th className="py-2.5 px-4 text-right font-medium text-gray-500">Matched</th>
                  <th className="py-2.5 px-4 text-right font-medium text-gray-500">Unmatched</th>
                  <th className="py-2.5 px-4 text-right font-medium text-gray-500">Match %</th>
                </tr>
              </thead>
              <tbody>
                {result.locations.map((loc) => {
                  const total = loc.matched + loc.unmatched;
                  const pct = total > 0 ? Math.round((loc.matched / total) * 100) : 0;
                  return (
                    <tr key={loc.code} className="border-b border-gray-100">
                      <td className="py-2 px-4 text-gray-700">
                        <span className="font-medium">{loc.code}</span>
                        <span className="text-gray-400 ml-1.5">{loc.name}</span>
                      </td>
                      <td className="py-2 px-4 text-right text-gray-600">{loc.totalRows.toLocaleString()}</td>
                      <td className="py-2 px-4 text-right text-green-700 font-medium">
                        {loc.matched.toLocaleString()}
                      </td>
                      <td className="py-2 px-4 text-right text-yellow-600">
                        {loc.unmatched.toLocaleString()}
                      </td>
                      <td className="py-2 px-4 text-right">
                        <span
                          className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${
                            pct >= 80
                              ? "bg-green-100 text-green-700"
                              : pct >= 50
                              ? "bg-yellow-100 text-yellow-700"
                              : "bg-red-100 text-red-700"
                          }`}
                        >
                          {pct}%
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Error messages */}
          {result.errorMessages.length > 0 && (
            <div className="bg-white rounded-lg border border-red-200 p-4">
              <h3 className="text-sm font-semibold text-red-700 mb-2">
                Error Details ({result.errorMessages.length})
              </h3>
              <div className="text-xs text-red-600 space-y-1 max-h-40 overflow-y-auto">
                {result.errorMessages.map((msg, i) => (
                  <p key={i}>{msg}</p>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
