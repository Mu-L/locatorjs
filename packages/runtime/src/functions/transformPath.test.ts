import { transformPath } from "./transformPath";

describe("transformPath", () => {
  test("replacing internal url to external", () => {
    expect(transformPath("/app/src/myFile.js", "/app/", "C://myPath/")).toBe(
      "C://myPath/src/myFile.js"
    );
  });

  test("unifying absolute and relative paths", () => {
    const from = "^/src/";
    const to = "/myPath/src/";

    expect(transformPath("/src/myFile.js", from, to)).toBe(
      "/myPath/src/myFile.js"
    );
    expect(transformPath("/myPath/src/myFile.js", from, to)).toBe(
      "/myPath/src/myFile.js"
    );
  });
});
