// Abre uma aba nova já no clique e só depois coloca o endereço nela.
// Se a aba fosse aberta depois de esperar a resposta da API, o navegador
// poderia bloqueá-la como pop-up.
export async function abrirEmNovaAba(obterUrl) {
  const aba = window.open("", "_blank");
  if (aba) aba.opener = null;

  try {
    const url = await obterUrl();

    if (aba && !aba.closed) aba.location.href = url;
    else window.open(url, "_blank", "noopener");
  } catch (erro) {
    aba?.close();
    throw erro;
  }
}
