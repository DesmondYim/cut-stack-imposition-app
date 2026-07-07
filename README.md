Cut-Stack Imposer for Printing

A browser-based tool to automatically rearrange PDF pages into 2-up booklets ($5.5 \times 8.5''$) printed on standard letter paper ($11 \times 8.5''$).

This utility solves the headache of manual booklet layout. Once printed double-sided, you simply cut the entire stack of paper in half once, stack the left pile directly on top of the right pile, and you have perfectly ordered, ready-to-bind booklets without any manual page shuffling.

Imposition Modes

This tool supports four layout configurations depending on your printer setup or print-shop requirements:

1. Xerox / Office Pro (Long-Edge Duplex)

Optimized for office copiers with automatic duplexing. It assumes a standard vertical axis book-style flip:

Front-Left: Page $2i - 1$

Front-Right: Page $(2i - 1) + 2S$

Back-Left: Page $2i$

Back-Right: Page $2i + 2S$
(Where $i$ is the physical sheet index, and $S$ is the total sheets required.)

2. HP / Home Manual (Short-Edge Duplex / Flip-Up)

Specifically designed for home printers that require manual paper reinsertion. This accounts for the physical vertical flip (Short-Edge Binding) where the layout coordinate space is mirrored:

Front-Left: Page $2i - 1$

Front-Right: Page $(2i - 1) + 2S$

Back-Left: Page $2i + 2S$

Back-Right: Page $2i$

3. Sequential 2-Up (SubPrint Style)

Perfect for professional print-shops (like the University of Alberta's SubPrint). It places two copies of the same book side-by-side. Slicing the stack down the center yields two complete booklets in exact numerical order:

Front-Left: Page $n$ | Front-Right: Page $n$

Back-Left: Page $n+1$ | Back-Right: Page $n+1$

4. Duplicate (Cover Mode)

Prints a single page side-by-side (2-on-1). Best for running heavy cardstock covers to minimize paper waste.

How the Math Works

Let the total pages of the source PDF be $c$. The engine normalizes this page count to a total capacity $C$, which must be a multiple of 4 to support a double-sided 2-up layout:

$$C = 4 \cdot \left\lceil \frac{c}{4} \right\rceil$$

The total number of physical landscape sheets required is:

$$S = \frac{C}{4}$$

For any page indexes exceeding $c$, the mapping automatically injects blank pages. This guarantees that your booklet ends cleanly without clipping or misaligning the duplex coordinates.

Implementation Details

100% Client-Side: No files are uploaded to an external server. All parsing, coordinate mapping, and file compilation are done locally in the browser using pdf-lib.

Visual Preview Matrix: Includes a responsive CSS grid that mimics the physical sheets, allowing you to double-check the layout of every single page before printing.

Local Development

To run this project locally:

Clone the repository:

git clone https://github.com/YOUR_USERNAME/imposer.git


Install dependencies:

npm install


Start the Vite development server:

npm run dev

