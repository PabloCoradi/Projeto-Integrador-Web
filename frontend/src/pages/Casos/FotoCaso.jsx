import { useEffect, useState } from "react";
import { gerarLinkFotoCaso } from "../../services/casos";
import { iniciaisCliente } from "./fotoCasoUtils";

function FotoCaso({ caso, nome, className = "" }) {
  const [url, setUrl] = useState("");

  useEffect(() => {
    let ativa = true;

    if (!caso?.tem_foto) return undefined;

    gerarLinkFotoCaso(caso.id)
      .then(({ url: link }) => {
        if (ativa) setUrl(link);
      })
      .catch(() => {
        if (ativa) setUrl("");
      });

    return () => { ativa = false; };
  }, [caso?.id, caso?.tem_foto]);

  return (
    <span className={`case-photo ${className}`} aria-hidden="true">
      <span className="case-photo__initials">{iniciaisCliente(nome)}</span>
      {url && <img src={url} alt="" onError={() => setUrl("")} />}
    </span>
  );
}

export default FotoCaso;
