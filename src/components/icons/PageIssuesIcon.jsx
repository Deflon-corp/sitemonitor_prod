import React from "react";
/** Document/page icon with folded corner and text lines. Use with text-primary for purple. */
export default function PageIssuesIcon({
  className,
  size = 16,
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

      /* Page outline with folded top-right corner */
      , React.createElement('path', {
        d: "M9 2H4a1.5 1.5 0 0 0-1.5 1.5v9A1.5 1.5 0 0 0 4 14h7a1.5 1.5 0 0 0 1.5-1.5V5L9 2z"                  ,
        stroke: "currentColor",
        strokeWidth: "1.25",
        strokeLinejoin: "round",
        fill: "none"}
      )
      , React.createElement('path', {
        d: "M9 2v3h3.5" ,
        stroke: "currentColor",
        strokeWidth: "1.25",
        strokeLinecap: "round",
        strokeLinejoin: "round",
        fill: "none"}
      )
      /* Two horizontal lines (text) */
      , React.createElement('path', { d: "M5 7.5h5" , stroke: "currentColor", strokeWidth: "1", strokeLinecap: "round"} )
      , React.createElement('path', { d: "M5 9.5h4" , stroke: "currentColor", strokeWidth: "1", strokeLinecap: "round"} )
    )
  );
}
