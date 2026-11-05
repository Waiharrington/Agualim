import { useEffect, useRef, useState } from 'react';
import { Check, ChevronDown } from 'lucide-react';

const GOALS = [2000, 2500, 3000, 3500, 4000, 4500, 5000];
const formatGoal = (ml) => `${(ml / 1000).toLocaleString('es', { maximumFractionDigits: 1 })} L`;

export default function GoalPicker({ goal, onSelect }) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef(null);

  useEffect(() => {
    if (!open) return undefined;
    const closeOutside = (event) => {
      if (!rootRef.current?.contains(event.target)) setOpen(false);
    };
    const closeOnEscape = (event) => {
      if (event.key === 'Escape') setOpen(false);
    };
    document.addEventListener('pointerdown', closeOutside);
    document.addEventListener('keydown', closeOnEscape);
    return () => {
      document.removeEventListener('pointerdown', closeOutside);
      document.removeEventListener('keydown', closeOnEscape);
    };
  }, [open]);

  return <div className="goal-picker" ref={rootRef}>
    <button
      type="button"
      className="text-link"
      aria-haspopup="menu"
      aria-expanded={open}
      onClick={() => setOpen((current) => !current)}
    >Meta diaria <span>{formatGoal(goal)}</span><ChevronDown size={15}/></button>
    {open&&<div className="goal-picker-menu" role="menu" aria-label="Elige tu meta diaria">
      <p>Tu meta diaria</p>
      {GOALS.map((option) => <button
        key={option}
        type="button"
        role="menuitemradio"
        aria-checked={goal === option}
        className={goal === option ? 'selected' : ''}
        onClick={() => { onSelect(option); setOpen(false); }}
      ><span>{formatGoal(option)}</span>{goal === option&&<Check size={15}/>}</button>)}
    </div>}
  </div>;
}
