import { CategoryInfo } from '../types/portfolio.types';

export const DEFAULT_CATEGORIES: CategoryInfo[] = [
  { id: '1', name: 'Cercas Eletrificadas' },
  { id: '2', name: 'Instalação de Concertinas' },
  { id: '3', name: 'Projetos Elétricos' },
  { id: '4', name: 'Reparos Elétricos' },
  { id: '5', name: 'Automatizadores' },
  { id: '6', name: 'Sistemas de CFTV' },
  { id: '7', name: 'Controle de Acesso' },
  { id: '8', name: 'Instalações Elétricas' },
];

export function parseMediaUrlsText(text: string): string[] {
  return text
    .split('\n')
    .map((u) => u.trim())
    .filter((u) => u.length > 0);
}

export function formatSaveErrorMessage(err: any): string {
  let errMsg = 'Erro ao salvar projeto no portfólio.';
  const errorStr = err?.message || err?.toString() || '';
  const errorCode = err?.code || '';

  if (
    errorStr.toLowerCase().includes('quota') ||
    errorCode.toLowerCase().includes('quota')
  ) {
    errMsg =
      'Cota diária do banco de dados excedida ou as imagens são grandes demais. Reduza o número de fotos.';
  } else if (
    errorStr.toLowerCase().includes('permission') ||
    errorCode.toLowerCase().includes('permission')
  ) {
    errMsg =
      'Acesso negado. Certifique-se de que a descrição tem até 5000 caract. e o título até 200 caract.';
  } else if (
    errorStr.toLowerCase().includes('large') ||
    errorStr.toLowerCase().includes('size') ||
    errorCode.toLowerCase().includes('large')
  ) {
    errMsg =
      'Tamanho do documento excedido. Use imagens menores ou diminua a quantidade de fotos.';
  } else if (errorStr) {
    errMsg = `Erro: ${errorStr}`;
  }

  return errMsg;
}
