import * as React from "react";
import { LinkProps } from "../../Basic/components/Link";
import type { Props } from "../../types";
type DropdownLinkProps = Props<
  "a",
  {
    tag?: keyof HTMLElementTagNameMap;
  }
> &
  LinkProps;
export type { DropdownLinkProps };
declare const DropdownLink: React.ForwardRefExoticComponent<
  import("../../types").ElementProps<"a"> & {
    tag?: keyof HTMLElementTagNameMap;
  } & {
    children?: React.ReactNode | undefined;
  } & {
    options?: {
      href: string;
      target?: "_self" | "_blank";
      preload?: "none" | "prefetch" | "prerender";
    };
    className?: string;
    button?: boolean;
    block?: string;
  } & React.RefAttributes<HTMLAnchorElement>
>;
export default DropdownLink;
