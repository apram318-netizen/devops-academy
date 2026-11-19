import type { WeekVideo } from '../data/weekMedia';

export function YouTubeEmbed({
  video,
  watched,
  onWatched,
}: {
  video: WeekVideo;
  watched?: boolean;
  onWatched?: () => void;
}) {
  const start = video.startSeconds ?? 0;
  const src = `https://www.youtube-nocookie.com/embed/${video.youtubeId}?rel=0&start=${start}`;
  const open = `https://www.youtube.com/watch?v=${video.youtubeId}${start ? `&t=${start}s` : ''}`;

  return (
    <div class="yt-card">
      <div class="yt-embed">
        <iframe
          src={src}
          title={video.title}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          loading="lazy"
        />
      </div>
      <div class="yt-meta">
        <div class="yt-title">{video.title}</div>
        <p class="yt-why">{video.why}</p>
        {video.endHint && <p class="yt-hint">Watch through: {video.endHint}</p>}
        <div class="yt-actions">
          <a class="btn btn-secondary" href={open} target="_blank" rel="noreferrer">
            Open on YouTube
          </a>
          {onWatched && (
            <button type="button" class={`btn ${watched ? 'btn-ghost' : 'btn-primary'}`} onClick={onWatched}>
              {watched ? 'Watched' : video.required ? 'Mark watched (required)' : 'Mark watched'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
