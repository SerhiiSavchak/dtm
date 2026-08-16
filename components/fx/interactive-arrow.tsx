type InteractiveArrowProps = {
  className?: string;
};

export function InteractiveArrow({ className = "" }: InteractiveArrowProps) {
  return (
    <span className={`btn-arrow ${className}`} aria-hidden>
      →
    </span>
  );
}
