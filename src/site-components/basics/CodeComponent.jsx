"use client";
import React from "react";
import { DEVLINK_SCOPE_CLASS } from "../devlinkScope";
import NotSupported from "../webflow_modules/Builtin/components/NotSupported";

export function CodeComponent({}) {
  return (
    <div
      className={DEVLINK_SCOPE_CLASS}
      style={{
        display: "contents",
      }}
    >
      <NotSupported _atom={"Code Island"} />
    </div>
  );
}
