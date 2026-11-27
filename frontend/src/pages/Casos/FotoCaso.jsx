import { useEffect, useState } from "react";
import { gerarLinkFotoCaso } from "../../services/casos";
import { gerarLinkFotoCliente } from "../../services/clientes";
import { iniciaisCliente } from "./fotoCasoUtils";

// Mostra a foto da pasta. Sem foto própria, a pasta usa a foto do cadastro
// do cliente (o backend devolve essa foto no mesmo link do caso).
// Sem `caso` (caso ainda não cadastrado), mostra a foto do `cliente` escolhido.
function FotoCaso({ caso, cliente, nome, className = "" }) {
  const [url, setUrl] = useState("");

  const usarLinkDoCaso = Boolean(caso && (caso.tem_foto || caso.cliente_tem_foto));
  const usarLinkDoCliente = !caso && Boolean(cliente?.tem_foto);
  const idCaso = caso?.id;
  const idCliente = cliente?.id;
  const versaoCliente = cliente?.atualizado_em;

  useEffect(() => {
    let ativa = true;
    setUrl("");

    let pedido = null;
    if (usarLinkDoCaso) pedido = gerarLinkFotoCaso(idCaso);
    else if (usarLinkDoCliente) pedido = gerarLinkFotoCliente(idCliente);

    pedido
      ?.then(({ url: link }) => {
        if (ativa) setUrl(link);
      })
      .catch(() => {
        if (ativa) setUrl("");
      });

    return () => { ativa = false; };
  }, [usarLinkDoCaso, usarLinkDoCliente, idCaso, idCliente, versaoCliente]);

  return (
    <span className={`case-photo ${className}`} aria-hidden="true">
      <span className="case-photo__initials">{iniciaisCliente(nome)}</span>
      {url && <img src={url} alt="" onError={() => setUrl("")} />}
    </span>
  );
}

export default FotoCaso;
