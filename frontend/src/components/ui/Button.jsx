const VARIANT_CLASS = {
  primary: "btn-primary",
  "on-dark": "btn-on-dark",
  secondary: "btn-secondary",
  "secondary-on-dark": "btn-secondary-on-dark",
  ghost: "btn-ghost",
};

/**
 * Shared button. Variant picks the fill; teal never fills a button
 * (see tokens.css note) so contrast stays safe on both navy and light backgrounds.
 */
export default function Button({
  variant = "primary",
  size,
  icon,
  iconPosition = "left",
  as: Component = "button",
  className = "",
  children,
  ...rest
}) {
  const classes = ["btn", VARIANT_CLASS[variant], size === "sm" ? "btn-sm" : "", className]
    .filter(Boolean)
    .join(" ");

  return (
    <Component className={classes} {...rest}>
      {icon && iconPosition === "left" ? icon : null}
      {children}
      {icon && iconPosition === "right" ? icon : null}
    </Component>
  );
}
