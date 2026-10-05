"use client";

import type { Route } from "next";
import { usePathname, useRouter } from "next/navigation";
import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";

export type BookSectionHref = "/learn/challenge" | "/learn/self-study" | "/learn/wrong-notes";

const sectionOrder: BookSectionHref[] = ["/learn/challenge", "/learn/self-study", "/learn/wrong-notes"];

type TurnState = {
  direction: "forward" | "backward";
  fromLabel: string;
  targetLabel: string;
} | null;

type BookTurnContextValue = {
  turning: boolean;
  turnTo: (href: BookSectionHref, targetLabel: string) => void;
};

const BookTurnContext = createContext<BookTurnContextValue | null>(null);

function sectionIndex(pathname: string) {
  return sectionOrder.findIndex((route) => pathname === route || pathname.startsWith(`${route}/`));
}

function sectionLabel(pathname: string) {
  if (pathname.startsWith("/learn/challenge")) return "오늘의 챌린지";
  if (pathname.startsWith("/learn/self-study")) return "스스로 유형 학습";
  if (pathname.startsWith("/learn/wrong-notes")) return "오답노트";
  return "학생의 문법 학습 공간";
}

export function LearningBookShell({ children }: Readonly<{ children: React.ReactNode }>) {
  const pathname = usePathname();
  const router = useRouter();
  const [turn, setTurn] = useState<TurnState>(null);
  const timers = useRef<number[]>([]);

  const clearTimers = useCallback(() => {
    timers.current.forEach((timer) => window.clearTimeout(timer));
    timers.current = [];
  }, []);

  useEffect(() => clearTimers, [clearTimers]);

  const turnTo = useCallback((href: BookSectionHref, targetLabel: string) => {
    if (turn || pathname === href) return;
    const fromIndex = sectionIndex(pathname);
    const targetIndex = sectionIndex(href);
    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    if (prefersReducedMotion || fromIndex < 0 || targetIndex < 0) {
      router.push(href as Route);
      return;
    }

    clearTimers();
    setTurn({
      direction: targetIndex > fromIndex ? "forward" : "backward",
      fromLabel: sectionLabel(pathname),
      targetLabel
    });
    timers.current.push(window.setTimeout(() => router.push(href as Route), 390));
    timers.current.push(window.setTimeout(() => setTurn(null), 920));
  }, [clearTimers, pathname, router, turn]);

  return (
    <BookTurnContext.Provider value={{ turning: turn !== null, turnTo }}>
      <div aria-busy={turn !== null} className="learning-book-shell">
        {children}
        {turn && (
          <div aria-live="polite" className={`book-turn-transition direction-${turn.direction}`} role="status">
            <span className="book-turn-announcement">{turn.targetLabel}으로 책장을 넘기는 중입니다.</span>
            <div className="book-turn-spine" aria-hidden="true" />
            <div className="book-turn-sheet" aria-hidden="true">
              <div className="book-turn-face book-turn-front"><small>문득문득</small><strong>{turn.fromLabel}</strong><i /></div>
              <div className="book-turn-face book-turn-back"><small>다음 장</small><strong>{turn.targetLabel}</strong><i /></div>
            </div>
          </div>
        )}
      </div>
    </BookTurnContext.Provider>
  );
}

export function useBookTurn() {
  const context = useContext(BookTurnContext);
  if (!context) throw new Error("useBookTurn must be used inside LearningBookShell");
  return context;
}
