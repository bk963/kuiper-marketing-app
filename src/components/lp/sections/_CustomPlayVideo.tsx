'use client';
/**
 * Custom-Play-Video — Video OHNE native Controls (immer) + animierter Play-Button-Overlay.
 *
 * V2-Hero-Variante (Clickfunnels-Style):
 *   - Vor Play: Poster + großer pulsierender Cyan-Play-Button
 *   - Click → Video startet, Play-Button verschwindet, KEINE Controls sichtbar
 *   - Click ins Video → pausiert, Play-Button erscheint wieder mit Pulse
 *   - Video-Ende → Play-Button erscheint automatisch wieder
 *
 * Controls bleiben ALLE Zeit ausgeblendet (kein Scrubber, kein Timecode, kein Lautstärke).
 */
import { useState, useRef, useEffect } from 'react';

export default function CustomPlayVideo({
  src,
  poster,
  videoId,
}: {
  src: string;
  poster?: string;
  videoId?: string;
  caption?: string;
}) {
  // playing = aktuell läuft das Video. paused/ended = Button wieder sichtbar.
  const [playing, setPlaying] = useState(false);
  const ref = useRef<HTMLVideoElement | null>(null);

  // Synchronisiere Component-State mit nativen Video-Events
  useEffect(() => {
    const v = ref.current;
    if (!v) return;
    const onPlayEvt = () => setPlaying(true);
    const onPauseEvt = () => setPlaying(false);
    const onEndedEvt = () => setPlaying(false);
    v.addEventListener('play', onPlayEvt);
    v.addEventListener('pause', onPauseEvt);
    v.addEventListener('ended', onEndedEvt);
    return () => {
      v.removeEventListener('play', onPlayEvt);
      v.removeEventListener('pause', onPauseEvt);
      v.removeEventListener('ended', onEndedEvt);
    };
  }, []);

  const startPlay = () => {
    if (ref.current) {
      ref.current.play().catch(() => { /* autoplay blocked, user click required */ });
    }
  };

  const onVideoClick = () => {
    const v = ref.current;
    if (!v) return;
    if (v.paused) {
      v.play().catch(() => null);
    } else {
      v.pause();
    }
  };

  return (
    <div className={`kf-vid kf-vid--custom-play${playing ? ' kf-vid--playing' : ''}`}>
      <video
        ref={ref}
        id={videoId}
        src={src}
        poster={poster}
        playsInline
        preload="metadata"
        controls={false}
        controlsList="nodownload nofullscreen noremoteplayback noplaybackrate"
        disablePictureInPicture
        onClick={onVideoClick}
        onContextMenu={(e) => e.preventDefault()}
        style={{ width: '100%', height: 'auto', display: 'block', cursor: 'pointer' }}
      />
      {!playing && (
        <button
          type="button"
          onClick={startPlay}
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
