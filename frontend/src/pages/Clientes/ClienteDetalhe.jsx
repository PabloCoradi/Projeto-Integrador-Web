import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";

import { useAuth } from "../../contexts/AuthContext";
import { buscarCliente } from "../../services/clientes";
import { listarCasos } from "../../services/casos";
import { formatarData } from "../../utils/formatacao";

import DocumentosCliente from "./DocumentosCliente";
import FotoCliente from "./FotoCliente";
import "../Casos/Casos.css";
import "./Clientes.css";

// Página do cliente: dados do cadastro, documentos e os casos vinculados.
function ClienteDetalhe() {
  const { clienteId } = useParams();
  const { podeVisualizar } = useAuth();
  const podeVerCasos = podeVisualizar("casos");

  const [cliente, setCliente] = useState(null);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState("");

  const [casos, setCasos] = useState([]);
  const [carregandoCasos, setCarregandoCasos] = useState(true);
  const [erroCasos, setErroCasos] = useState("");

  useEffect(() => {
    let ativa = true;

    buscarCliente(clienteId, true)
      .then((dados) => {
        if (ativa) setCliente(dados);
      })
      .catch((e) => {
        if (ativa) setErro(e.message);
      })
      .finally(() => {
        if (ativa) setCarregando(false);
      });

    return () => { ativa = false; };
  }, [clienteId]);

  useEffect(() => {
    if (!podeVerCasos) return undefined;
    let ativa = true;

    // Casos em andamento primeiro, depois os inativos.
    Promise.all([
      listarCasos({ clienteId }),
      listarCasos({ clienteId, situacao: "inativos" }),
    ])
      .then(([ativos, inativos]) => {
        if (ativa) setCasos([...ativos, ...inativos]);
      })
      .catch((e) => {
        if (ativa) setErroCasos(e.message);
      })
      .finally(() => {
        if (ativa) setCarregandoCasos(false);
      });

    return () => { ativa = false; };
  }, [clienteId, podeVerCasos]);

  if (carregando) {
    return (
      <div className="page page--client-detail">
        <div className="empty-state empty-state--compact">Carregando cliente...</div>
      </div>
    );
  }

  if (!cliente) {
    return (
      <div className="page page--client-detail">
        <Link to="/clientes" className="back-link">← Voltar para clientes</Link>
        <div className="alert alert--error" role="alert">
          {erro || "Cliente não encontrado."}
        </div>
      </div>
    );
  }

  return (
    <div className="page page--client-detail">
      <Link to="/clientes" className="back-link">← Voltar para clientes</Link>

      <section className="case-detail" aria-labelledby="cliente-detalhe-titulo">
        <div className="case-detail__intro">
          <FotoCliente cliente={cliente} className="client-avatar--detail" />
          <div>
            <p className="case-detail__eyebrow">Cliente</p>
            <h1 id="cliente-detalhe-titulo" className="client-detail__name">
              {cliente.nome}
              {!cliente.ativo && <span className="inactive-chip">Inativo</span>}
            </h1>
            <p>Cliente desde {formatarData(cliente.criado_em).split(",")[0]}</p>
          </div>
        </div>

        <dl className="case-detail__client-info">
          <div><dt>CPF/CNPJ</dt><dd>{cliente.cpf_cnpj || "Não informado"}</dd></div>
          <div><dt>E-mail</dt><dd>{cliente.email || "Não informado"}</dd></div>
          <div><dt>Telefone</dt><dd>{cliente.telefone || "Não informado"}</dd></div>
          <div><dt>Endereço</dt><dd>{cliente.endereco || "Não informado"}</dd></div>
          {cliente.observacoes && (
            <div className="case-detail__client-notes">
              <dt>Observações</dt><dd>{cliente.observacoes}</dd>
            </div>
          )}
        </dl>
      </section>

      <DocumentosCliente
        cliente={cliente}
        titulo="Documentos"
        somenteLeitura={!cliente.ativo}
      />

      {podeVerCasos && (
        <section className="surface data-panel client-cases" aria-labelledby="casos-do-cliente-titulo">
          <div className="section-heading list-heading">
            <div>
              <h2 id="casos-do-cliente-titulo">Casos vinculados</h2>
              <p>Clique no título para abrir o caso.</p>
            </div>
            {!carregandoCasos && !erroCasos && (
              <span className="cases-browser__count">
                {casos.length} {casos.length === 1 ? "caso" : "casos"}
              </span>
            )}
          </div>

          {erroCasos ? (
            <div className="alert alert--error client-cases__message" role="alert">{erroCasos}</div>
          ) : carregandoCasos ? (
            <div className="empty-state empty-state--compact">Carregando casos...</div>
          ) : casos.length === 0 ? (
            <div className="empty-state empty-state--compact">
              Nenhum caso vinculado a este cliente.
            </div>
          ) : (
            <div className="table-scroll" role="region" aria-label="Casos do cliente" tabIndex={0}>
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Título</th>
                    <th>Tipo de atendimento</th>
                    <th>Arquivos</th>
                    <th>Aberto em</th>
                    <th>Situação</th>
                  </tr>
                </thead>
                <tbody>
                  {casos.map((caso) => (
                    <tr key={caso.id}>
                      <td>
                        <Link to={`/casos/${caso.id}`} className="client-cases__link">
                          {caso.titulo}
                        </Link>
                      </td>
                      <td>{caso.tipo_atendimento}</td>
                      <td>{caso.quantidade_arquivos}</td>
                      <td>{formatarData(caso.criado_em).split(",")[0]}</td>
                      <td>
                        {caso.ativo && caso.cliente_ativo ? (
                          <span className="status-chip">Em andamento</span>
                        ) : (
                          <span className="inactive-chip">Inativo</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      )}
    </div>
  );
}

export default ClienteDetalhe;
