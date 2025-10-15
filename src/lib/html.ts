import type { HtmlExtension } from "micromark-util-types";

export function templateVariableHtml() {
  return {
    enter: {
      templateVariable() {
        this.tag("<var>");
      },
    },
    exit: {
      templateVariable() {
        this.tag("</var>");
      },
    },
  } as HtmlExtension;
}
