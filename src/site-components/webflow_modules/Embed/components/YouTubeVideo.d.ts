import * as React from "react";
import type { Props } from "../../types";
type YouTubeVideoProps = Props<
  "div",
  {
    title: string;
    videoId: string;
    aspectRatio?: number;
    startAt?: number;
    showAllRelatedVideos?: boolean;
    controls?: boolean;
    autoplay?: boolean;
    muted?: boolean;
    privacyMode?: boolean;
  }
>;
export type { YouTubeVideoProps };
declare const YouTubeVideo: React.ForwardRefExoticComponent<
  import("../../types").ElementProps<"div"> & {
    title: string;
    videoId: string;
    aspectRatio?: number;
    startAt?: number;
    showAllRelatedVideos?: boolean;
    controls?: boolean;
    autoplay?: boolean;
    muted?: boolean;
    privacyMode?: boolean;
  } & {
    children?: React.ReactNode | undefined;
  } & React.RefAttributes<HTMLDivElement>
>;
export default YouTubeVideo;
