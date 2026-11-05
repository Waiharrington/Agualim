import { useEffect, useRef, useState } from 'react';
import { Camera, Check, LoaderCircle, X } from 'lucide-react';

async function compressPhoto(file) {
  if (!file.type.startsWith('image/')) throw new Error('Elige una foto del vaso.');
  if (file.size > 12 * 1024 * 1024) throw new Error('La foto pesa más de 12 MB. Toma otra con menor resolución.');
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, 1200 / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement('canvas');
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);
  canvas.getContext('2d').drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  bitmap.close();
  const blob = await new Promise((resolve) => canvas.toBlob(resolve, 'image/jpeg', 0.82));
  if (!blob) throw new Error('No pude preparar la foto. Inténtalo de nuevo.');
  return await new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(new Error('No pude leer la foto.'));
    reader.readAsDataURL(blob);
  });
}

export default function PhotoEstimator({ supabase, onEstimate }) {
  const inputRef = useRef(null);
  const [available, setAvailable] = useState(false);
  const [preview, setPreview] = useState('');
  const [estimate, setEstimate] = useState(null);
  const [confidence, setConfidence] = useState('low');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    fetch('/api/estimate-water').then((response) => response.ok ? response.json() : { available: false })
      .then((result) => { if (active) setAvailable(Boolean(result.available)); })
      .catch(() => { if (active) setAvailable(false); });
    return () => { active = false; };
  }, []);

  const clearPhoto = () => {
    if (preview) URL.revokeObjectURL(preview);
    setPreview('');
    setEstimate(null);
    setError('');
    if (inputRef.current) inputRef.current.value = '';
  };

  const estimatePhoto = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (preview) URL.revokeObjectURL(preview);
    setPreview(URL.createObjectURL(file));
    setEstimate(null);
    setError('');
    setBusy(true);
    try {
      if (!supabase) throw new Error('La estimación necesita iniciar sesión y conexión.');
      const [{ data: { session } }, image] = await Promise.all([supabase.auth.getSession(), compressPhoto(file)]);
      if (!session?.access_token) throw new Error('Vuelve a entrar a tu cuenta para estimar la foto.');
      const response = await fetch('/api/estimate-water', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session.access_token}` },
        body: JSON.stringify({ image }),
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(result.error || 'No pude estimar esa foto. Inténtalo otra vez.');
      setEstimate(result.estimated_ml);
      setConfidence(result.confidence || 'low');
    } catch (reason) {
      setError(reason.message || 'No pude estimar esa foto.');
    } finally {
      setBusy(false);
    }
  };

  return <section className="photo-estimator" aria-label="Estimación de agua con foto">
    <input ref={inputRef} className="photo-input" type="file" accept="image/*" capture="environment" onChange={estimatePhoto} />
    <div className="photo-estimator-heading">
      <div><b>¿No sabes cuántos mililitros tiene tu vaso?</b><small>Toma una foto y Groq te dará una estimación visual.</small></div>
      <button className="photo-button" type="button" onClick={() => inputRef.current?.click()} disabled={!available || busy}>
        {busy ? <LoaderCircle size={16} className="spin"/> : <Camera size={16}/>} {busy ? 'Estimando…' : 'Tomar foto'}
      </button>
    </div>
    <small className="photo-privacy">La foto se envía a Groq para analizarla; Agualin no la guarda. La cantidad es aproximada y puedes corregirla.</small>
    {!available && <small className="photo-unavailable">La estimación por foto se activará cuando se configure la clave de Groq en el servidor.</small>}
    {preview && <div className="photo-result">
      <img src={preview} alt="Foto del vaso de agua" />
      <div className="photo-result-details">
        {busy ? <p>Estoy calculando aproximadamente el agua visible…</p> : estimate !== null ? <>
          <label htmlFor="photo-estimate-ml">Estimación aproximada ({confidence === 'low' ? 'confianza baja' : confidence === 'high' ? 'confianza alta' : 'confianza media'})</label>
          <div className="photo-estimate-actions"><input id="photo-estimate-ml" type="number" min="50" max="2500" step="25" value={estimate} onChange={(e) => setEstimate(Number(e.target.value))}/><span>ml</span>
            <button type="button" className="photo-confirm" disabled={!estimate || estimate < 50 || estimate > 2500} onClick={() => { onEstimate(estimate); clearPhoto(); }}><Check size={15}/> Registrar</button>
          </div>
          <small>Una foto no permite medir el volumen exacto. Revisa la cantidad antes de guardarla.</small>
        </> : null}
        {error && <p className="photo-error" role="alert">{error}</p>}
        <button type="button" className="photo-dismiss" onClick={clearPhoto} aria-label="Quitar foto"><X size={15}/> Quitar foto</button>
      </div>
    </div>}
  </section>;
}
