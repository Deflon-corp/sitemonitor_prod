import React from "react";
/** External link icon: square with diagonal arrow from top-right. Use with text-primary for purple. */
export default function ExternalLinkIcon({
  className,
  size = 12,
}


) {
  return (
    React.createElement('svg', {
      width: size,
      height: size,
      viewBox: "0 0 16 16"   ,
      fill: "none",
      xmlns: "http://www.w3.org/2000/svg",
      className: className,
      'aria-hidden': true}

      , React.createElement('path', {
        d: "M6.667 2H4a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2V9.333"                 ,
        stroke: "currentColor",
        strokeWidth: "1.5",
        strokeLinecap: "round",
        strokeLinejoin: "round"}
      )
      , React.createElement('path', {
        d: "M14 2h-4v4M14 2 6 10"    ,
        stroke: "currentColor",
        strokeWidth: "1.5",
        strokeLinecap: "round",
        strokeLinejoin: "round"}
      )
    )
  );
}
