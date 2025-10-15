import { codes } from "micromark-util-symbol";
import type {
  Code,
  Effects,
  State,
  TokenizeContext,
} from "micromark-util-types";

export function templateVariable() {
  const variableConstruct = {
    name: "templateVariable",
    tokenize: tokenizeTemplateVariable,
  };

  return {
    text: { [codes.leftCurlyBrace]: variableConstruct },
  };

  function tokenizeTemplateVariable(
    this: TokenizeContext,
    effects: Effects,
    ok: State,
    nok: State,
  ): State {
    const closeConstruct = { tokenize: tokenizeClose, partial: true };
    let chunkActive = false;

    return start;

    function start(code: Code): State | undefined {
      if (code !== codes.leftCurlyBrace) {
        return nok(code);
      }

      effects.enter("templateVariable");
      effects.enter("templateVariableMarker");
      effects.consume(code);
      return open;
    }

    function open(code: Code): State | undefined {
      if (code !== codes.leftCurlyBrace) {
        effects.exit("templateVariableMarker");
        effects.exit("templateVariable");
        return nok(code);
      }

      effects.consume(code);
      effects.exit("templateVariableMarker");
      effects.enter("templateVariableString");
      return begin;
    }

    function begin(code: Code): State | undefined {
      return inside(code);
    }

    function enterChunk() {
      if (!chunkActive) {
        chunkActive = true;
        effects.enter("chunkString", { contentType: "string" });
      }
    }

    function inside(code: Code): State | undefined {
      if (
        code === codes.eof ||
        code === codes.carriageReturn ||
        code === codes.lineFeed ||
        code === codes.carriageReturnLineFeed
      ) {
        return bail(code);
      }

      if (code === codes.backslash) {
        enterChunk();
        effects.consume(code);
        return insideEscape;
      }

      if (code === codes.leftCurlyBrace) {
        enterChunk();
        effects.consume(code);
        return insideAfterLeftBrace;
      }

      if (code === codes.rightCurlyBrace) {
        const attemptClose = effects.attempt(closeConstruct, closeOk, closeNok);

        if (chunkActive) {
          chunkActive = false;
          effects.exit("chunkString");
        }

        return attemptClose(code);
      }

      enterChunk();
      effects.consume(code);
      return inside;
    }

    function insideAfterLeftBrace(code: Code): State | undefined {
      if (code === codes.leftCurlyBrace) {
        return bail(code);
      }

      return inside(code);
    }

    function insideEscape(code: Code): State | undefined {
      if (
        code === codes.backslash ||
        code === codes.leftCurlyBrace ||
        code === codes.rightCurlyBrace
      ) {
        enterChunk();
        effects.consume(code);
        return inside;
      }

      return inside(code);
    }

    function closeOk(code: Code): State | undefined {
      chunkActive = false;
      effects.exit("templateVariableString");
      effects.exit("templateVariable");
      return ok(code);
    }

    function closeNok(code: Code): State | undefined {
      chunkActive = true;
      effects.enter("chunkString", { contentType: "string" });
      effects.consume(code);
      return inside;
    }

    function bail(code: Code): State | undefined {
      if (chunkActive) {
        chunkActive = false;
        effects.exit("chunkString");
      }
      effects.exit("templateVariableString");
      effects.exit("templateVariable");
      return nok(code);
    }

    function tokenizeClose(
      this: TokenizeContext,
      effects: Effects,
      ok: State,
      nok: State,
    ): State {
      return closeStart;

      function closeStart(code: Code): State | undefined {
        if (code !== codes.rightCurlyBrace) {
          return nok(code);
        }

        effects.enter("templateVariableMarker");
        effects.consume(code);
        return closeSecond;
      }

      function closeSecond(code: Code): State | undefined {
        if (code !== codes.rightCurlyBrace) {
          return nok(code);
        }

        effects.consume(code);
        effects.exit("templateVariableMarker");
        return ok;
      }
    }
  }
}
