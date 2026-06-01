'use client';
/**
 * Custom-Play-Video — Video ohne native Controls + animierter Play-Button-Overlay.
 *
 * V2-Hero-Variante (Clickfunnels-Style): User sieht erstmal nur das Poster + einen großen,
 * pulsierenden Play-Button. Beim Click verschwindet der Button, Video startet automatisch
 * und Controls werden eingeblendet.
 */
import { useState, useRef } from 'react';

export default function CustomPlayVideo({
  src,
  poster,
  videoId,
  caption,
}: {
  src: string;
  poster?: string;
  videoId?: string;
  caption?: string;
}) {
  const [playing, setPlaying] = useState(false);
  const ref = useRef<HTMLVideoElement | null>(null);

  const onPlay = () => {
    setPlaying(true);
    if (ref.current) {
      ref.current.controls = true;
      ref.current.play().catch(() => { /* autoplay blocked, user must click again */ });
    }
  };

  return (
    <div className={`kf-vid kf-vid--custom-play${playing ? ' kf-vid--playing' : ''}`}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <video
        ref={ref}
        id={videoId}
        src={src}
        poster={poster}
        playsInline
        preload="metadata"
        controls={playing}
        style={{ width: '100%', height: 'auto', display: 'block' }}
      />
      {!playing && (
        <button
          type="button"
          onClick={onPlay}
          aria-label="Video abspielen"
          className="kf-vid__play-btn"
        >
          <span className="kf-vid__play-pulse" aria-hidden="true"></span>
          <span className="kf-vid__play-circle">
            <svg viewBox="0 0 60 60" width="60" height="60" aria-hidden="true">
              <polygon points="22,18 22,42 44,30" fill="currentColor" />
            </svg>
          </span>
        </button>
      )}
    </div>
  );
}
