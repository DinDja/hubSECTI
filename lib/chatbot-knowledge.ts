export interface KnowledgeEntry {
  id: string
  keywords: string[]
  title: string
  content: string
  category: string
  links?: { label: string; url: string }[]
}

const systems: KnowledgeEntry[] = [
  {
    id: "sistema-gestao-projetos",
    keywords: ["gestao de projetos", "gestao projetos", "projetos estrategicos", "secti projetos", "metas", "indicadores", "acompanhamento projetos", "plataforma gestao"],
    title: "Gestão de Projetos",
    content: "Plataforma de gestão e acompanhamento de projetos estratégicos da secretaria, com metas e indicadores integrados. Categoria: Gestão.",
    category: "sistemas",
    links: [{ label: "Acessar sistema", url: "https://secti.netlify.app" }],
  },
  {
    id: "sistema-gestao-contratos",
    keywords: ["gestao de contratos", "contratos", "prazos", "execucao contratual", "controle contratos", "setor contratos"],
    title: "Gestão de Contratos",
    content: "Ferramenta para controle de contratos, prazos e execução contratual da SECTI. Categoria: Gestão.",
    category: "sistemas",
    links: [{ label: "Acessar sistema", url: "https://secti-contratos.netlify.app" }],
  },
  {
    id: "sistema-inventarios",
    keywords: ["inventarios", "inventario", "ativos", "materiais", "recursos", "patrimonio", "bens", "controle ativos"],
    title: "Sistema de Inventários SECTI",
    content: "Gestão de inventário integrado para os ativos, materiais e recursos da secretaria. Categoria: Gestão.",
    category: "sistemas",
    links: [{ label: "Acessar sistema", url: "https://sectinventario.netlify.app" }],
  },
  {
    id: "sistema-conecta-bahia",
    keywords: ["conecta bahia", "conectabahia", "conectividade", "painel conecta", "monitoramento conectividade", "mapa conectividade"],
    title: "Painel Conecta Bahia",
    content: "Painel de visualização e monitoramento dos projetos de conectividade em toda a Bahia. Categoria: Dados.",
    category: "sistemas",
    links: [{ label: "Acessar sistema", url: "https://conectabahia.secti.ba.gov.br" }],
  },
  {
    id: "sistema-observatorio-cti",
    keywords: ["observatorio", "cti", "ciencia tecnologia inovacao", "dashboard cti", "dados p&d", "pesquisa desenvolvimento", "indicadores ciencia"],
    title: "Observatório de CT&I",
    content: "Dashboard que reúne dados e análises sobre ciência, tecnologia e inovação no estado da Bahia. Categoria: Pesquisa.",
    category: "sistemas",
    links: [{ label: "Acessar sistema", url: "https://simcc.uesc.br/observatorio" }],
  },
  {
    id: "sistema-mapeamento-ept",
    keywords: ["mapeamento ept", "ept", "escolas tecnicas", "educacao profissional", "mapeamento escolas", "politicas educacionais", "ensino tecnico"],
    title: "Mapeamento EPT",
    content: "Sistema de mapeamento de escolas públicas técnicas e políticas educacionais do estado. Categoria: Dados.",
    category: "sistemas",
    links: [{ label: "Acessar sistema", url: "https://mapfilterdemo.netlify.app" }],
  },
  {
    id: "sistema-leitura-projetos",
    keywords: ["leitura integral projetos", "projetos clubes", "analise projetos", "leitura projetos", "gestao projetos leitura", "aprova projetos"],
    title: "Leitura Integral de Projetos",
    content: "Ambiente para leitura, análise e gestão de projetos apoiados pela secretaria. Categoria: Gestão.",
    category: "sistemas",
    links: [{ label: "Acessar sistema", url: "https://projetosclubes.netlify.app" }],
  },
  {
    id: "sistema-fala-secti",
    keywords: ["fala secti", "falasecti", "comunicacao secti", "inclusao digital", "apresentacoes", "voz cidadã", "participacao cidada", "apresentacoes interativas"],
    title: "Fala SECTI",
    content: "Plataforma de comunicação e voz para iniciativas de inclusão digital e participação cidadã. Conta com login obrigatório para criar apresentações e modelos prontos editáveis de apresentações interativas. Categoria: Comunicação.",
    category: "sistemas",
    links: [{ label: "Acessar sistema", url: "https://falasecti.netlify.app" }],
  },
  {
    id: "sistema-espacos-dinamizadores",
    keywords: ["espacos dinamizadores", "colaboracao", "ecossistema inovacao", "intercambio ideias", "dinamizadores inovacao", "atores inovacao"],
    title: "Espaços Dinamizadores",
    content: "Plataforma para fomentar a colaboração e o intercâmbio de ideias entre os atores do ecossistema de inovação. Categoria: Comunicação.",
    category: "sistemas",
    links: [{ label: "Acessar sistema", url: "http://espacodinamizador.secti.ba.gov.br" }],
  },
  {
    id: "sistema-painel-territorios",
    keywords: ["painel territorios", "territorios secti", "auxilio patentes", "solicitacao patentes", "secti territorios"],
    title: "Painel SECTI Territórios",
    content: "Sistema de auxílio à solicitação de patentes. Categoria: Dados.",
    category: "sistemas",
    links: [{ label: "Acessar sistema", url: "https://secti-territorios.netlify.app" }],
  },
  {
    id: "sistema-conecta-clube",
    keywords: ["conecta clube", "conectaclube", "projetos cientificos escolas", "feed colaborativo", "clubinhos", "diario bordo", "biblioteca publica", "forum discussao", "trilha pedagogica", "propriedade intelectual inpi"],
    title: "Conecta Clube",
    content: "Plataforma web para apoiar a gestão e visibilidade de projetos científicos nas escolas públicas estaduais e municipais da Bahia. Reúne: feed colaborativo de projetos, perfis de clubes, diário de bordo, biblioteca de domínio público, fórum de discussão, agenda de eventos, trilha pedagógica e ferramentas de apoio ao registro de propriedade intelectual no INPI. Categoria: Pesquisa.",
    category: "sistemas",
    links: [{ label: "Acessar sistema", url: "https://conectaclubes.secti.ba.gov.br" }],
  },
  {
    id: "sistema-busca-patentes",
    keywords: ["busca patentes", "patentes", "propriedade intelectual", "pesquisa patentes", "patente inpi", "consulta patentes"],
    title: "Busca de Patentes",
    content: "Plataforma para pesquisa e consulta de patentes, promovendo o acesso à informação tecnológica e incentivando a inovação. Categoria: Pesquisa.",
    category: "sistemas",
    links: [{ label: "Acessar sistema", url: "https://patentes-search.vercel.app" }],
  },
  {
    id: "sistema-patenteslab",
    keywords: ["patenteslab", "dados abertos", "conjuntos de dados", "indicadores cti", "porta dados abertos secti", "dados publicos"],
    title: "PatentesLab SECTI",
    content: "Portal de dados abertos da SECTI, com conjuntos de dados sobre projetos, investimentos e indicadores de CT&I. Categoria: Dados.",
    category: "sistemas",
    links: [{ label: "Acessar sistema", url: "https://patenteslab.secti.ba.gov.br" }],
  },
]

const secti: KnowledgeEntry[] = [
  {
    id: "sobre-secti",
    keywords: ["secti", "secretaria ciencia", "ciencia tecnologia", "inovacao bahia", "sobre secti", "o que e secti", "missao secti", "secretaria inovacao"],
    title: "Sobre a SECTI",
    content: "A Secretaria de Ciência, Tecnologia e Inovação do Estado da Bahia atua na formulação e implementação de políticas públicas que promovem o avanço científico e a inovação tecnológica. Sua missão é modernizar a gestão pública e ampliar o acesso à informação no estado da Bahia.",
    category: "secti",
    links: [{ label: "Portal Oficial", url: "https://www.secti.ba.gov.br" }],
  },
  {
    id: "valores-secti",
    keywords: ["valores secti", "principios secti", "inclusao digital", "inovacao", "desenvolvimento", "transparencia", "eficiencia", "conectividade", "missao valores"],
    title: "Valores da SECTI",
    content: "A SECTI se baseia em 6 valores fundamentais:\n\n1. Inovação — Busca constante por soluções criativas e tecnológicas.\n2. Inclusão Digital — Democratização do acesso à tecnologia.\n3. Desenvolvimento — Promoção do crescimento econômico e social.\n4. Transparência — Gestão aberta e accountable.\n5. Eficiência — Otimização de recursos e processos.\n6. Conectividade — Integração digital em todo o estado.",
    category: "secti",
  },
  {
    id: "portal-oficial",
    keywords: ["portal oficial", "site secti", "site oficial", "www secti", "portal ba gov br"],
    title: "Portal Oficial da SECTI",
    content: "O portal oficial da Secretaria de Ciência, Tecnologia e Inovação está disponível em secti.ba.gov.br, com informações institucionais, notícias, transparência e serviços.",
    category: "secti",
    links: [{ label: "Acessar Portal", url: "https://www.secti.ba.gov.br" }],
  },
]

const hub: KnowledgeEntry[] = [
  {
    id: "sobre-hub",
    keywords: ["hub secti", "hub", "plataforma central", "sistemas integrados", "o que e hub", "portal sistemas", "central sistemas", "agregador sistemas"],
    title: "O que é o Hub SECTI?",
    content: "O Hub SECTI é a plataforma central de acesso aos sistemas e ferramentas da Secretaria de Ciência, Tecnologia e Inovação da Bahia. Reúne em um só lugar todos os sistemas internos da secretaria, projetos estratégicos, dados territoriais, indicadores de CT&I e muito mais. Foi desenvolvido para modernizar a gestão pública e facilitar o acesso à informação.",
    category: "hub",
  },
  {
    id: "navegacao-hub",
    keywords: ["navegar", "navegacao", "como usar", "como funciona", "secoes", "menu", "estrutura site", "mapa site"],
    title: "Navegação no Hub SECTI",
    content: "O Hub SECTI está organizado nas seguintes seções:\n\n1. Sistemas — Grade com todos os 13 sistemas disponíveis, com busca e filtros por categoria (Gestão, Dados, Pesquisa, Comunicação).\n2. Projetos — Lista de projetos estratégicos da secretaria, com dados do Firebase.\n3. Sobre — Informações sobre a SECTI, estatísticas dos territórios e indicadores.\n4. Timeline — Últimas notícias do Portal SECTI.\n\nUse o menu no topo da página para navegar entre as seções.",
    category: "hub",
  },
  {
    id: "sistemas-disponiveis",
    keywords: ["sistemas disponiveis", "quais sistemas", "lista sistemas", "quantos sistemas", "plataformas", "ferramentas secti", "sistemas secti"],
    title: "Sistemas Disponíveis",
    content: "O Hub SECTI reúne 13 sistemas divididos em 4 categorias:\n\nGestão (3): Gestão de Projetos, Gestão de Contratos, Sistema de Inventários SECTI.\nDados (4): Painel Conecta Bahia, Mapeamento EPT, Painel SECTI Territórios, PatentesLab SECTI.\nPesquisa (3): Observatório de CT&I, Conecta Clube, Busca de Patentes.\nComunicação (2): Fala SECTI, Espaços Dinamizadores.\n\nCada sistema possui um card com preview, descrição e link direto para acesso.",
    category: "hub",
    links: [{ label: "Ver sistemas", url: "#sistemas" }],
  },
  {
    id: "categorias-sistemas",
    keywords: ["categorias", "categoria", "filtros", "filtro", "gestao dados pesquisa comunicacao", "tipo sistema"],
    title: "Categorias dos Sistemas",
    content: "Os sistemas são organizados em 5 categorias de filtro:\n\n• Todos — Exibe todos os sistemas.\n• Gestão — Sistemas administrativos e de controle (contratos, projetos, inventários).\n• Dados — Painéis e portais de dados (conectividade, territórios, patentes).\n• Pesquisa — Plataformas de pesquisa e inovação (observatório, clubes de ciência).\n• Comunicação — Ferramentas de comunicação e colaboração (Fala SECTI, Espaços Dinamizadores).",
    category: "hub",
  },
]

const territorios: KnowledgeEntry[] = [
  {
    id: "territorios-bahia",
    keywords: ["territorios bahia", "territorio", "regioes bahia", "quantos territorios", "divisao territorial", "territorios identidade"],
    title: "Territórios da Bahia",
    content: "O estado da Bahia está dividido em 27 Territórios de Identidade, conforme delimitação da SEPLAN-BA, abrangendo 417 municípios.\n\nLista completa: Irecê, Velho Chico, Chapada Diamantina, Sisal, Litoral Sul, Baixo Sul, Extremo Sul, Médio Sudoeste da Bahia, Vale do Jiquiriçá, Sertão do São Francisco, Bacia do Rio Grande, Bacia do Paramirim, Sertão Produtivo, Piemonte do Paraguaçu, Bacia do Jacuípe, Piemonte da Diamantina, Semiárido Nordeste II, Litoral Norte e Agreste Baiano, Portal do Sertão, Sudoeste Baiano, Recôncavo, Médio Rio de Contas, Rio Corrente, Itaparica, Piemonte Norte do Itapicuru, Metropolitano de Salvador, Costa do Descobrimento.",
    category: "territorios",
  },
  {
    id: "territorio-especifico",
    keywords: ["territorio municipio", "municipios bahia", "cidades bahia", "qual territorio", "municipios territorio", "estado bahia"],
    title: "Territórios e Municípios",
    content: "Cada Território de Identidade agrupa um conjunto de municípios baianos. Você pode consultar os municípios de cada território na seção Sobre do Hub, onde há um modal com a divisão completa. Ao todo são 417 municípios distribuídos em 27 territórios.",
    category: "territorios",
  },
]

const projetos: KnowledgeEntry[] = [
  {
    id: "sobre-projetos",
    keywords: ["projetos", "projetos estrategicos", "estrategicos", "o que sao projetos", "projeto secti", "projetos cadastrados"],
    title: "Projetos Estratégicos",
    content: "A seção de Projetos do Hub SECTI exibe a lista de projetos estratégicos da secretaria, carregados diretamente do banco de dados Firebase. Cada projeto possui informações detalhadas como: título, natureza, status, instituição responsável, período, investimento, objetivo geral, objetivos específicos, indicadores, fotos e muito mais.",
    category: "projetos",
  },
  {
    id: "campos-projeto",
    keywords: ["campos projeto", "detalhes projeto", "informacoes projeto", "estrutura projeto", "dados projeto", "formulario projeto"],
    title: "Informações de um Projeto",
    content: "Cada projeto pode conter: título, natureza, status, estado atual, instituição, unidade, responsável, parceiros, período, estado, território, município, beneficiários, número de beneficiários, investimento real, PAOE, fonte de financiamento, local de execução, meta física, execução física, execução financeira, objetivo geral, objetivos específicos, fotos, contexto, problema/demanda, justificativa, sustentabilidade, riscos, pendências, observações, indicadores de processo, indicadores de resultado, recursos humanos, recursos materiais e número do processo SEI.",
    category: "projetos",
  },
  {
    id: "status-projeto",
    keywords: ["status projeto", "andamento projeto", "situacao projeto", "estado projeto", "fases projeto", "execucao projeto"],
    title: "Status dos Projetos",
    content: "Os projetos podem ter diferentes status e estados, como: em andamento, concluído, pendente, entre outros. Cada projeto exibe seu status atual e estado atual na página de detalhes.",
    category: "projetos",
  },
  {
    id: "buscar-projeto",
    keywords: ["encontrar projeto", "buscar projeto", "procurar projeto", "pesquisar projeto", "como buscar projeto", "filtrar projeto"],
    title: "Como Buscar Projetos",
    content: "Na seção de Projetos, você pode pesquisar projetos pelo campo de busca no topo da lista. A busca filtra por título, instituição, unidade, responsável, natureza e objetivo geral. Use os botões de paginação para navegar entre os resultados.",
    category: "projetos",
    links: [{ label: "Ver projetos", url: "#projetos" }],
  },
]

const conecta: KnowledgeEntry[] = [
  {
    id: "conecta-resumo",
    keywords: ["conecta bahia", "conecta", "conectividade", "pracas instaladas", "internet gratuita", "municipios conectados", "cobertura conecta", "pontos internet", "programa conectividade"],
    title: "Conecta Bahia",
    content: "O Conecta Bahia é o programa de conectividade do estado, que instala pontos de internet gratuita em praças e espaços públicos dos municípios baianos. Os dados de cobertura são atualizados em tempo real e podem ser visualizados no Painel Conecta Bahia, um dos sistemas do Hub. Pergunte-me pelos números atualizados que eu consulto a API ao vivo.",
    category: "conecta",
    links: [{ label: "Painel Conecta Bahia", url: "https://conectabahia.secti.ba.gov.br" }],
  },
]

const bahia: KnowledgeEntry[] = [
  {
    id: "bahia-perfil",
    keywords: ["bahia", "estado bahia", "sobre bahia", "perfil bahia", "dados bahia"],
    title: "Perfil da Bahia",
    content: "A Bahia é um dos 26 estados brasileiros, localizado na Região Nordeste. Capital: Salvador. Área: 564.733 km² (maior estado do Nordeste). População: ~14,8 milhões (4ª maior do Brasil). Maior litoral do país: ~1.100 km. Idioma oficial: português. Ginga, axé e diversidade marcam a identidade cultural baiana.",
    category: "bahia",
  },
  {
    id: "bahia-economia",
    keywords: ["economia bahia", "pib bahia", "setores bahia", "industria bahia", "agronegocio bahia", "petroquimica"],
    title: "Economia da Bahia",
    content: "Maior economia do Nordeste e uma das maiores do Brasil. PIB ~R$ 350 bilhões. Setores:\n• Indústria (petroquímica em Camaçari, automotiva, química)\n• Agropecuária (cacau no sul, soja no oeste, café, mandioca)\n• Serviços (comércio, turismo)\n• Petróleo (pré-sal, Petrobras)\n• Turismo (Costa do Descobrimento, Chapada Diamantina)",
    category: "bahia",
  },
  {
    id: "bahia-regioes-economicas",
    keywords: ["regioes bahia", "regiões economicas bahia", "mesorregioes bahia", "sertao bahia", "recôncavo bahia", "litoral bahia"],
    title: "Regiões da Bahia",
    content: "A Bahia é dividida em regiões geográficas e econômicas:\n• Região Metropolitana de Salvador (capital)\n• Recôncavo Baiano (histórico, cana-de-açúcar)\n• Sertão (semiárido)\n• Chapada Diamantina (turismo, ecologia)\n• Litoral Norte e Sul (turismo)\n• Extremo Sul (cacau)\n• Baixo Sul e Vale do Jiquiriçá\n• Oeste (soja)",
    category: "bahia",
  },
  {
    id: "bahia-cultura",
    keywords: ["cultura bahia", "tradições bahia", "festivais bahia", "musica bahia", "candomble", "capoeira"],
    title: "Cultura da Bahia",
    content: "Berço cultural do Brasil. Elementos marcantes:\n• Candomblé (de matriz africana)\n• Capoeira\n• Música (axé, samba, frevo baiano)\n• Festa de Iemanjá (02/fev)\n• Carnaval de Salvador (trio elétrico, blocos)\n• Festa da Conceição da Praia\n• Culinária (acarajé, vatapá, moqueca, cocada)\n• Literatura (Jorge Amada, Castro Alves)",
    category: "bahia",
  },
  {
    id: "bahia-biomas",
    keywords: ["biomas bahia", "caatinga bahia", "mata atlantica bahia", "cerrado bahia", "vegetacao bahia", "meio ambiente bahia"],
    title: "Biomas da Bahia",
    content: "A Bahia possui três biomas principais:\n• Caatinga (semiárido, ~54% do território)\n• Mata Atlântica (litoral, devastada e protegida)\n• Cerrado (oeste do estado)\n\nUnidades de conservação: Chapada Diamantina, Boqueirão da Onça, Abrolhos, Serra do Conduru.",
    category: "bahia",
  },
  {
    id: "bahia-salvador",
    keywords: ["salvador", "capital bahia", "cidade salvador", "primeira capital", "pelourinho"],
    title: "Salvador — a capital",
    content: "Salvador é a capital da Bahia e primeira capital do Brasil (fundada em 1549). População: ~2,9 milhões. divide-se em Cidade Alta e Cidade Baixa, ligadas pelo Elevador Lacerda. Pelourinho é centro histórico tombado pela UNESCO. Maior cidade do Nordeste (junto com Fortaleza/Recife). Centro político, econômico e cultural do estado.",
    category: "bahia",
  },
]

const sectiRico: KnowledgeEntry[] = [
  {
    id: "secti-missao",
    keywords: ["missao secti", "objetivo secti", "finalidade secti", "papel secti"],
    title: "Missão da SECTI",
    content: "A SECTI tem como missão formular, coordenar e implementar a política estadual de ciência, tecnologia e inovação (CT&I), promovendo:\n• O desenvolvimento científico e tecnológico\n• A inovação nas empresas e na gestão pública\n• A inclusão digital\n• A conectividade nos municípios\n• O fortalecimento do ecossistema de CT&I baiano",
    category: "secti",
  },
  {
    id: "secti-areas-atuacao",
    keywords: ["areas atuacao secti", "o que faz secti", "competencia secti", "atribuicoes secti"],
    title: "Áreas de Atuação da SECTI",
    content: "Atuação principal:\n1. Política de CT&I — Plano Estadual de CT&I, editais, fomento\n2. Conectividade — Programa Conecta Bahia (internet pública)\n3. Ecossistema de Inovação — incubadoras, parques tecnológicos, ICTs\n4. Inclusão Digital — telecentros, capacitação\n5. Propriedade Intelectual — apoio à patente, INPI\n6. Dados Abertos — porta de dados do estado\n7. Pesquisa e P&D — Universidades, institutos",
    category: "secti",
  },
  {
    id: "secti-programas",
    keywords: ["programas secti", "editais secti", "fomento secti", "conecta bahia programa", "telefone bahia fomento"],
    title: "Programas da SECTI",
    content: "Principais programas em execução:\n• Conecta Bahia — conectividade municipal\n• Conecta Clube — aprojeção científica nas escolas\n• Espaços Dinamizadores — rede de colaboração\n• Fomento à Pesquisa — editais, bolsas\n• Apoio à Inovação — patentes, incubadoras\n• Dados Abertos — transparência e dados públicos",
    category: "secti",
  },
  {
    id: "secti-legislacao",
    keywords: ["legislacao secti", "lei ciencia tecnologia bahia", "lei inovacao bahia", "marco legal cti bahia"],
    title: "Legislação de CT&I na Bahia",
    content: "Principais marcos legais:\n• Lei Estadual nº 13.379/2019 — Estatuto da Ciência, Tecnologia e Inovação da Bahia\n• Lei Rouanai (federal) — Incentivo Fiscal à Inovação\n• Marco Legal da Inovação (Lei 13.466/2019) — federal\n• Política Estadual de Desenvolvimento Científico e Tecnológico\n• Plano Estadual de CT&I (PECIT)",
    category: "secti",
  },
  {
    id: "secti-orgaos-relacionados",
    keywords: ["orgaos secti", "fapeb", "consecti", "conselho cti", "parques tecnologicos bahia"],
    title: "Órgãos Relacionados",
    content: "Estrutura e órgãos vinculados/regulatórios do sistema de CT&I baiano:\n• FAPESB — Fundação de Amparo à Pesquisa do Estado da Bahia\n• CONSECTI — Conselho Estadual de CT&I\n• Universidades (UFBA, UESC, UNEB, UFRB)\n• Institutos Federais (IFBA, IFBAiano)\n• ICTs oficiais (Senai Cimatec, FIO Cruz BA)\n• Sebrae-BA\n• Parques tecnológicos (TecSaúde, TecBahia)",
    category: "secti",
  },
  {
    id: "secti-indicadores-cti",
    keywords: ["indicadores cti bahia", "dados pesquisa bahia", "p&d bahia", "pesquisadores bahia"],
    title: "Indicadores de CT&I da Bahia",
    content: "A Bahia é um dos estados líderes em P&D no Nordeste. Indicadores observados:\n•ranking de investimentos em P&D\n• pesquisadores por mil habitantes\n• patentes depositadas no INPI\n• bolsas concedidas pela FAPESB\n• ICTs mapeadas (centenas de universidades, institutos e centros)\n• parques tecnológicos e incubadoras ativas\n\nConsulte o Observatório de CT&I (um dos sistemas do hub) para detalhes.",
    category: "secti",
      links: [{ label: "Observatório de CT&I", url: "https://simcc.uesc.br/observatorio" }],
  },
]

const geral: KnowledgeEntry[] = [
  {
    id: "contato-suporte",
    keywords: ["contato", "suporte", "ajuda secti", "fale conosco", "email secti", "telefone secti", "duvida", "duvidas"],
    title: "Contato e Suporte",
    content: "Para mais informações sobre a SECTI e seus sistemas, acesse o Portal Oficial em secti.ba.gov.br. O portal institucional disponibiliza canais de contato, transparência e serviços.",
    category: "geral",
    links: [{ label: "Portal Oficial", url: "https://www.secti.ba.gov.br" }],
  },
  {
    id: "noticias-secti",
    keywords: ["noticias secti", "novidades", "timeline secti", "ultimas noticias", "atualizacoes secti", "comunicados"],
    title: "Notícias da SECTI",
    content: "A seção Timeline do Hub exibe as últimas notícias publicadas no Portal SECTI, com data, título, descrição e link para ler na íntegra. As notícias são carregadas automaticamente do site oficial.",
    category: "geral",
    links: [{ label: "Portal de Notícias", url: "https://www.ba.gov.br/secti/noticias" }],
  },
  {
    id: "combobox-pesquisa",
    keywords: ["pesquisar", "busca", "buscar", "encontrar", "localizar", "procurar", "search", "campo busca"],
    title: "Pesquisa no Hub",
    content: "Você pode pesquisar sistemas pelo campo de busca na seção Sistemas, filtrando por nome ou descrição. Também é possível filtrar por categoria (Gestão, Dados, Pesquisa, Comunicação).",
    category: "geral",
  },
  {
    id: "saudacao",
    keywords: ["ola", "oi", "bom dia", "boa tarde", "boa noite", "hello", "hi", "ola tudo bem"],
    title: "Olá!",
    content: "Olá! Sou o assistente virtual do Hub SECTI. Posso te ajudar com:\n\n• Sistemas disponíveis no hub\n• Projetos estratégicos (com dados ao vivo)\n• Conecta Bahia (estatísticas em tempo real)\n• Territórios da Bahia\n• Informações sobre a SECTI\n• Navegação no portal\n\nO que você gostaria de saber?",
    category: "geral",
  },
  {
    id: "ajuda-topicos",
    keywords: ["ajuda", "socorro", "como usar", "o que posso perguntar", "menu", "opcoes", "topicos", "pode fazer"],
    title: "Como posso ajudar?",
    content: "Eu posso te ajudar com as seguintes informações:\n\n📋 Sistemas — Liste, busque e descreva os 13 sistemas do hub.\n📊 Projetos — Consulte o número de projetos cadastrados (ao vivo!) e busque por tema.\n🌐 Conecta Bahia — Veja estatísticas de conectividade em tempo real.\n🗺️ Territórios — Informações sobre os 27 territórios da Bahia.\n🏛️ SECTI — Sobre a secretaria, valores e missão.\n\nExperimente perguntar: \"Quais sistemas existem?\" ou \"Quantos projetos temos?\"",
    category: "geral",
  },
  {
    id: "agradecimento",
    keywords: ["obrigado", "obrigada", "valeu", "agradeco", "muito obrigado", "muito obrigada", "agradecido", "agradecida"],
    title: "De nada!",
    content: "De nada! Estou aqui para ajudar. Se tiver mais alguma dúvida sobre o Hub SECTI, é só perguntar. 😊",
    category: "geral",
  },
]

export const allEntries: KnowledgeEntry[] = [
  ...systems,
  ...secti,
  ...sectiRico,
  ...hub,
  ...territorios,
  ...bahia,
  ...projetos,
  ...conecta,
  ...geral,
]

export function getStaticEntries(): KnowledgeEntry[] {
  return allEntries
}

export function searchKnowledge(query: string): KnowledgeEntry[] {
  const { processQuery } = require("@/lib/nlu") as typeof import("@/lib/nlu/index")
  const result = processQuery(query, allEntries)
  return result.rankedEntries
    .filter((s) => s.score >= 4)
    .slice(0, 2)
    .map((s) => s.entry)
}

export function getFallbackResponse(): string {
  const suggestions = [
    "Quais sistemas estão disponíveis?",
    "O que é o Hub SECTI?",
    "Fale sobre a SECTI",
    "Quantos territórios tem a Bahia?",
    "O que é o Conecta Bahia?",
    "Quantos projetos existem?",
  ]
  const idx = Math.floor(Math.random() * suggestions.length)
  return `Não encontrei uma resposta específica para sua pergunta. Tente perguntar sobre:\n\n• Sistemas disponíveis\n• Projetos estratégicos\n• Territórios da Bahia\n• SECTI\n• Conecta Bahia\n\nSugestão: "${suggestions[idx]}"`
}

export function getQuickQuestions(): { label: string; query: string }[] {
  return [
    { label: "Sistemas", query: "Quais sistemas estão disponíveis?" },
    { label: "Sobre a SECTI", query: "O que é a SECTI?" },
    { label: "Projetos", query: "Quantos projetos existem?" },
    { label: "Territórios", query: "Quantos territórios tem a Bahia?" },
    { label: "Conecta Bahia", query: "Dados do Conecta Bahia" },
    { label: "Ajuda", query: "Como posso usar o assistente?" },
  ]
}
