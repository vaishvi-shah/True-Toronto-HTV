import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import 'lenis/dist/lenis.css';
import { initCinematic } from './motion/cinematic';

createRoot(document.getElementById('root')!).render(<App />);

// Cinematic scroll + reveal choreography (self-disables under reduced motion)
requestAnimationFrame(() => {
  initCinematic();
});
