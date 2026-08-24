import * as React from "react";
import type { Props } from "../../types";
type TwitterSize = "m" | "l";
type TwitterMode = "follow" | "tweet";
type TwitterProps = Props<
  "div",
  {
    mode?: TwitterMode;
    url?: string;
    text?: string;
    size?: TwitterSize;
  }
>;
declare global {
  interface Window {
    twttr: any;
  }
}
export type { TwitterProps, TwitterSize, TwitterMode };
declare const Twitter: React.ForwardRefExoticComponent<
  import("../../types").ElementProps<"div"> & {
    mode?: TwitterMode;
    url?: string;
    text?: string;
    size?: TwitterSize;
  } & {
    children?: React.ReactNode | undefined;
  } & React.RefAttributes<HTMLDivElement>
>;
export default Twitter;
