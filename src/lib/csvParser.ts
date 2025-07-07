// Minimal CSV parser based on d3-dsv v3.0.1 (MIT License)
// Only the parse functionality is included.
export interface CsvRow {
  [key: string]: string;
}

function objectConverter(columns: string[]) {
  return function (row: string[]) {
    const obj: CsvRow = {};
    columns.forEach((c, i) => {
      obj[c] = row[i] ?? "";
    });
    return obj;
  };
}

export function csvParse(text: string): CsvRow[] {
  const rows = csvParseRows(text);
  const columns = rows.shift() ?? [];
  const convert = objectConverter(columns);
  return rows.map(convert);
}

export function csvParseRows(text: string): string[][] {
  const rows: string[][] = [];
  let N = text.length,
    I = 0,
    t: string | typeof EOF,
    eof = N <= 0,
    eol = false;
  if (text.charCodeAt(N - 1) === NEWLINE) --N;
  if (text.charCodeAt(N - 1) === RETURN) --N;

  function token(): string | typeof EOL | typeof EOF {
    if (eof) return EOF;
    if (eol) return ((eol = false), EOL);
    let i: number, c: number;
    const j = I;
    if (text.charCodeAt(j) === QUOTE) {
      while (
        (I++ < N && text.charCodeAt(I) !== QUOTE) ||
        text.charCodeAt(++I) === QUOTE
      );
      if ((i = I) >= N) eof = true;
      else if ((c = text.charCodeAt(I++)) === NEWLINE) eol = true;
      else if (c === RETURN) {
        eol = true;
        if (text.charCodeAt(I) === NEWLINE) ++I;
      }
      return text.slice(j + 1, i - 1).replace(/""/g, '"');
    }
    while (I < N) {
      if ((c = text.charCodeAt((i = I++))) === NEWLINE) eol = true;
      else if (c === RETURN) {
        eol = true;
        if (text.charCodeAt(I) === NEWLINE) ++I;
      } else if (c !== DELIMITER) continue;
      return text.slice(j, i);
    }
    return ((eof = true), text.slice(j, N));
  }

  while ((t = token()) !== EOF) {
    const row: string[] = [];
    while (t !== EOL && t !== EOF) {
      row.push(t as string);
      t = token();
    }
    rows.push(row);
  }
  return rows;
}

const EOL = {} as const;
const EOF = {} as const;
const QUOTE = 34;
const NEWLINE = 10;
const RETURN = 13;
const DELIMITER = ",".charCodeAt(0);

// Backwards compatible alias
export { csvParse as parseCsv };
