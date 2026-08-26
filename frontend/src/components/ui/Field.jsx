import { forwardRef, useId } from "react";

/**
 * Label-above-input wrapper with optional hint / inline error text below.
 * Never uses placeholder-as-label (see design guardrails).
 */
export function Field({ label, hint, error, required, children }) {
  const id = useId();
  const child = children.props?.id ? children : { ...children, props: { ...children.props, id } };

  return (
    <div className="field">
      <label htmlFor={id}>
        {label}
        {required ? <span style={{ color: "var(--danger)" }}> *</span> : null}
      </label>
      {child}
      {error ? <p className="error">{error}</p> : hint ? <p className="hint">{hint}</p> : null}
    </div>
  );
}

export const Input = forwardRef(function Input(props, ref) {
  return <input ref={ref} className="input" {...props} />;
});

export const Textarea = forwardRef(function Textarea(props, ref) {
  return <textarea ref={ref} className="input" {...props} />;
});

export const Select = forwardRef(function Select({ children, ...rest }, ref) {
  return (
    <select ref={ref} className="input" {...rest}>
      {children}
    </select>
  );
});
