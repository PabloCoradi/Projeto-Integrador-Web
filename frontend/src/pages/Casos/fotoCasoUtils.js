export function iniciaisCliente(nome = "") {
  const iniciais = nome
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((parte) => parte[0]);

  return iniciais.join("").toLocaleUpperCase("pt-BR") || "?";
}
