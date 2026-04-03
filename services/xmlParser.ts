
import { NFeInfo, NFeProduct } from '../types';

export const parseNFeXML = async (file: File): Promise<{ info: NFeInfo, products: NFeProduct[] }> => {
  const text = await file.text();
  const parser = new DOMParser();
  const xmlDoc = parser.parseFromString(text, "text/xml");

  const parseError = xmlDoc.getElementsByTagName("parsererror")[0];
  if (parseError) {
    console.error("Erro de parsing XML:", parseError.textContent);
    throw new Error("Arquivo XML inválido ou malformado.");
  }

  const getTagValue = (parent: Element | Document | null, tagName: string) => {
    if (!parent) return '';
    // Try lowercase first, then uppercase if not found
    let nodes = parent.getElementsByTagNameNS ? parent.getElementsByTagNameNS('*', tagName) : parent.getElementsByTagName(tagName);
    if (nodes.length === 0) {
      nodes = parent.getElementsByTagNameNS ? parent.getElementsByTagNameNS('*', tagName.toUpperCase()) : parent.getElementsByTagName(tagName.toUpperCase());
    }
    return nodes[0]?.textContent || '';
  };

  const findFirstTag = (tagName: string) => {
    let nodes = xmlDoc.getElementsByTagNameNS ? xmlDoc.getElementsByTagNameNS('*', tagName) : xmlDoc.getElementsByTagName(tagName);
    if (nodes.length === 0) {
      nodes = xmlDoc.getElementsByTagNameNS ? xmlDoc.getElementsByTagNameNS('*', tagName.toUpperCase()) : xmlDoc.getElementsByTagName(tagName.toUpperCase());
    }
    return nodes[0];
  };

  const emit = findFirstTag('emit') as Element;
  const dest = findFirstTag('dest') as Element;
  const ide = findFirstTag('ide') as Element;
  const infNFe = findFirstTag('infNFe') as Element;

  const info: NFeInfo = {
    number: getTagValue(ide, 'nNF'),
    accessKey: infNFe?.getAttribute('Id')?.replace('NFe', '') || '',
    vendorCnpj: getTagValue(emit, 'CNPJ'),
    vendorName: getTagValue(emit, 'xNome'),
    destCnpj: getTagValue(dest, 'CNPJ'),
    emissionDate: getTagValue(ide, 'dhEmi'),
  };

  if (!info.number || !info.accessKey) {
    console.error("Dados da nota não encontrados:", { number: info.number, key: info.accessKey });
    throw new Error("XML Inválido: Número da nota ou chave de acesso não encontrados.");
  }

  const products: NFeProduct[] = [];
  let detNodes = xmlDoc.getElementsByTagNameNS ? xmlDoc.getElementsByTagNameNS('*', 'det') : xmlDoc.getElementsByTagName('det');
  if (detNodes.length === 0) {
    detNodes = xmlDoc.getElementsByTagNameNS ? xmlDoc.getElementsByTagNameNS('*', 'DET') : xmlDoc.getElementsByTagName('DET');
  }

  if (detNodes.length === 0) {
    console.warn("Nenhum nó 'det' ou 'DET' encontrado no XML. Verifique a estrutura do arquivo.");
  }

  Array.from(detNodes).forEach((node) => {
    let prod = (node as Element).getElementsByTagNameNS ? (node as Element).getElementsByTagNameNS('*', 'prod')[0] : (node as Element).getElementsByTagName('prod')[0];
    if (!prod) {
      prod = (node as Element).getElementsByTagNameNS ? (node as Element).getElementsByTagNameNS('*', 'PROD')[0] : (node as Element).getElementsByTagName('PROD')[0];
    }
    const code = getTagValue(prod as Element, 'cProd');
    const ean = getTagValue(prod as Element, 'cEAN');
    const description = getTagValue(prod as Element, 'xProd');
    const quantityExpected = parseFloat(getTagValue(prod as Element, 'qCom') || '0');
    const unit = getTagValue(prod as Element, 'uCom') || 'UN';

    if (code && description && quantityExpected > 0) {
      products.push({
        id: `${info.accessKey}_${code}`,
        code,
        ean,
        description,
        quantityExpected,
        quantityChecked: 0,
        unit
      });
    } else {
      console.warn("Produto ignorado por falta de dados ou quantidade zero:", { code, description, quantityExpected });
    }
  });

  return { info, products };
};

export const consolidateProducts = (allProducts: NFeProduct[]): NFeProduct[] => {
  const consolidated: Record<string, NFeProduct> = {};

  allProducts.forEach(p => {
    const key = p.ean && p.ean !== 'SEM GTIN' ? p.ean : p.code;
    if (consolidated[key]) {
      consolidated[key].quantityExpected = parseFloat((consolidated[key].quantityExpected + p.quantityExpected).toFixed(3));
    } else {
      consolidated[key] = { ...p };
    }
  });

  return Object.values(consolidated);
};
