import { useEffect, useState } from "react";
import { gerarLinkFotoCliente } from "../../services/clientes";
import { iniciaisCliente } from "./clienteUtils";

function FotoCliente({ cliente, className = "" }) {
  const [foto, setFoto] = useState(null);

  useEffect(() => {
    let ativa = true;
    if (!cliente?.tem_foto) return () => { ativa = false; };

    gerarLinkFotoCliente(cliente.id)
      .then(({ url }) => {
        if (ativa) setFoto({ id: cliente.id, versao: cliente.atualizado_em, url });
      })
      .catch(() => {});

    return () => { ativa = false; };
  }, [cliente?.id, cliente?.tem_foto, cliente?.atualizado_em]);

  const url = foto?.id === cliente?.id
    && foto?.versao === cliente?.atualizado_em
    && cliente?.tem_foto
    ? foto.url
    : "";

  return (
    <span className={`person-avatar client-avatar ${className}`} aria-hidden="true">
      <span>{iniciaisCliente(cliente?.nome)}</span>
      {url && <img src={url} alt="" onError={() => setFoto(null)} />}
    </span>
  );
}

export default FotoCliente;
