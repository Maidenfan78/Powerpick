import { csvParse, csvParseRows } from "../csvParser";

describe("csv parsing utilities", () => {
  test("csvParse converts CSV text to objects", () => {
    const text = "a,b\n1,2\n3,4";
    expect(csvParse(text)).toEqual([
      { a: "1", b: "2" },
      { a: "3", b: "4" },
    ]);
  });

  test("csvParseRows handles quoted values with commas", () => {
    const text = 'a,b\n"1,1",2';
    expect(csvParseRows(text)).toEqual([
      ["a", "b"],
      ["1,1", "2"],
    ]);
  });
});
