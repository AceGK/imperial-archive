// components/algolia/Pagination/index.tsx
"use client";

import React from "react";
import { usePagination } from "react-instantsearch";
import styles from "./styles.module.scss";

type PaginationProps = {
  maxPagesDesktop?: number;
  maxPagesMobile?: number;
};

export function Pagination({ 
  maxPagesDesktop = 7, 
  maxPagesMobile = 3 
}: PaginationProps) {
  const { currentRefinement, nbPages, pages, isFirstPage, isLastPage, refine } =
    usePagination();

  if (nbPages <= 1) return null;

  // Show fewer pages on mobile
  const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;
  const maxPagesToShow = isMobile ? maxPagesMobile : maxPagesDesktop;
  
  // Calculate which pages to show
  let visiblePages = pages;
  if (pages.length > maxPagesToShow) {
    const halfWindow = Math.floor(maxPagesToShow / 2);
    let start = Math.max(0, currentRefinement - halfWindow);
    let end = Math.min(pages.length, start + maxPagesToShow);
    
    // Adjust start if we're near the end
    if (end - start < maxPagesToShow) {
      start = Math.max(0, end - maxPagesToShow);
    }
    
    visiblePages = pages.slice(start, end);
  }

  return (
    <div className={styles.pagination}>
      <button
        onClick={() => refine(currentRefinement - 1)}
        disabled={isFirstPage}
        className={styles.paginationButton}
        aria-label="Previous page"
      >
        <span className={styles.paginationButtonText}>Previous</span>
        <span className={styles.paginationButtonIcon}>‹</span>
      </button>

      <div className={styles.paginationPages}>
        {visiblePages.map((page) => (
          <button
            key={page}
            onClick={() => refine(page)}
            className={`${styles.paginationButton} ${
              page === currentRefinement ? styles.active : ""
            }`}
            aria-label={`Page ${page + 1}`}
            aria-current={page === currentRefinement ? "page" : undefined}
          >
            {page + 1}
          </button>
        ))}
      </div>

      <button
        onClick={() => refine(currentRefinement + 1)}
        disabled={isLastPage}
        className={styles.paginationButton}
        aria-label="Next page"
      >
        <span className={styles.paginationButtonText}>Next</span>
        <span className={styles.paginationButtonIcon}>›</span>
      </button>
    </div>
  );
}