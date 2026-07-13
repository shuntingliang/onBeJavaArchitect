export function generateUUID(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

export function generateCode(prefix: string, sequence: number): string {
  return `${prefix}_${String(sequence).padStart(4, '0')}`;
}

export function generateOrgCode(type: string, sequence: number): string {
  const prefixMap: Record<string, string> = {
    GROUP: 'GRP',
    COMPANY: 'CMP',
    DEPARTMENT: 'DEP',
    PROGRAM: 'PRG',
    PROJECT: 'PRJ',
  };
  return generateCode(prefixMap[type] || 'ORG', sequence);
}

export function generateUserCode(sequence: number): string {
  return generateCode('USR', sequence);
}

export function generatePositionCode(sequence: number): string {
  return generateCode('POS', sequence);
}

export function generateFunctionSetCode(sequence: number): string {
  return generateCode('FNS', sequence);
}

export function generateResourceCode(sequence: number): string {
  return generateCode('RES', sequence);
}

export function generateTemplateCode(sequence: number): string {
  return generateCode('TPL', sequence);
}
