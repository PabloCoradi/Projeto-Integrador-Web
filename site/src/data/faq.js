// Textos do Figma: componente "Perguntas FAQ desktop" (Frame 33) — pergunta e
// resposta de cada "menu sanfona largo", nas três categorias.

const q = (pergunta, resposta) => ({ pergunta, resposta });

export const categoriasFaq = [
  {
    id: 'empresarial',
    rotulo: 'Direito empresarial',
    perguntas: [
      q(
        'Preciso de contrato social personalizado?',
        'Sim. Contratos genéricos normalmente não preveem regras importantes sobre retirada de sócios, distribuição de lucros, sucessão e resolução de conflitos.'
      ),
      q(
        'Como proteger a empresa em caso de saída de sócio?',
        'O ideal é possuir acordo de sócios com regras claras sobre retirada, apuração de haveres, concorrência e confidencialidade.'
      ),
      q(
        'Posso usar patrimônio da empresa para despesas pessoais?',
        'Não é recomendável. A mistura patrimonial pode gerar riscos fiscais, trabalhistas e até responsabilização pessoal dos sócios.'
      ),
      q(
        'O que fazer quando um cliente não paga?',
        'Primeiro é feita análise documental para cobrança extrajudicial. Não havendo solução, avalia-se protesto, execução ou ação judicial.'
      ),
      q(
        'Como reduzir riscos jurídicos na empresa?',
        'Com contratos bem elaborados, organização documental, políticas internas e prevenção trabalhista, tributária e societária.'
      ),
      q(
        'A empresa pode ser responsabilizada por atos de funcionários?',
        'Em muitos casos, sim. Por isso é importante possuir treinamento, compliance e políticas internas adequadas.'
      ),
      q(
        'Preciso registrar marca?',
        'Sim. O registro garante proteção jurídica e evita que terceiros utilizem ou registrem nome igual ou semelhante ao da sua marca. Além disso, garante que ninguém irá impedir o uso do nome ou logotipo da sua marca por ti mesmo, tendo em vista que somente quem registra de fato tem a garantia de uso.'
      ),
      q(
        'Como funciona a exclusão de sócio?',
        'A exclusão depende das regras do contrato social e da comprovação de falta grave ou quebra de deveres societários.'
      ),
    ],
  },
  {
    id: 'lgpd',
    rotulo: 'LGPD',
    perguntas: [
      q(
        'Minha empresa realmente precisa se adequar à LGPD?',
        'Sim. Toda empresa que realiza coleta, armazenamento ou utilização de dados pessoais deve observar as regras da LGPD.'
      ),
      q(
        'O que são dados pessoais?',
        'São informações capazes de identificar uma pessoa, como nome, CPF, telefone, e-mail, endereço e dados de saúde.'
      ),
      q(
        'Quais os riscos de não cumprir a LGPD?',
        'A empresa pode sofrer multas, processos judiciais, danos reputacionais e sanções administrativas.'
      ),
      q(
        'Preciso pedir autorização para usar dados de clientes?',
        'Nem sempre. O tratamento pode ocorrer com base em outras hipóteses legais previstas na LGPD, além do consentimento.'
      ),
      q(
        'Funcionários também entram na LGPD?',
        'Sim. Dados de empregados, currículos e informações internas também precisam de tratamento adequado.'
      ),
      q(
        'O que acontece em caso de vazamento de dados?',
        'O caso deve ser analisado rapidamente para adoção de medidas técnicas, jurídicas e eventual comunicação à ANPD e aos titulares.'
      ),
      q(
        'Minha empresa pequena precisa de política de privacidade?',
        'Sim. Ainda que simplificada, é importante possuir documentos mínimos de adequação e transparência.'
      ),
      q(
        'Posso compartilhar dados de clientes com terceiros?',
        'Somente nas hipóteses permitidas em lei e com observância das medidas de segurança e finalidade adequada.'
      ),
      q(
        'O que é encarregado de dados (DPO)?',
        'É o responsável pela comunicação entre empresa, titulares dos dados e Autoridade Nacional de Proteção de Dados.'
      ),
      q(
        'Como começar adequação à LGPD?',
        'Normalmente inicia-se com mapeamento de dados, análise de riscos, revisão contratual e implementação de políticas internas.'
      ),
    ],
  },
  {
    id: 'medico',
    rotulo: 'Direito médico',
    perguntas: [
      q(
        'O médico pode ser processado por resultado insatisfatório?',
        'Nem todo resultado desfavorável gera responsabilidade. É necessária análise técnica sobre conduta, informação adequada e eventual falha profissional.'
      ),
      q(
        'Prontuário médico pode ser solicitado pelo paciente?',
        'Sim. O paciente possui direito de acesso às informações relacionadas ao seu atendimento.'
      ),
      q(
        'Como o médico pode se proteger juridicamente?',
        'Com documentação adequada, prontuário completo, consentimento informado e boa comunicação com o paciente.'
      ),
      q(
        'O que é termo de consentimento informado?',
        'É o documento que registra que o paciente recebeu informações claras sobre riscos, procedimentos e alternativas do tratamento.'
      ),
      q(
        'Clínicas precisam cumprir LGPD?',
        'Sim. Dados de saúde são considerados dados sensíveis e exigem proteção ainda mais rigorosa.'
      ),
      q(
        'Plano de saúde pode negar tratamento?',
        'Depende do contrato, cobertura prevista e regulamentação da ANS. Muitas negativas podem ser discutidas judicialmente.'
      ),
      q(
        'O médico pode divulgar fotos de pacientes?',
        'Somente com autorização adequada e observando normas éticas e proteção de dados, como a não identificação do paciente.'
      ),
      q(
        'Como agir diante de denúncia em conselho profissional?',
        'O ideal é apresentar defesa técnica desde o início, com análise documental e estratégia adequada perante o conselho competente.'
      ),
    ],
  },
];
