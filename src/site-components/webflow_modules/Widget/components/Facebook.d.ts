import * as React from "react";
import type { Props } from "../../types";
type FacebookProps = Props<
  "div",
  {
    layout?: string;
    width?: number;
    height?: number;
    url?: string;
    locale?: string;
  }
>;
export type { FacebookProps };
declare const Facebook: React.ForwardRefExoticComponent<
  import("../../types").ElementProps<"div"> & {
    layout?: string;
    width?: number;
    height?: number;
    url?: string;
    locale?: string;
  } & {
    children?: React.ReactNode | undefined;
  } & React.RefAttributes<HTMLDivElement>
>;
export default Facebook;
