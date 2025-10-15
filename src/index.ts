export { templateVariableHtml } from "./lib/html";
export { templateVariable } from "./lib/syntax";

/**
 * Augment.
 */
declare module "micromark-util-types" {
  /**
   * Token types.
   */
  interface TokenTypeMap {
    templateVariable: "templateVariable";
    templateVariableMarker: "templateVariableMarker";
    templateVariableString: "templateVariableString";
  }
}
