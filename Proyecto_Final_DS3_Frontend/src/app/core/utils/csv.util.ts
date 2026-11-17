/** Convierte filas a CSV (UTF-8 con BOM para que Excel respete los acentos). */
export function toCsv(headers: string[], rows: (string | number | null | undefined)[][]): string {
  const escape = (value: string | number | null | undefined): string => {
    if (value === null || value === undefined) {
      return '';
    }
    let text = String(value);
    // Evita inyección de fórmulas al abrir el archivo en Excel.
    if (typeof value === 'string' && /^[=+\-@\t\r]/.test(text)) {
      text = "'" + text;
    }
    if (/[",\n\r]/.test(text)) {
      text = '"' + text.replace(/"/g, '""') + '"';
    }
    return text;
  };
  const lines = [headers, ...rows].map(row => row.map(escape).join(','));
  return '\ufeff' + lines.join('\r\n');
}
