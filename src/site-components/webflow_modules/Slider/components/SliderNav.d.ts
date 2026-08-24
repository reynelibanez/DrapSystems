import * as React from "react";
import type { Props } from "../../types";
type SliderNavProps = Props<"div">;
export type { SliderNavProps };
declare const SliderNav: React.ForwardRefExoticComponent<
  import("../../types").ElementProps<"div"> & {
    children?: React.ReactNode | undefined;
  } & React.RefAttributes<HTMLDivElement>
>;
export default SliderNav;
