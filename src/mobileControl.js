import { useEffect, useState } from "react";

 export function useMobile(breakpoint = 768) {
  const [isMobile, setIsMobile] = useState(
    typeof window !== 'undefined' ? window.innerWidth < breakpoint : false
  );

  useEffect(() => {
    // Se estiver rodando no servidor (SSR), evita erro
    if (typeof window === 'undefined') return;

    const handleResize = () => {
      setIsMobile(window.innerWidth < breakpoint);
    };

    window.addEventListener('resize', handleResize);
    
    // Cleanup do evento ao desmontar o componente
    return () => window.removeEventListener('resize', handleResize);
  }, [breakpoint]);

  return isMobile;
}