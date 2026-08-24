import * as React from "react";
import type { Props } from "../../types";
type TabsPaneProps = Props<
  "div",
  {
    tag?: React.ElementType;
    "data-w-tab": string;
  }
>;
export type { TabsPaneProps };
declare const TabsPane: React.ForwardRefExoticComponent<
  import("../../types").ElementProps<"div"> & {
    tag?: React.ElementType;
    "data-w-tab": string;
  } & {
    children?: React.ReactNode | undefined;
  } & React.RefAttributes<HTMLElement>
>;
export default TabsPane;
