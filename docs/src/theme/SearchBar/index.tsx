import React, {useEffect, useMemo, useRef, useState} from "react";
import Link from "@docusaurus/Link";
import {usePluginData} from "@docusaurus/useGlobalData";
import type {SearchIndexItem} from "../../../plugins/localSearch";

type SearchResult = SearchIndexItem & {
  score: number;
  snippet: string;
};

const MAX_RESULTS = 8;

function normalize(value: string): string {
  return value.toLowerCase();
}

function createSnippet(item: SearchIndexItem, query: string): string {
  const haystacks = [item.description, ...item.headings, item.text].filter(
    Boolean,
  );
  const normalizedQuery = normalize(query);
  const match = haystacks.find((value) =>
    normalize(value).includes(normalizedQuery),
  );
  const source = match ?? (item.description || item.text);
  const index = normalize(source).indexOf(normalizedQuery);

  if (index === -1) {
    return source.slice(0, 140);
  }

  const start = Math.max(index - 45, 0);
  const end = Math.min(index + normalizedQuery.length + 95, source.length);
  const prefix = start > 0 ? "... " : "";
  const suffix = end < source.length ? " ..." : "";

  return `${prefix}${source.slice(start, end).trim()}${suffix}`;
}

function scoreItem(item: SearchIndexItem, terms: string[], query: string): number {
  const title = normalize(item.title);
  const description = normalize(item.description);
  const headings = normalize(item.headings.join(" "));
  const text = normalize(item.text);
  const searchable = `${title} ${description} ${headings} ${text}`;

  if (!terms.every((term) => searchable.includes(term))) {
    return 0;
  }

  let score = 1;

  if (title === query) {
    score += 80;
  } else if (title.startsWith(query)) {
    score += 50;
  } else if (title.includes(query)) {
    score += 35;
  }

  for (const term of terms) {
    if (title.includes(term)) {
      score += 16;
    }

    if (headings.includes(term)) {
      score += 9;
    }

    if (description.includes(term)) {
      score += 6;
    }

    if (text.includes(term)) {
      score += 2;
    }
  }

  return score;
}

function getSearchResults(
  items: SearchIndexItem[],
  query: string,
): SearchResult[] {
  const normalizedQuery = normalize(query.trim());

  if (normalizedQuery.length < 2) {
    return [];
  }

  const terms = normalizedQuery.split(/\s+/).filter(Boolean);

  return items
    .map((item) => ({
      ...item,
      score: scoreItem(item, terms, normalizedQuery),
      snippet: createSnippet(item, normalizedQuery),
    }))
    .filter((item) => item.score > 0)
    .sort((a, b) => b.score - a.score || a.title.localeCompare(b.title))
    .slice(0, MAX_RESULTS);
}

export default function SearchBar(): React.ReactNode {
  const searchIndex =
    (usePluginData("lighty-local-search") as SearchIndexItem[] | undefined) ??
    [];
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [query, setQuery] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const results = useMemo(
    () => getSearchResults(searchIndex, query),
    [query, searchIndex],
  );
  const hasQuery = query.trim().length >= 2;

  useEffect(() => {
    function onDocumentPointerDown(event: PointerEvent) {
      if (!containerRef.current?.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    document.addEventListener("pointerdown", onDocumentPointerDown);

    return () => {
      document.removeEventListener("pointerdown", onDocumentPointerDown);
    };
  }, []);

  useEffect(() => {
    setActiveIndex(0);
  }, [query]);

  function closeSearch() {
    setIsOpen(false);
    inputRef.current?.blur();
  }

  function onKeyDown(event: React.KeyboardEvent<HTMLInputElement>) {
    if (event.key === "Escape") {
      closeSearch();
      return;
    }

    if (event.key === "ArrowDown") {
      event.preventDefault();
      setIsOpen(true);
      setActiveIndex((index) => Math.min(index + 1, results.length - 1));
      return;
    }

    if (event.key === "ArrowUp") {
      event.preventDefault();
      setActiveIndex((index) => Math.max(index - 1, 0));
      return;
    }

    if (event.key === "Enter" && results[activeIndex]) {
      window.location.assign(results[activeIndex].permalink);
    }
  }

  return (
    <div className="local-search" ref={containerRef}>
      <label className="local-search__label" htmlFor="local-search-input">
        Search docs
      </label>
      <input
        aria-autocomplete="list"
        aria-controls="local-search-results"
        aria-expanded={isOpen && hasQuery}
        aria-label="Search docs"
        autoComplete="off"
        className="local-search__input"
        id="local-search-input"
        onChange={(event) => {
          setQuery(event.target.value);
          setIsOpen(true);
        }}
        onFocus={() => setIsOpen(true)}
        onKeyDown={onKeyDown}
        placeholder="Search"
        ref={inputRef}
        role="combobox"
        type="search"
        value={query}
      />
      {isOpen && hasQuery && (
        <div
          className="local-search__results"
          id="local-search-results"
          role="listbox">
          {results.length > 0 ? (
            results.map((result, index) => (
              <Link
                aria-selected={activeIndex === index}
                className="local-search__result"
                key={result.permalink}
                onClick={closeSearch}
                onMouseEnter={() => setActiveIndex(index)}
                role="option"
                to={result.permalink}>
                <span className="local-search__result-title">
                  {result.title}
                </span>
                <span className="local-search__result-snippet">
                  {result.snippet}
                </span>
              </Link>
            ))
          ) : (
            <div className="local-search__empty" role="status">
              No results
            </div>
          )}
        </div>
      )}
    </div>
  );
}
