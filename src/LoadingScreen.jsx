import { useEffect, useRef, useState } from 'react';

const FRAMES = [
  '/loading/wai-1.webp',
  '/loading/wai-2.webp',
  '/loading/wai-3.webp',
  '/loading/wai-4.webp',
];
const REQUIRED_IMAGES = ['/agualin-logo.png', '/loading/waves.png', ...FRAMES];
const FRAME_DURATIONS = [520, 360, 550, 750];
const MESSAGES = [
  'Preparando tu día…',
  'Llenando tu energía…',
  '¡Un sorbito más!',
];

export default function LoadingScreen({ stage = 'assets', isExiting = false, bootStartedAt = 0, onAssetsReady, onExitComplete }) {
  const [loadedImages, setLoadedImages] = useState(0);
  const [firstFrameReady, setFirstFrameReady] = useState(false);
  const [frame, setFrame] = useState(0);
  const [previousFrame, setPreviousFrame] = useState(0);
  const [crossfading, setCrossfading] = useState(false);
  const [messageIndex, setMessageIndex] = useState(0);
  const [elapsed, setElapsed] = useState(0);
  const [exitAnimation, setExitAnimation] = useState(false);
  const onAssetsReadyRef = useRef(onAssetsReady);
  const onExitCompleteRef = useRef(onExitComplete);
  onAssetsReadyRef.current = onAssetsReady;
  onExitCompleteRef.current = onExitComplete;
  const assetsReady = loadedImages >= REQUIRED_IMAGES.length;
  const assetProgress = (loadedImages / REQUIRED_IMAGES.length) * 60;
  const progress = stage === 'ready'
    ? 100
    : stage === 'presentation'
      ? Math.min(99, Math.round((elapsed / 3000) * 99))
      : Math.round(assetProgress + (stage === 'records' ? 20 : 0));
  const status = stage === 'ready'
    ? 'Todo listo para empezar'
    : stage === 'records'
      ? 'Sincronizando tus registros'
      : stage === 'session'
        ? 'Comprobando tu sesión'
        : stage === 'presentation'
          ? 'Preparando tu bienvenida'
          : 'Preparando los detalles de Wai';

  useEffect(() => {
    const updateElapsed = () => setElapsed(Math.max(0, Date.now() - bootStartedAt));
    updateElapsed();
    const timer = window.setInterval(updateElapsed, 60);
    return () => window.clearInterval(timer);
  }, [bootStartedAt]);

  useEffect(() => {
    let cancelled = false;
    let complete = 0;
    REQUIRED_IMAGES.forEach((src) => {
      const image = new Image();
      const markComplete = () => {
        complete += 1;
        if (src === FRAMES[0]) setFirstFrameReady(true);
        if (!cancelled) setLoadedImages(complete);
      };
      image.onload = markComplete;
      image.onerror = markComplete;
      image.src = src;
    });
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    if (assetsReady) onAssetsReadyRef.current?.();
  }, [assetsReady]);

  useEffect(() => {
    if (stage !== 'ready' || !isExiting) {
      setExitAnimation(false);
      return undefined;
    }
    const start = window.setTimeout(() => setExitAnimation(true), 100);
    const finish = window.setTimeout(() => onExitCompleteRef.current?.(), 610);
    return () => {
      window.clearTimeout(start);
      window.clearTimeout(finish);
    };
  }, [stage, isExiting]);

  useEffect(() => {
    if (!assetsReady || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    let timeout;
    let fadeTimeout;
    let current = 0;
    const advance = () => {
      timeout = window.setTimeout(() => {
        setPreviousFrame(current);
        current = (current + 1) % FRAMES.length;
        setFrame(current);
        setCrossfading(true);
        window.clearTimeout(fadeTimeout);
        fadeTimeout = window.setTimeout(() => setCrossfading(false), 240);
        advance();
      }, FRAME_DURATIONS[current]);
    };
    advance();
    return () => {
      window.clearTimeout(timeout);
      window.clearTimeout(fadeTimeout);
    };
  }, [assetsReady]);

  useEffect(() => {
    if (stage === 'ready' || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const timer = window.setInterval(() => setMessageIndex((index) => (index + 1) % MESSAGES.length), 2600);
    return () => window.clearInterval(timer);
  }, [stage]);

  return <main className={`loading-screen${exitAnimation ? ' is-exiting' : ''}`} aria-label="Cargando Agualin">
    <div className="loading-brand"><img src="/agualin-logo.png" alt="Agualin"/></div>
    <div className="loading-character" aria-hidden="true">
      <span className="loading-ripple ripple-one"/><span className="loading-ripple ripple-two"/>
      <span className="loading-sparkle loading-sparkle-blue">✦</span><span className="loading-sparkle loading-sparkle-pink">✦</span>
      <span className="loading-bubble bubble-one"/><span className="loading-bubble bubble-two"/><span className="loading-bubble bubble-three"/>
      <span className="loading-bubble bubble-four"/><span className="loading-bubble bubble-five"/><span className="loading-bubble bubble-six"/>
      <span className="loading-bubble bubble-seven"/><span className="loading-bubble bubble-eight"/><span className="loading-bubble bubble-nine"/>
      {firstFrameReady && <span className={`loading-frame-stack${crossfading ? ' is-crossfading' : ''}`}>
        <img className="loading-frame-image loading-frame-previous" src={FRAMES[previousFrame]} alt=""/>
        <img className="loading-frame-image loading-frame-current" src={FRAMES[frame]} alt="" fetchPriority="high"/>
      </span>}
    </div>
    <div className="loading-progress" role="status" aria-live="polite">
      <span className="loading-progress-track" role="progressbar" aria-label="Progreso de carga de Agualin" aria-valuemin="0" aria-valuemax="100" aria-valuenow={progress} aria-valuetext={`${progress}% · ${status}`}>
        <span className="loading-progress-fill" style={{ width: `${progress}%` }}/>
        {!['ready', 'presentation'].includes(stage) && <span className="loading-progress-live" style={{ left: `${progress}%` }} aria-hidden="true"><i/></span>}
      </span>
      <p key={`${stage}-${messageIndex}`}>{stage === 'ready' ? '¡Wai ya está listo!' : MESSAGES[messageIndex]}</p>
      <small>{status}</small>
    </div>
  </main>;
}
