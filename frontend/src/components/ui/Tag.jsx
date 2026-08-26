const VARIANT_CLASS = {
  neutral: "tag-neutral",
  accent: "tag-accent",
  success: "tag-success",
  warning: "tag-warning",
  danger: "tag-danger",
};

export default function Tag({ variant = "neutral", icon, children }) {
  return (
    <span className={`tag ${VARIANT_CLASS[variant]}`}>
      {icon}
      {children}
    </span>
  );
}
