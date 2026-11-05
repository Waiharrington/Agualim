import { useEffect, useRef, useState } from 'react';
import { Check, ChevronDown, Clock3 } from 'lucide-react';

const HOURS = Array.from({ length: 12 }, (_, index) => index + 1);
const MINUTES = Array.from({ length: 60 }, (_, index) => String(index).padStart(2, '0'));

function partsFromValue(value) {
  const [rawHour = '08', minute = '00'] = (value || '08:00').split(':');
  const hour24 = Number(rawHour);
  return {
    hour: hour24 % 12 || 12,
    minute,
    period: hour24 >= 12 ? 'pm' : 'am',
  };
}

function valueFromParts({ hour, minute, period }) {
  const hour24 = (Number(hour) % 12) + (period === 'pm' ? 12 : 0);
  return `${String(hour24).padStart(2, '0')}:${minute}`;
}

function Column({ label, value, options, onSelect, className = '' }) {
  return <div className={`time-picker-column ${className}`}>
    <span className="time-picker-column-label">{label}</span>
    <div className="time-picker-options" role="listbox" aria-label={label}>
      {options.map((option) => {
        const selected = String(option.value) === String(value);
        return <button
          key={option.value}
          type="button"
          role="option"
          aria-selected={selected}
          className={selected ? 'selected' : ''}
          onClick={() => onSelect(option.value)}
        >{option.label}</button>;
      })}
    </div>
  </div>;
}

export default function TimePicker({ label, value, onChange }) {
  const [open, setOpen] = useState(false);
  const [placement, setPlacement] = useState('below');
  const [parts, setParts] = useState(() => partsFromValue(value));
  const rootRef = useRef(null);

  useEffect(() => setParts(partsFromValue(value)), [value]);

  useEffect(() => {
    if (!open) return undefined;
    const frame = window.requestAnimationFrame(() => {
      rootRef.current?.querySelectorAll('.time-picker-options').forEach((list) => {
        list.querySelector('[aria-selected="true"]')?.scrollIntoView({ block: 'center', behavior: 'smooth' });
      });
    });
    return () => window.cancelAnimationFrame(frame);
  }, [open]);

  useEffect(() => {
    if (!open) return undefined;
    const closeOnOutsideClick = (event) => {
      if (!rootRef.current?.contains(event.target)) setOpen(false);
    };
    const closeOnEscape = (event) => {
      if (event.key === 'Escape') setOpen(false);
    };
    document.addEventListener('pointerdown', closeOnOutsideClick);
    document.addEventListener('keydown', closeOnEscape);
    return () => {
      document.removeEventListener('pointerdown', closeOnOutsideClick);
      document.removeEventListener('keydown', closeOnEscape);
    };
  }, [open]);

  const selectPart = (key, nextValue) => {
    const next = { ...parts, [key]: nextValue };
    setParts(next);
    onChange(valueFromParts(next));
  };

  const togglePicker = () => {
    if (!open && rootRef.current) {
      const bounds = rootRef.current.getBoundingClientRect();
      setPlacement(window.innerHeight - bounds.bottom < 310 ? 'above' : 'below');
    }
    setOpen((current) => !current);
  };

  const formattedHour = String(parts.hour).padStart(2, '0');
  const formattedPeriod = parts.period === 'am' ? 'a. m.' : 'p. m.';

  return <div className={`time-picker ${open ? 'open' : ''}`} ref={rootRef}>
    <button
      type="button"
      className="time-picker-trigger"
      aria-label={`${label}: ${formattedHour}:${parts.minute} ${formattedPeriod}`}
      aria-haspopup="dialog"
      aria-expanded={open}
      onClick={togglePicker}
    >
      <span>{formattedHour}:{parts.minute} <small>{formattedPeriod}</small></span>
      <span className="time-picker-trigger-icons"><Clock3 size={16}/><ChevronDown size={14}/></span>
    </button>
    {open&&<section className={`time-picker-popover ${placement}`} role="dialog" aria-label={`Elegir hora: ${label}`}>
      <header><span className="time-picker-clock"><Clock3 size={16}/></span><div><b>Elige tu horario</b><small>{label}</small></div><strong>{formattedHour}:{parts.minute}<small> {formattedPeriod}</small></strong></header>
      <div className="time-picker-columns">
        <Column label="Hora" value={parts.hour} options={HOURS.map((hour) => ({ value: hour, label: String(hour).padStart(2, '0') }))} onSelect={(hour) => selectPart('hour', hour)}/>
        <Column label="Minutos" value={parts.minute} options={MINUTES.map((minute) => ({ value: minute, label: minute }))} onSelect={(minute) => selectPart('minute', minute)}/>
        <Column label="Turno" value={parts.period} options={[{ value: 'am', label: 'a. m.' }, { value: 'pm', label: 'p. m.' }]} onSelect={(period) => selectPart('period', period)} className="period-column"/>
      </div>
      <footer><span>El horario se guarda con tus ajustes</span><button type="button" onClick={() => setOpen(false)}><Check size={15}/> Listo</button></footer>
    </section>}
  </div>;
}
