import * as React from "react";
import type { Props } from "../../types";
type TabsMenuProps = Props<
  "div",
  {
    tag?: React.ElementType;
  }
>;
export type { TabsMenuProps };
declare const TabsMenu: React.ForwardRefExoticComponent<
  import("../../types").ElementProps<"div"> & {
    tag?: React.ElementType;
  } & {
    children?: React.ReactNode | undefined;
  } & React.RefAttributes<HTMLElement>
>;
export default TabsMenu;
