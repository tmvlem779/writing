type MondeukLoadingProps = {
  compact?: boolean;
  message?: string;
};

type MondeukLoadingOverlayProps = {
  message?: string;
};

const syllables = ["문", "득", "문", "득"];

export function MondeukLoading({
  compact = false,
  message = "문득문득이 답을 읽고 다음 질문을 준비하고 있어요."
}: MondeukLoadingProps) {
  const content = (
    <>
      <span className="mondeuk-loading-syllables" aria-hidden="true">
        {syllables.map((syllable, index) => <i key={`${syllable}-${index}`}>{syllable}</i>)}
      </span>
      <span className="mondeuk-loading-message">{compact ? "생각 중" : message}</span>
    </>
  );

  if (compact) {
    return <span className="mondeuk-loading compact" role="status" aria-label={message}>{content}</span>;
  }

  return <div className="mondeuk-loading" role="status" aria-live="polite">{content}</div>;
}

export function MondeukLoadingOverlay({
  message = "문득문득이 화면을 준비하고 있어요."
}: MondeukLoadingOverlayProps) {
  return (
    <div className="mondeuk-loading-overlay">
      <MondeukLoading message={message} />
    </div>
  );
}
