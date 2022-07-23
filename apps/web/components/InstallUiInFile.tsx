import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { a11yDark } from "react-syntax-highlighter/dist/cjs/styles/prism";
import { InlineCode } from "./Styled";

export function InstallUiInFile({ file }: { file: string }) {
  return (
    <>
      Add this to <InlineCode>{file}</InlineCode> (or other global file):
      <SyntaxHighlighter language="javascript" style={a11yDark}>
        {`import setupLocatorUI from "@locator/runtime";

if (process.env.NODE_ENV === "development") {
  setupLocatorUI();
}
`}
      </SyntaxHighlighter>
    </>
  );
}
