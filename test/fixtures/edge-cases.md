# Edge Cases

## Single Opening Brace

A single { should not start a variable.

## Mismatched Braces

{{hello} should not parse.

{hello}} should not parse.

## Multiple Adjacent Opening Braces

{{{{hello}} has four opening braces.

## Multiple Adjacent Closing Braces

{{hello}}}} has four closing braces.

## Variables in Links

[{{link_text}}]({{url}})

[text]({{url}})

## Variables in Headings

# {{title}}

## {{subtitle}}

### {{heading3}}

## Variables in Lists

- {{item1}}
- {{item2}}
- Normal item with {{var}}

## Variables in Blockquotes

> {{quote}}
>
> Multiple lines with {{var}}

## Only a Variable

{{standalone}}
