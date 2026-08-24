import React from "react";
import type { Embed, Props } from "../../types";
type VideoProps = Props<
  "div",
  {
    options?: Embed.Video | null;
  }
>;
export type { VideoProps };
declare const Video: React.ForwardRefExoticComponent<
  import("../../types").ElementProps<"div"> & {
    options?: Embed.Video | null;
  } & {
    children?: React.ReactNode | undefined;
  } & React.RefAttributes<HTMLDivElement>
>;
export default Video;
