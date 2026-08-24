import * as React from "react";
declare const Heading: React.ForwardRefExoticComponent<
  import("../../types").ElementProps<"h1"> & {
    tag?: "h1" | "h2" | "h3" | "h4" | "h5" | "h6";
  } & {
    children?: React.ReactNode | undefined;
  } & React.RefAttributes<HTMLHeadingElement>
>;
export default Heading;
