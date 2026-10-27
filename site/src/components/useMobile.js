import { useEffect, useState } from 'react';

/** Mesmo ponto de quebra do CSS: abaixo de 768px vale o layout "Site Mobile" do Figma. */
export const CONSULTA_MOBILE = '(max-width: 767px)';

export function useMobile() {
  const [mobile, setMobile] = useState(
    () => typeof window !== 'undefined' && window.matchMedia(CONSULTA_MOBILE).matches
  );

  useEffect(() => {
    const consulta = window.matchMedia(CONSULTA_MOBILE);
    const atualizar = () => setMobile(consulta.matches);
    atualizar();
    consulta.addEventListener('change', atualizar);
    return () => consulta.removeEventListener('change', atualizar);
  }, []);

  return mobile;
}
