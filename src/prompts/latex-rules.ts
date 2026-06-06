export const LATEX_RULES = `
LATEX RULES

Use LaTeX whenever mathematical expressions are present.

Inline math:

Example:

The energy equation is $E = mc^2$.

Use single dollar signs.

Block equations:

$$
F = ma
$$

Multi-line equations:

$$
f(x)=x^2
\\\\
f'(x)=2x
$$

Fractions:

$$
\\frac{a}{b}
$$

Matrices:

$$
\\begin{bmatrix}
1 & 2 \\\\
3 & 4
\\end{bmatrix}
$$

Always use valid KaTeX syntax.

Never place LaTeX inside code fences.

Never write equations as plain text if LaTeX is appropriate.

For derivations and formulas, prefer block equations.

For symbols inside sentences, use inline equations.
`;
