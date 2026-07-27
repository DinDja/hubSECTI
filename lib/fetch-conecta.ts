import * as XLSX from 'xlsx';
import MUNICIPIOS_BAHIA from './municipios-data.js';

const FINANCIAL_PATTERNS = [
  'recurso', 'inova cidade', 'investimento estadual',
  'execução financeira', 'execucao financeira',
  'execução física', 'execucao fisica',
  'valor implantação', 'valor implantacao',
  'nota fiscal', 'nº sei nota fiscal',
  'pagamento efetuado', 'processo de pagamento',
];

const MUNICIPIO_KEY_ALIASES: Record<string, string> = {
  muquem_do_sao_francisco: 'muquem_de_sao_francisco',
};

function normalizeHeader(raw: unknown): string {
  if (raw == null) return '';
  return String(raw).replace(/[\r\n]+/g, ' ').replace(/\s+/g, ' ').trim();
}

function normalizeForMatch(raw: unknown): string {
  return normalizeHeader(raw)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();
}

function isFinancial(header: string): boolean {
  return FINANCIAL_PATTERNS.some((p) => header.toLowerCase().includes(p));
}

function normalizeMunicipioKey(nome: string): string {
  const normalized = normalizeHeader(nome)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/\s+/g, '_')
    .trim();
  return MUNICIPIO_KEY_ALIASES[normalized] || normalized;
}

function convertExcelDate(excelDate: unknown): string {
  if (typeof excelDate === 'string') {
    if (/^\d{1,2}[/\-]\d{1,2}[/\-]\d{2,4}$/.test(excelDate) || /^\d{4}[/\-]\d{2}[/\-]\d{2}$/.test(excelDate)) {
      return excelDate;
    }
  }
  const num = parseInt(String(excelDate), 10);
  if (isNaN(num)) return String(excelDate);
  const date = new Date((num - 25569) * 86400 * 1000);
  const dia = String(date.getDate()).padStart(2, '0');
  const mes = String(date.getMonth() + 1).padStart(2, '0');
  const ano = date.getFullYear();
  return `${dia}/${mes}/${ano}`;
}

function findColIndex(headers: string[], patterns: string[]): number {
  const normed = headers.map((h) => normalizeForMatch(h));
  for (const pat of patterns) {
    const target = normalizeForMatch(pat);
    const idx = normed.findIndex((h) => h.includes(target));
    if (idx !== -1) return idx;
  }
  return -1;
}

function findHeaderRow(rows: unknown[][]): number {
  const maxRowsToInspect = Math.min(25, rows.length);
  const headerGroups = [
    ['municipio'],
    ['projeto'],
    ['territorio de identidade', 'territorio'],
    ['local', 'descricao do local'],
    ['status instalacao', 'homologacao prodeb', 'instalacao link (tld)'],
  ];

  let fallbackIdx = 0;
  for (let i = 0; i < maxRowsToInspect; i++) {
    const filled = (rows[i] || []).filter((c) => c != null && String(c).trim() !== '').length;
    if (filled >= 10) { fallbackIdx = i; break; }
  }

  let bestIdx = fallbackIdx;
  let bestScore = -1;

  for (let i = 0; i < maxRowsToInspect; i++) {
    const headers = (rows[i] || []).map(normalizeHeader);
    const filled = headers.filter(Boolean).length;
    if (filled < 5) continue;
    let score = filled >= 10 ? 1 : 0;
    for (const group of headerGroups) {
      if (findColIndex(headers, group) !== -1) score += 2;
    }
    if (score > bestScore) { bestScore = score; bestIdx = i; }
  }
  return bestScore > 0 ? bestIdx : fallbackIdx;
}

function headerToKey(header: string): string {
  return normalizeHeader(header)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_|_$/g, '');
}

function parseExcel(buffer: ArrayBuffer): Record<string, unknown[]> {
  const workbook = XLSX.read(buffer, {
    type: 'array',
    dense: true,
    cellFormula: false,
    cellHTML: false,
    cellStyles: false,
    cellText: false,
    sheetStubs: false,
  });

  let sheetName = workbook.SheetNames[1] || workbook.SheetNames[0];
  const acompanhaSheet = workbook.SheetNames.find(name =>
    name.toLowerCase().includes('acompanham') || name.toLowerCase().includes('acompanhamento')
  );
  if (acompanhaSheet) sheetName = acompanhaSheet;

  const sheet = workbook.Sheets[sheetName];
  const rows = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '', raw: true, blankrows: false }) as unknown[][];

  if (rows.length < 2) throw new Error('Planilha vazia');

  const headerIdx = findHeaderRow(rows);
  const headers = (rows[headerIdx] || []).map(normalizeHeader);

  const iMunicipio = findColIndex(headers, ['município', 'municipio']);
  const iPraca = findColIndex(headers, ['descrição do local', 'descricao do local', 'nome da praça', 'nome_da_praca']);
  const iProjeto = findColIndex(headers, ['projeto']);
  const iTerritorio = findColIndex(headers, ['território de identidade', 'territorio de identidade', 'território', 'territorio']);
  const iStatus = findColIndex(headers, ['status instalação', 'status instalacao']);
  const iLinkTLD = findColIndex(headers, ['instalação link (tld)', 'instalacao link (tld)', 'link (tld)']);
  const iHomolog = findColIndex(headers, ['homologação prodeb', 'homologacao prodeb']);
  const iLocal = findColIndex(headers, ['local']);
  const iKitInd = findColIndex(headers, ['kit aldeias indígenas', 'kit aldeias indigenas', 'aldeias indígenas', 'aldeias indigenas']);
  const iKitQuil = findColIndex(headers, ['kit quilombo', 'quilombo']);

  const iMun = iMunicipio !== -1 ? iMunicipio : (iLocal !== -1 ? iLocal : findColIndex(headers, ['mun']));

  if (iMun === -1) throw new Error('Coluna de município não encontrada');

  const keyIndices = new Set([iMun, iPraca, iProjeto, iTerritorio, iStatus, iLinkTLD, iHomolog, iKitInd, iKitQuil].filter(i => i !== -1));

  const extraCols = headers
    .map((h, i) => ({ h, i }))
    .filter(({ h, i }) => !keyIndices.has(i) && h && !isFinancial(h))
    .slice(0, 15)
    .map(({ h, i }) => ({ key: headerToKey(h), label: h, idx: i }));

  const result: Record<string, unknown[]> = {};
  const municipiosMap = new Map<string, string>();
  MUNICIPIOS_BAHIA.forEach((m: string) => municipiosMap.set(normalizeMunicipioKey(m), m));

  for (let r = headerIdx + 1; r < rows.length; r++) {
    const row = rows[r];
    if (!row || row.length === 0) continue;

    const municipioInput = iMun !== -1 ? String(row[iMun] || '').trim() : '';
    if (!municipioInput) continue;
    if (/^\d+([.,]\d+)?$/.test(municipioInput)) continue;

    const valLinkTLD = iLinkTLD !== -1 ? String(row[iLinkTLD] || '').trim() : '';
    const rawHom = iHomolog !== -1 ? String(row[iHomolog] || '').trim() : '';
    const valHom = rawHom ? convertExcelDate(rawHom) : '';

    const nomeKey = normalizeMunicipioKey(municipioInput);
    const municipioNome = municipiosMap.get(nomeKey) || municipioInput;

    const praca: Record<string, string> = {
      projeto: iProjeto !== -1 ? String(row[iProjeto] || '').trim() : '',
      nome_da_praca: iPraca !== -1 ? String(row[iPraca] || '').trim() : '',
      territorio_identidade: iTerritorio !== -1 ? String(row[iTerritorio] || '').trim() : '',
      status_instalacao: iStatus !== -1 ? String(row[iStatus] || '').trim() : '',
      kit_aldeias_indigenas: iKitInd !== -1 ? String(row[iKitInd] || '').trim() : '',
      kit_quilombo: iKitQuil !== -1 ? String(row[iKitQuil] || '').trim() : '',
      instalacao_link_tld: valLinkTLD,
      homologacao_prodeb: valHom,
    };

    for (const col of extraCols) {
      const val = row[col.idx];
      if (val == null || val === '') continue;
      let processedVal = String(val).trim();
      if ((col.label.toLowerCase().includes('data') || col.label.toLowerCase().includes('date')) && processedVal) {
        processedVal = convertExcelDate(processedVal);
      }
      praca[col.key] = processedVal;
    }

    if (!result[municipioNome]) result[municipioNome] = [];
    result[municipioNome].push(praca);
  }

  return result;
}

const CONECTA_PAGES_URL = process.env.CONECTA_PAGES_URL || 'https://hubsecti.pages.dev/api/conecta';

export async function fetchConectaData(options?: { nocache?: boolean }): Promise<Record<string, unknown[]>> {
  const url = new URL(CONECTA_PAGES_URL);
  if (options?.nocache) url.searchParams.set('nocache', 'true');

  const res = await fetch(url.toString(), { cache: 'no-store' });

  if (!res.ok) {
    throw new Error(`Falha ao buscar Conecta: HTTP ${res.status}`);
  }

  const contentType = res.headers.get('content-type') || '';

  if (contentType.includes('json')) {
    return res.json();
  }

  const buffer = await res.arrayBuffer();
  return parseExcel(buffer);
}

export async function fetchConectaSummary(options?: { nocache?: boolean }) {
  const data = await fetchConectaData(options);
  return computeCoverage(data);
}

function computeCoverage(data: Record<string, unknown[]>) {
  const municipalitiesSet = new Set<string>();
  const territoriesSet = new Set<string>();
  let installedPointsCount = 0;

  for (const [municipio, pracas] of Object.entries(data)) {
    const rows = Array.isArray(pracas) ? pracas : [];
    const installedRows = rows.filter((r: any) => String(r?.status_instalacao || '').trim().toLowerCase() === 'instalado');
    if (installedRows.length === 0) continue;
    municipalitiesSet.add(municipio);
    installedPointsCount += installedRows.length;
  }

  return {
    municipalitiesCount: municipalitiesSet.size,
    territoriesCount: territoriesSet.size,
    installedPointsCount,
    municipalitiesSet,
    territoriesSet,
  };
}
