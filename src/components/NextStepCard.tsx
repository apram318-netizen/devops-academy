type Props = {
  text: string;
  href: string;
  cta: string;
  complete: boolean;
  nextWeekHref?: string;
  nextWeekLabel?: string;
};

export function NextStepCard({
  text,
  href,
  cta,
  complete,
  nextWeekHref,
  nextWeekLabel = 'Go to next week',
}: Props) {
  return (
    <div class={`next-step ${complete ? 'complete' : ''}`}>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div class="next-step-label">{complete ? 'Week complete' : 'Next step'}</div>
        <p class="next-step-text">{text}</p>
      </div>
      {complete ? (
        nextWeekHref ? (
          <a href={nextWeekHref} class="btn btn-secondary">
            {nextWeekLabel}
          </a>
        ) : null
      ) : (
        <a href={href} class="btn btn-primary">
          {cta}
        </a>
      )}
    </div>
  );
}