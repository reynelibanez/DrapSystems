"use client";
import * as React from "react";
import * as utils from "../../utils";
const HtmlEmbed = React.forwardRef(function HtmlEmbed(
  { tag = "div", className = "", value = "", content = "", ...props },
  ref
) {
  const decodedHtml = content || utils.removeUnescaped(value || "");
  const containerRef = React.useRef(null);
  const setRef = React.useCallback(
    (node) => {
      containerRef.current = node;
      if (typeof ref === "function") {
        ref(node);
      } else if (ref) {
        ref.current = node;
      }
    },
    [ref]
  );
  React.useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    if (!/<script/i.test(decodedHtml)) return;
    const scripts = container.querySelectorAll("script");
    scripts.forEach((oldScript) => {
      const newScript = document.createElement("script");
      for (const attr of Array.from(oldScript.attributes)) {
        newScript.setAttribute(attr.name, attr.value);
      }
      if (oldScript.textContent) {
        newScript.textContent = oldScript.textContent;
      }
      oldScript.parentNode?.replaceChild(newScript, oldScript);
    });
  }, [decodedHtml]);
  return React.createElement(tag, {
    className: className + " w-embed",
    dangerouslySetInnerHTML: { __html: decodedHtml },
    suppressHydrationWarning: true,
    ...props,
    ref: setRef,
  });
});
export default HtmlEmbed;
