import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

document.addEventListener('mouseover', (e) => {
  const el = e.target as HTMLElement | null;
  if (!el) return;
  let node: HTMLElement | null = el;
  while (node && node !== document.body) {
    if (typeof (node as any).onclick === 'function' || node.getAttribute('role') === 'button' || node.tagName === 'BUTTON' || node.tagName === 'A') {
      el.style.cursor = 'pointer';
      return;
    }
    node = node.parentElement;
  }
});

createRoot(document.getElementById('root')!).render(<App />);
