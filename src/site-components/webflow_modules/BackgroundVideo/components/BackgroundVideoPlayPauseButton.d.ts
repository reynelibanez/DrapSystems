import React from "react";
import type { Props } from "../../types";
type BackgroundVideoPlayPauseButtonProps = Props<"button">;
export type { BackgroundVideoPlayPauseButtonProps };
declare const BackgroundVideoPlayPauseButton: React.ForwardRefExoticComponent<
  import("../../types").ElementProps<"button"> & {
    children?: React.ReactNode | undefined;
  } & React.RefAttributes<HTMLButtonElement>
>;
export default BackgroundVideoPlayPauseButton;
