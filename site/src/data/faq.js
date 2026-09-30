// TODO: o Figma só traz a resposta da primeira pergunta.
// Preencha as demais respostas (campo `resposta`) antes de publicar.
const PENDENTE =
  'Resposta em elaboração. Enquanto isso, fale com a nossa equipe pelo WhatsApp ou e-mail.';

const q = (pergunta, resposta = PENDENTE) => ({ pergunta, resposta });

export const categoriasFaq = [
  {
    id: 'empresarial',
    rotulo: 'Direito empresarial',
    perguntas: [
      q(
        'Preciso de contrato social personalizado?',
        'Sim. Contratos genéricos normalmente não preveem regras importantes sobre retirada de sócios, distribuição de lucros, sucessão e resolução de conflitos.'
      ),
      q('Como proteger a empresa em caso de saída de sócio?'),
      q('Posso usar patrimônio da empresa para despesas pessoais?'),
      q('O que fazer quando um cliente não paga?'),
      q('Como reduzir riscos jurídicos na empresa?'),
      q('A empresa pode ser responsabilizada por atos de funcionários?'),
      q('Preciso registrar marca?'),
      q('Como funciona a exclusão de sócio?'),
    ],
  },
  {
    id: 'lgpd',
    rotulo: 'LGPD',
    perguntas: [
      q('Minha empresa realmente precisa se adequar à LGPD?'),
      q('O que são dados pessoais?'),
      q('Quais os riscos de não cumprir a LGPD?'),
      q('Preciso pedir autorização para usar dados de clientes?'),
      q('Funcionários também entram na LGPD?'),
      q('O que acontece em caso de vazamento de dados?'),
      q('Minha empresa pequena precisa de política de privacidade?'),
      q('Posso compartilhar dados de clientes com terceiros?'),
      q('O que é encarregado de dados (DPO)?'),
      q('Como começar adequação à LGPD?'),
    ],
  },
  {
    id: 'medico',
    rotulo: 'Direito médico',
    perguntas: [
      q('O médico pode ser processado por resultado insatisfatório?'),
      q('Prontuário médico pode ser solicitado pelo paciente?'),
      q('Como o médico pode se proteger juridicamente?'),
      q('O que é termo de consentimento informado?'),
      q('Clínicas precisam cumprir LGPD?'),
      q('Plano de saúde pode negar tratamento?'),
      q('O médico pode divulgar fotos de pacientes?'),
      q('Como agir diante de denúncia em conselho profissional?'),
    ],
  },
];
