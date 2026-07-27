export function TypingIndicator() {
  return (
    <span
      aria-atomic="true"
      aria-live="polite"
      className="typing-indicator"
      role="status"
    >
      <span aria-hidden="true" />
      <span aria-hidden="true" />
      <span aria-hidden="true" />
      <span className="visually-hidden">Synthex is thinking</span>
    </span>
  );
}
