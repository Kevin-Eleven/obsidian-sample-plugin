export const MERMAID_RULES = `
MERMAID SYNTAX RULES

Use:

\`\`\`mermaid
graph TD

    A[Node A]
    B[Node B]
    C[Node C]

    A --> B
    B --> C
\`\`\`

Default direction: graph TD

Use graph LR only if explicitly requested.

Node format:

A[Description]

Edge formats:

A --> B

Declare all nodes first.

Declare all edges after nodes.

Never use:

A -> B
A ==> B
A -->|Label|>
A(Input)

All Mermaid diagrams must be valid Mermaid syntax.
`;
