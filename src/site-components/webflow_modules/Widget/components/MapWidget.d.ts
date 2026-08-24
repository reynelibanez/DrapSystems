import React from "react";
import type { Props } from "../../types";
declare global {
  interface Window {
    google: {
      maps: any;
    };
  }
}
type MapWidgetProps = Props<
  "div",
  {
    apiKey?: string;
    zoom?: number;
    latlng?: string;
    mapStyle?: "roadmap" | "satellite" | "hybrid" | "terrain";
    tooltip?: string;
    title?: string;
    enableScroll?: boolean;
    enableTouch?: boolean;
  }
>;
export type { MapWidgetProps };
declare const MapWidget: React.ForwardRefExoticComponent<
  import("../../types").ElementProps<"div"> & {
    apiKey?: string;
    zoom?: number;
    latlng?: string;
    mapStyle?: "roadmap" | "satellite" | "hybrid" | "terrain";
    tooltip?: string;
    title?: string;
    enableScroll?: boolean;
    enableTouch?: boolean;
  } & {
    children?: React.ReactNode | undefined;
  } & React.RefAttributes<HTMLDivElement>
>;
export default MapWidget;
