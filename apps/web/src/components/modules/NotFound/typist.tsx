import type { CSSProperties, ReactNode } from "react";
import styles from "./styles.module.scss";

/**
 * Splits text into characters that appear one after another, like a terminal
 * typing it out. Each character gets its own CSS animation delay, so the
 * effect needs no JavaScript and the server-rendered page never flashes the
 * full text first. Screen readers get the plain text instead of the letters.
 */
export function typedChars(text: string, start: number, msPerChar: number): ReactNode {
  return (
    <>
      <span className={styles.srOnly}>{text}</span>
      <span aria-hidden="true">
        {Array.from(text).map((char, i) => (
          <span
            key={i}
            className={styles.char}
            style={{ animationDelay: `${Math.round(start + i * msPerChar)}ms` }}
          >
            {char}
          </span>
        ))}
      </span>
    </>
  );
}

/** Keeps a running clock so each piece of text starts typing after the last one */
export function createTypist(startMs = 300) {
  let clock = startMs;

  return {
    /** delay style for an element that should appear at the current point */
    at(): CSSProperties {
      return { animationDelay: `${Math.round(clock)}ms` };
    },
    /** current point on the clock, in ms */
    now() {
      return clock;
    },
    wait(ms: number) {
      clock += ms;
    },
    type(text: string, msPerChar: number): ReactNode {
      const node = typedChars(text, clock, msPerChar);
      clock += Array.from(text).length * msPerChar;
      return node;
    },
  };
}
