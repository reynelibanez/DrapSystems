import React from "react";
import type { Props } from "../../types";
type BackgroundVideoWrapperProps = Props<
  "div",
  {
    tag?: keyof HTMLElementTagNameMap;
    sources?: string[];
    posterImage?: string;
    autoPlay?: boolean;
    loop?: boolean;
  }
>;
export type { BackgroundVideoWrapperProps };
declare const BackgroundVideoWrapper: React.ForwardRefExoticComponent<
  import("../../types").ElementProps<"div"> & {
    tag?: keyof HTMLElementTagNameMap;
    sources?: string[];
    posterImage?: string;
    autoPlay?: boolean;
    loop?: boolean;
  } & {
    children?: React.ReactNode | undefined;
  } & React.RefAttributes<HTMLVideoElement>
>;
export default BackgroundVideoWrapper;
