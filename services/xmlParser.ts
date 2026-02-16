
import { NFeInfo, NFeProduct } from '../types';

export const parseNFeXML = async (file: File): Promise<{ info: NFeInfo, products: NFeProduct[] }> => {
  const text = await file.text();
  const parser = new DOMParser();
  const xmlDoc = parser.parseFromString(text, "text/xml");

  const getValue = (selector: string) => xmlDoc.querySelector(selector)?.textContent || '';

  const info: NFeInfo = {
    number: getValue('ide > nNF'),
    accessKey: xmlDoc.querySelector('infNFe')?.getAttribute('Id')?.replace('NFe', '') || '',
    vendorCnpj: getValue('emit > CNPJ'),
    vendorName: getValue('emit > xNome'), // Novo campo extraído do XML
    emissionDate: getValue('ide > dhEmi'),
  };

  const products: NFeProduct[] = [];
  const detNodes = xmlDoc.querySelectorAll('det');

  detNodes.forEach((node) => {
    const code = node.querySelector('prod > cProd')?.textContent || '';
    const ean = node.querySelector('prod > cEAN')?.textContent || '';
    const description = node.querySelector('prod > xProd')?.textContent || '';
    const quantityExpected = parseFloat(node.querySelector('prod > qCom')?.textContent || '0');

    products.push({
      id: `${info.accessKey}_${code}`,
      code,
      ean,
      description,
      quantityExpected,
      quantityChecked: 0
    });
  });

  return { info, products };
};

export const consolidateProducts = (allProducts: NFeProduct[]): NFeProduct[] => {
  const consolidated: Record<string, NFeProduct> = {};

  allProducts.forEach(p => {
    const key = p.ean && p.ean !== 'SEM GTIN' ? p.ean : p.code;
    if (consolidated[key]) {
      consolidated[key].quantityExpected += p.quantityExpected;
    } else {
      consolidated[key] = { ...p };
    }
  });

  return Object.values(consolidated);
};
