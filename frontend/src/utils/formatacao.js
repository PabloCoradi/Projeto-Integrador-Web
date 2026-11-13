export function formatarTamanho(bytes) {
  if (bytes < 1024) {
    return `${bytes} B`;
  }

  const unidades = ["KB", "MB", "GB", "TB"];
  let valor = bytes / 1024;
  let indice = 0;

  while (valor >= 1024 && indice < unidades.length - 1) {
    valor /= 1024;
    indice += 1;
  }

  return `${valor.toFixed(valor >= 10 ? 0 : 1)} ${unidades[indice]}`;
}

export function formatarData(valor) {
  const temFuso = /Z$|[+-]\d{2}:\d{2}$/.test(valor);

  return new Date(temFuso ? valor : `${valor}Z`).toLocaleString("pt-BR");
}
