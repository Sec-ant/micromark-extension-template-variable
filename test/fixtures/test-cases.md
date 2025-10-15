# Template Variable Test Cases

## Basic

Hello, {{planet}}!

## Multiple Variables

{{greeting}} {{name}}, welcome to {{place}}!

## Variables with Spaces

{{ var_with_spaces }}

## Variables with Special Characters

{{user.name}} and {{user_id}} and {{item-count}}

## Escaping

{{pla\}net}} and {{pla\{net}} and {{pla\\net}}

## Adjacent Variables

{{a}}{{b}}{{c}}

## Variables in Emphasis

_{{emphasized}}_ and **{{strong}}**

## Variables at Boundaries

{{start}} middle {{end}}

## Empty

{{}} should be a variable

## Incomplete (Should Not Parse)

{{incomplete

## Nested Braces

{{outer{{inner}}outer}}

## Triple Braces

{{{triple}}}

## With Character References

{{pla&#x7d;net}} and {{pla&rbrace;net}}
