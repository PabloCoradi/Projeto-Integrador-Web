import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

/** Volta ao topo ao trocar de página (ou vai até a âncora, se houver). */
export default function ControleRolagem() {
  const { pathname, hash } = useLocation();

  useEffect(() => {
    if (hash) {
      document.getElementById(hash.slice(1))?.scrollIntoView();
      return;
    }
    window.scrollTo({ top: 0, behavior: 'instant' });
  }, [pathname, hash]);

  return null;
}
