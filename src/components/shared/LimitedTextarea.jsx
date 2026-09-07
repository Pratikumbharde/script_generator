import React, { forwardRef } from "react";

/**
 * LimitedTextarea — wraps <textarea> with maxLength and char count display.
 * Props: all standard <textarea> props, plus:
 *   maxLength (number) — max character limit
 *   showCount (bool, default true) — show "{current}/{max}" below
 *   warningAt (number, default 0.9) — fraction of maxLength at which counter turns amber
 * Refs are forwarded to the underlying <textarea>.
 */
const LimitedTextarea = forwardRef(function LimitedTextarea(
  { value, onChange, maxLength, showCount = true, warningAt = 0.9, className, style, ...rest },
  ref
) {
  if (!maxLength) {
    return <textarea ref={ref} className={className} value={value} onChange={onChange} style={style} {...rest} />;
  }

  const len = typeof value === "string" ? value.length : 0;
  const nearLimit = len >= maxLength * warningAt;
  const over = len >= maxLength;

  return (
    <div className="limited-field">
      <textarea
        ref={ref}
        className={className}
        value={value}
        onChange={onChange}
        maxLength={maxLength}
        style={style}
        {...rest}
      />
      {showCount && (
        <div className={`char-count${nearLimit ? " warn" : ""}${over ? " over" : ""}`}>
          {len}/{maxLength}
        </div>
      )}
    </div>
  );
});

export default LimitedTextarea;