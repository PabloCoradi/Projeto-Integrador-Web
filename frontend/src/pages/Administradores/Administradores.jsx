import { useEffect, useState } from "react";
import { apiRequest } from "../../services/api";
import { useAuth } from "../../contexts/AuthContext";

const MODULOS = [
  { id: "dashboard", nome: "Dashboard" },
  { id: "clientes", nome: "Clientes" },
  { id: "casos", nome: "Casos" },
  { id: "agenda", nome: "Agenda" },
];

const permissoesIniciais = () =>
  MODULOS.map((modulo) => ({
    modulo: modulo.id,
    pode_visualizar: false,
    pode_editar: false,
  }));

export default function Administradores() {
  const { usuario } = useAuth();

  const [usuarios, setUsuarios] = useState([]);
  const [permissoes, setPermissoes] = useState(permissoesIniciais);
  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [editando, setEditando] = useState(null);
  const [carregando, setCarregando] = useState(true);
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState("");
  const [sucesso, setSucesso] = useState("");

  async function carregarUsuarios() {
    try {
      setCarregando(true);
      const dados = await apiRequest("/api/administradores/");
      setUsuarios(dados);
      setErro("");
    } catch (error) {
      setErro(error.message);
    } finally {
      setCarregando(false);
    }
  }

  useEffect(() => {
    carregarUsuarios();
  }, []);

  function atualizarPermissao(modulo, campo, valor) {
    setPermissoes((atuais) =>
      atuais.map((permissao) => {
        if (permissao.modulo !== modulo) return permissao;

        const atualizada = { ...permissao, [campo]: valor };

        if (campo === "pode_editar" && valor) {
          atualizada.pode_visualizar = true;
        }

        if (campo === "pode_visualizar" && !valor) {
          atualizada.pode_editar = false;
        }

        return atualizada;
      })
    );
  }

  function limparFormulario() {
    setNome("");
    setEmail("");
    setSenha("");
    setPermissoes(permissoesIniciais());
    setEditando(null);
  }

  function iniciarEdicao(usuarioAlvo) {
    setEditando(usuarioAlvo.id);
    setNome(usuarioAlvo.nome);
    setEmail(usuarioAlvo.email);
    setSenha("");

    setPermissoes(
      MODULOS.map((modulo) => {
        const existente = usuarioAlvo.permissoes?.find(
          (p) => p.modulo === modulo.id
        );

        return {
          modulo: modulo.id,
          pode_visualizar: existente?.pode_visualizar || false,
          pode_editar: existente?.pode_editar || false,
        };
      })
    );

    setErro("");
    setSucesso("");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function salvarUsuario(evento) {
    evento.preventDefault();
    setErro("");
    setSucesso("");

    const payload = {
      nome: nome.trim(),
      email: email.trim(),
      permissoes,
    };

    if (senha) {
      payload.senha = senha;
    }

    if (!editando && !senha) {
      setErro("Informe uma senha para o novo usuário.");
      return;
    }

    try {
      setSalvando(true);

      if (editando) {
        await apiRequest(`/api/administradores/${editando}`, {
          method: "PUT",
          body: JSON.stringify(payload),
        });
        setSucesso("Usuário atualizado com sucesso.");
      } else {
        await apiRequest("/api/administradores/", {
          method: "POST",
          body: JSON.stringify(payload),
        });
        setSucesso("Usuário cadastrado com sucesso.");
      }

      limparFormulario();
      await carregarUsuarios();
    } catch (error) {
      setErro(error.message);
    } finally {
      setSalvando(false);
    }
  }

  async function inativarUsuario(usuarioAlvo) {
    if (
      !window.confirm(
        `Deseja realmente desativar o usuário ${usuarioAlvo.nome}?`
      )
    ) {
      return;
    }

    setErro("");
    setSucesso("");

    try {
      await apiRequest(
        `/api/administradores/${usuarioAlvo.id}/inativar`,
        { method: "PATCH" }
      );
      setSucesso("Usuário desativado com sucesso.");
      await carregarUsuarios();
    } catch (error) {
      setErro(error.message);
    }
  }

  if (!usuario?.is_admin) {
    return (
      <div className="content-card">
        <h2>Acesso restrito</h2>
        <p>Somente administradores podem acessar esta página.</p>
      </div>
    );
  }

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Administradores</h1>
          <p>Gerencie os usuários e suas permissões de acesso.</p>
        </div>
      </div>

      {erro && <div className="error-message">{erro}</div>}

      {sucesso && (
        <div className="success-message">{sucesso}</div>
      )}

      <div className="content-card admin-form-card">
        <h2>{editando ? "Editar usuário" : "Cadastrar usuário"}</h2>

        <form onSubmit={salvarUsuario}>
          <div className="form-grid">
            <div className="form-group">
              <label htmlFor="admin-nome">Nome completo</label>
              <input
                id="admin-nome"
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                required
                maxLength={150}
              />
            </div>

            <div className="form-group">
              <label htmlFor="admin-email">E-mail</label>
              <input
                id="admin-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <div className="form-group form-group-full">
              <label htmlFor="admin-senha">
                Senha {editando ? "(preencha somente para alterar)" : ""}
              </label>
              <input
                id="admin-senha"
                type="password"
                value={senha}
                onChange={(e) => setSenha(e.target.value)}
                required={!editando}
                minLength={8}
                maxLength={128}
                placeholder={editando ? "Nova senha (opcional)" : "Mínimo de 8 caracteres"}
              />
            </div>
          </div>

          <h3 className="permissions-title">Permissões por módulo</h3>

          <div className="permissions-table">
            <table>
              <thead>
                <tr>
                  <th>Módulo</th>
                  <th>Visualizar</th>
                  <th>Editar</th>
                </tr>
              </thead>
              <tbody>
                {MODULOS.map((modulo) => {
                  const permissao = permissoes.find(
                    (p) => p.modulo === modulo.id
                  );

                  return (
                    <tr key={modulo.id}>
                      <td>{modulo.nome}</td>
                      <td>
                        <input
                          type="checkbox"
                          checked={permissao?.pode_visualizar || false}
                          onChange={(e) =>
                            atualizarPermissao(
                              modulo.id,
                              "pode_visualizar",
                              e.target.checked
                            )
                          }
                          aria-label={`Visualizar ${modulo.nome}`}
                        />
                      </td>
                      <td>
                        <input
                          type="checkbox"
                          checked={permissao?.pode_editar || false}
                          onChange={(e) =>
                            atualizarPermissao(
                              modulo.id,
                              "pode_editar",
                              e.target.checked
                            )
                          }
                          aria-label={`Editar ${modulo.nome}`}
                        />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="form-actions">
            {editando && (
              <button
                type="button"
                className="secondary-button"
                onClick={limparFormulario}
              >
                Cancelar
              </button>
            )}

            <button
              type="submit"
              className="primary-button"
              disabled={salvando}
            >
              {salvando
                ? "Salvando..."
                : editando
                  ? "Salvar alterações"
                  : "Cadastrar usuário"}
            </button>
          </div>
        </form>
      </div>

      <div className="content-card admin-list-card">
        <h2>Usuários cadastrados</h2>

        {carregando ? (
          <p>Carregando usuários...</p>
        ) : usuarios.length === 0 ? (
          <p>Nenhum usuário cadastrado.</p>
        ) : (
          <div className="admin-table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>Nome</th>
                  <th>E-mail</th>
                  <th>Perfil</th>
                  <th>Status</th>
                  <th>Ações</th>
                </tr>
              </thead>

              <tbody>
                {usuarios.map((item) => (
                  <tr key={item.id}>
                    <td>{item.nome}</td>
                    <td>{item.email}</td>
                    <td>
                      {item.is_admin ? "Administrador" : "Usuário"}
                    </td>
                    <td>
                      <span className={item.ativo ? "status-active" : "status-inactive"}>
                        {item.ativo ? "Ativo" : "Inativo"}
                      </span>
                    </td>
                    <td>
                      <div className="admin-actions">
                        <button
                          type="button"
                          onClick={() => iniciarEdicao(item)}
                        >
                          Editar
                        </button>

                        {item.ativo && !item.is_admin && (
                          <button
                            type="button"
                            className="danger-button"
                            onClick={() => inativarUsuario(item)}
                          >
                            Desativar
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
