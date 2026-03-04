"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { FileText, Loader2 } from "lucide-react";
import type { LightboxRendererProps } from "../types";
import { Button } from "@/components/ui/button";
import { useAuthorizedFileUrl } from "../hooks/useAuthorizedFileUrl";
import {
  fetchS3FileAsArrayBuffer,
  fetchS3FileAsText,
} from "../../utils/s3-file-handler";
import { cn } from "@/lib/utils";
import JSZip from "jszip";
import Papa from "papaparse";
import { useLightboxScroll } from "../context/scroll-context";

type ParsedContent = {
  type: "text" | "csv" | "docx";
  content: string;
  csvData?: Array<Record<string, string>>;
};

/**
 * Extract text content from a .docx file using JSZip
 */
async function parseDocx(arrayBuffer: ArrayBuffer): Promise<string> {
  try {
    const zip = await JSZip.loadAsync(arrayBuffer);
    const documentXml = await zip.file("word/document.xml")?.async("text");

    if (!documentXml) {
      throw new Error("Could not find document.xml in .docx file");
    }

    // Parse XML and extract text from <w:t> tags
    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(documentXml, "text/xml");
    const textNodes = xmlDoc.getElementsByTagName("w:t");

    const paragraphs: string[] = [];
    let currentParagraph = "";

    for (let i = 0; i < textNodes.length; i++) {
      const textContent = textNodes[i].textContent || "";
      currentParagraph += textContent;

      // Check if this is the end of a paragraph
      const parent = textNodes[i].parentElement;
      const nextSibling = parent?.nextSibling;

      if (!nextSibling || nextSibling.nodeName === "w:p") {
        if (currentParagraph.trim()) {
          paragraphs.push(currentParagraph.trim());
        }
        currentParagraph = "";
      }
    }

    // Add any remaining text
    if (currentParagraph.trim()) {
      paragraphs.push(currentParagraph.trim());
    }

    return paragraphs.join("\n\n");
  } catch (error) {
    console.error("[DocumentRenderer] Failed to parse .docx:", error);
    throw new Error("Failed to parse .docx file");
  }
}

/**
 * Parse CSV content using papaparse
 */
function parseCsv(text: string): Array<Record<string, string>> {
  const result = Papa.parse<Record<string, string>>(text, {
    header: true,
    skipEmptyLines: true,
    dynamicTyping: false,
  });

  if (result.errors.length > 0) {
    console.warn("[DocumentRenderer] CSV parsing warnings:", result.errors);
  }

  return result.data;
}

/**
 * Document renderer for lightbox
 * Supports .docx, .csv, and .txt files with preview
 */
export function DocumentRenderer({
  file,
  isActive: _isActive,
  onLoad,
  onError,
}: LightboxRendererProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [parsedContent, setParsedContent] = useState<ParsedContent | null>(
    null,
  );
  const { setHasScrolled } = useLightboxScroll();
  const setHasScrolledRef = useRef(setHasScrolled);
  const { authorizedUrl, isRefreshing } = useAuthorizedFileUrl(file.url);

  // Keep ref up to date
  useEffect(() => {
    setHasScrolledRef.current = setHasScrolled;
  }, [setHasScrolled]);

  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    const target = e.currentTarget;
    setHasScrolledRef.current(target.scrollTop > 10);
  }, []);

  const getFileExtension = useCallback((filename: string): string => {
    return filename.split(".").pop()?.toLowerCase() || "";
  }, []);

  const fetchAndParseDocument = useCallback(async (url: string) => {
    setIsLoading(true);
    setHasError(false);
    setErrorMessage(null);

    try {
      const ext = getFileExtension(file.name);

      if (ext === "docx") {
        const result = await fetchS3FileAsArrayBuffer(url, {
          onRetry: (attempt) => {
            console.log(
              `[DocumentRenderer] Retrying fetch, attempt ${attempt}...`,
            );
          },
          onUrlRefresh: (_newUrl) => {
            console.log("[DocumentRenderer] URL refreshed successfully");
          },
        });
        const text = await parseDocx(result.data);
        setParsedContent({ type: "docx", content: text });
      } else if (ext === "csv") {
        const result = await fetchS3FileAsText(url, {
          onRetry: (attempt) => {
            console.log(
              `[DocumentRenderer] Retrying fetch, attempt ${attempt}...`,
            );
          },
          onUrlRefresh: (_newUrl) => {
            console.log("[DocumentRenderer] URL refreshed successfully");
          },
        });
        const csvData = parseCsv(result.data);
        setParsedContent({ type: "csv", content: result.data, csvData });
      } else if (ext === "txt") {
        const result = await fetchS3FileAsText(url, {
          onRetry: (attempt) => {
            console.log(
              `[DocumentRenderer] Retrying fetch, attempt ${attempt}...`,
            );
          },
          onUrlRefresh: (_newUrl) => {
            console.log("[DocumentRenderer] URL refreshed successfully");
          },
        });
        setParsedContent({ type: "text", content: result.data });
      } else {
        throw new Error(`Unsupported file extension: ${ext}`);
      }

      setIsLoading(false);
      onLoad?.();
    } catch (error) {
      console.error(
        "[DocumentRenderer] Failed to fetch/parse document:",
        error,
      );
      setIsLoading(false);
      setHasError(true);
      setErrorMessage(
        error instanceof Error ? error.message : "Failed to load document",
      );
      onError?.(error instanceof Error ? error : new Error(String(error)));
    }
  }, [file.name, getFileExtension, onLoad, onError]);

  // Fetch and parse document when URL changes
  useEffect(() => {
    if (authorizedUrl && !isRefreshing) {
      fetchAndParseDocument(authorizedUrl);
    }
  }, [authorizedUrl, isRefreshing, fetchAndParseDocument]);

  const handleRetry = () => {
    fetchAndParseDocument(authorizedUrl);
  };

  if (isLoading || isRefreshing) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-3">
        <Loader2 className="w-8 h-8 stroke-icon animate-spin" />
        <div className="text-sm text-secondary">
          {isRefreshing ? "Refreshing URL..." : "Loading document..."}
        </div>
      </div>
    );
  }

  if (hasError) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-4 px-8 text-center">
        <FileText className="w-16 h-16 stroke-icon opacity-50" />
        <div className="text-sm text-secondary">
          {errorMessage || "Failed to load document"}
        </div>
        <Button
          onClick={handleRetry}
          variant="brand"
          size="sm"
        >
          Retry
        </Button>
      </div>
    );
  }

  if (!parsedContent) {
    return null;
  }

  // CSV needs full width, documents need constrained width
  const isCsv = parsedContent.type === "csv";

  return (
    <div 
      className="w-full h-full max-h-full overflow-y-auto overflow-x-hidden"
      onScroll={handleScroll}
    >
      {/* Content container - full width for CSV, centered with max-width for documents */}
      <div className="min-h-full flex items-center justify-center p-6">
        <div
          className={cn(
            "w-full bg-muted/30 rounded-sm ",
            !isCsv && "max-w-4xl",
          )}
        >
          {parsedContent.type === "csv" && parsedContent.csvData
            ? (
              <div className="overflow-x-auto">
                <table className="w-full border-collapse text-sm">
                  <thead>
                    <tr className="border-b border-border">
                      {Object.keys(parsedContent.csvData[0] || {}).map((
                        header,
                      ) => (
                        <th
                          key={header}
                          className="text-left px-3 py-2 font-medium text-primary bg-muted wrap-break-word whitespace-nowrap"
                        >
                          {header}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {parsedContent.csvData.map((row, idx) => (
                      <tr
                        key={idx}
                        className="border-b border-border hover:bg-hover"
                      >
                        {Object.values(row).map((cell, cellIdx) => (
                          <td
                            key={cellIdx}
                            className="px-3 py-2 text-primary whitespace-nowrap"
                          >
                            {cell}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )
            : parsedContent.type === "docx"
            ? (
              <div className="p-8">
                <div className="prose prose-sm max-w-none text-primary">
                  {parsedContent.content.split("\n\n").map((paragraph, idx) => (
                    <p key={idx} className="mb-4 leading-relaxed">
                      {paragraph}
                    </p>
                  ))}
                </div>
              </div>
            )
            : (
              <div className="p-8">
                <pre className="whitespace-pre-wrap wrap-break-word font-mono text-sm text-primary leading-relaxed">
                  {parsedContent.content}
                </pre>
              </div>
            )}
        </div>
      </div>
    </div>
  );
}
