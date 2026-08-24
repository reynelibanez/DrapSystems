import * as React from "react";
import type { Props } from "../../types";
type TabsContentProps = Props<
  "div",
  {
    tag?: React.ElementType;
  }
>;
export type { TabsContentProps };
declare const TabsContent: React.ForwardRefExoticComponent<
  import("../../types").ElementProps<"div"> & {
    tag?: React.ElementType;
  } & {
    children?: React.ReactNode | undefined;
  } & React.RefAttributes<HTMLElement>
>;
export default TabsContent;
