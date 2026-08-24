import * as React from "react";
import type { CSSModules } from "./types";
export declare const cx: (style: CSSModules, ...classNames: string[]) => string;
export declare const cj: (
  ...classNames: (string | boolean | undefined)[]
) => string;
export declare const removeUnescaped: (value: string) => string;
export declare const replaceSelector: (
  selector: string,
  styles: CSSModules
) => string;
export declare function debounce<T extends (...args: any[]) => void>(
  this: void,
  func: T,
  timeout?: number
): (...args: Parameters<T>) => void;
export declare const EASING_FUNCTIONS: {
  readonly linear: "linear";
  readonly ease: "ease";
  readonly "ease-in": "ease-in";
  readonly "ease-out": "ease--out";
  readonly "ease-in-out": "ease-in-out";
  readonly "ease-in-sine": "cubic-bezier(0.12, 0, 0.39, 0)";
  readonly "ease-out-sine": "cubic-bezier(0.61, 1, 0.88, 1)";
  readonly "ease-in-out-sine": "cubic-bezier(0.37, 0, 0.63, 1)";
  readonly "ease-in-quad": "cubic-bezier(0.11, 0, 0.5, 0)";
  readonly "ease-out-quad": "cubic-bezier(0.5, 1, 0.89, 1)";
  readonly "ease-in-out-quad": "cubic-bezier(0.45, 0, 0.55, 1)";
  readonly "ease-in-cubic": "cubic-bezier(0.32, 0, 0.67, 0)";
  readonly "ease-out-cubic": "cubic-bezier(0.33, 1, 0.68, 1)";
  readonly "ease-in-out-cubic": "cubic-bezier(0.65, 0, 0.35, 1)";
  readonly "ease-in-quart": "cubic-bezier(0.5, 0, 0.75, 0)";
  readonly "ease-out-quart": "cubic-bezier(0.25, 1, 0.5, 1)";
  readonly "ease-in-out-quart": "cubic-bezier(0.76, 0, 0.24, 1)";
  readonly "ease-in-quint": "cubic-bezier(0.64, 0, 0.78, 0)";
  readonly "ease-out-quint": "cubic-bezier(0.22, 1, 0.36, 1)";
  readonly "ease-in-out-quint": "cubic-bezier(0.83, 0, 0.17, 1)";
  readonly "ease-in-expo": "cubic-bezier(0.7, 0, 0.84, 0)";
  readonly "ease-out-expo": "cubic-bezier(0.16, 1, 0.3, 1)";
  readonly "ease-in-out-expo": "cubic-bezier(0.87, 0, 0.13, 1)";
  readonly "ease-in-circ": "cubic-bezier(0.55, 0, 1, 0.45)";
  readonly "ease-out-circ": "cubic-bezier(0, 0.55, 0.45, 1)";
  readonly "ease-in-out-circ": "cubic-bezier(0.85, 0, 0.15, 1)";
  readonly "ease-in-back": "cubic-bezier(0.36, 0, 0.66, -0.56)";
  readonly "ease-out-back": "cubic-bezier(0.34, 1.56, 0.64, 1)";
  readonly "ease-in-out-back": "cubic-bezier(0.68, -0.6, 0.32, 1.6)";
};
export declare const isServer: boolean;
export declare const useLayoutEffect: typeof React.useLayoutEffect;
export declare function useResizeObserver(
  ref: React.RefObject<HTMLElement | null>,
  fn: (entry: ResizeObserverEntry) => void,
  options?: {
    onlyWidth?: boolean;
  }
): void;
export declare function isUrl(str: string): boolean;
export declare function loadScript(
  src: string,
  options?: {
    async?: boolean;
    type?: string;
    defer?: boolean;
    cacheRegex?: RegExp;
  }
): Promise<unknown>;
export declare const KEY_CODES: {
  ARROW_LEFT: string;
  ARROW_UP: string;
  ARROW_RIGHT: string;
  ARROW_DOWN: string;
  SPACE: string;
  ENTER: string;
  HOME: string;
  END: string;
  TAB: string;
};
export declare function dispatchCustomEvent(
  element: Document | Element,
  eventName: string
): void;
export declare function useClickOut(
  ref: React.RefObject<HTMLElement | null>,
  action: () => void
): void;
export declare function extractElement<
  T extends React.JSXElementConstructor<any>
>(
  elements: React.ReactNode[],
  type: T
): {
  extracted: React.ReactNode;
  tree: React.ReactNode[];
};
