type PdfSection = {
    heading: string;
    body: string;
};

type PdfFont = "regular" | "bold";

type PdfColor = {
    r: number;
    g: number;
    b: number;
};

type PdfTextLine = {
    type: "text";
    text: string;
    x: number;
    y: number;
    size: number;
    font: PdfFont;
    color: PdfColor;
};

type PdfRule = {
    type: "rule";
    y: number;
};

type PdfElement = PdfTextLine | PdfRule;

const PAGE_WIDTH = 595;
const PAGE_HEIGHT = 842;
const MARGIN_X = 54;
const TOP_Y = 780;
const BOTTOM_Y = 58;
const CONTENT_WIDTH = PAGE_WIDTH - MARGIN_X * 2;
const MIN_SECTION_START_HEIGHT = 220;

const FONT_IDS: Record<PdfFont, number> = {
    regular: 3,
    bold: 4,
};

const FONT_NAMES: Record<PdfFont, string> = {
    regular: "F1",
    bold: "F2",
};

const COLORS = {
    text: { r: 0.12, g: 0.14, b: 0.18 },
    muted: { r: 0.42, g: 0.46, b: 0.54 },
    rule: { r: 0.78, g: 0.81, b: 0.86 },
};

function toAscii(value: string): string {
    return value
        .replace(/\u00a0/g, " ")
        .replace(/[\u2018\u2019\u201A\u201B]/g, "'")
        .replace(/[\u201C\u201D\u201E\u201F]/g, "\"")
        .replace(/[\u2013\u2014\u2212]/g, "-")
        .replace(/\u2022/g, "-")
        .replace(/\u2026/g, "...")
        .replace(/\u2192/g, "->")
        .normalize("NFKD")
        .replace(/[^\x20-\x7E\n]/g, "")
        .replace(/\r/g, "");
}

function cleanInlineMarkdown(value: string): string {
    return toAscii(value)
        .replace(/\[([^\]]+)\]\(([^)]+)\)/g, "$1 ($2)")
        .replace(/\*\*/g, "")
        .replace(/__/g, "")
        .replace(/`([^`]+)`/g, "$1")
        .replace(/\s+/g, " ")
        .trim();
}

function escapePdfText(value: string): string {
    return value.replace(/\\/g, "\\\\").replace(/\(/g, "\\(").replace(/\)/g, "\\)");
}

function formatNumber(value: number): string {
    return Number(value.toFixed(2)).toString();
}

function formatColor(color: PdfColor): string {
    return `${formatNumber(color.r)} ${formatNumber(color.g)} ${formatNumber(color.b)}`;
}

function estimateTextWidth(value: string, size: number, font: PdfFont): number {
    let width = 0;

    for (const char of value) {
        if (char === " ") {
            width += 0.28;
        } else if (/[ilI.,'!:;]/.test(char)) {
            width += 0.28;
        } else if (/[mwMW@#%&]/.test(char)) {
            width += 0.78;
        } else if (/[A-Z]/.test(char)) {
            width += 0.62;
        } else if (/[0-9]/.test(char)) {
            width += 0.54;
        } else {
            width += 0.5;
        }
    }

    return width * size * (font === "bold" ? 1.05 : 1);
}

function splitLongWord(word: string, maxWidth: number, size: number, font: PdfFont): string[] {
    const parts: string[] = [];
    let current = "";

    for (const char of word) {
        const candidate = `${current}${char}`;
        if (!current || estimateTextWidth(candidate, size, font) <= maxWidth) {
            current = candidate;
            continue;
        }

        parts.push(current);
        current = char;
    }

    if (current) {
        parts.push(current);
    }

    return parts;
}

function wrapText(value: string, maxWidth: number, size: number, font: PdfFont): string[] {
    const text = cleanInlineMarkdown(value);
    if (!text) {
        return [];
    }

    const lines: string[] = [];
    let line = "";

    for (const word of text.split(/\s+/)) {
        const candidate = line ? `${line} ${word}` : word;

        if (estimateTextWidth(candidate, size, font) <= maxWidth) {
            line = candidate;
            continue;
        }

        if (line) {
            lines.push(line);
            line = "";
        }

        if (estimateTextWidth(word, size, font) <= maxWidth) {
            line = word;
            continue;
        }

        const pieces = splitLongWord(word, maxWidth, size, font);
        lines.push(...pieces.slice(0, -1));
        line = pieces[pieces.length - 1] ?? "";
    }

    if (line) {
        lines.push(line);
    }

    return lines;
}

function buildPages(title: string, sections: PdfSection[]): PdfElement[][] {
    const pages: PdfElement[][] = [[]];
    let y = TOP_Y;

    const currentPage = () => pages[pages.length - 1];

    const startPage = () => {
        pages.push([]);
        y = TOP_Y;
    };

    const ensureSpace = (height: number) => {
        if (y - height < BOTTOM_Y) {
            startPage();
        }
    };

    const addGap = (height: number) => {
        if (y - height < BOTTOM_Y) {
            startPage();
            return;
        }
        y -= height;
    };

    const addTextLine = (text: string, x: number, size: number, font: PdfFont, color: PdfColor, lineHeight: number) => {
        ensureSpace(lineHeight);
        currentPage().push({
            type: "text",
            text,
            x,
            y,
            size,
            font,
            color,
        });
        y -= lineHeight;
    };

    const addWrappedText = (
        text: string,
        options: {
            x?: number;
            width?: number;
            size?: number;
            font?: PdfFont;
            color?: PdfColor;
            lineHeight?: number;
            gapAfter?: number;
        } = {}
    ) => {
        const size = options.size ?? 10.5;
        const font = options.font ?? "regular";
        const color = options.color ?? COLORS.text;
        const x = options.x ?? MARGIN_X;
        const width = options.width ?? CONTENT_WIDTH;
        const lineHeight = options.lineHeight ?? 14.5;
        const lines = wrapText(text, width, size, font);

        for (const line of lines) {
            addTextLine(line, x, size, font, color, lineHeight);
        }

        if (lines.length > 0 && options.gapAfter) {
            addGap(options.gapAfter);
        }
    };

    const addRule = () => {
        ensureSpace(10);
        currentPage().push({ type: "rule", y });
        y -= 12;
    };

    const addBullet = (text: string, level: number) => {
        const indent = Math.min(level, 3) * 18;
        const markerX = MARGIN_X + indent;
        const textX = markerX + 14;
        const width = CONTENT_WIDTH - indent - 14;
        const lines = wrapText(text, width, 10.5, "regular");
        const blockHeight = lines.length * 14.5 + 2;

        if (lines.length === 0) {
            return;
        }

        if (blockHeight < 120) {
            ensureSpace(blockHeight);
        }

        addTextLine("-", markerX, 10.5, "regular", COLORS.text, 14.5);
        const markerLine = currentPage().pop();
        y += 14.5;

        if (markerLine) {
            currentPage().push(markerLine);
        }

        lines.forEach((line) => {
            addTextLine(line, textX, 10.5, "regular", COLORS.text, 14.5);
        });
        addGap(2);
    };

    const addBody = (body: string) => {
        let previousWasBlank = false;

        for (const rawLine of toAscii(body).split("\n")) {
            const line = rawLine.replace(/\t/g, "    ");
            const trimmed = line.trim();

            if (!trimmed) {
                if (!previousWasBlank) {
                    addGap(6);
                }
                previousWasBlank = true;
                continue;
            }

            previousWasBlank = false;

            const headingMatch = trimmed.match(/^(#{1,4})\s+(.+)$/);
            if (headingMatch) {
                addGap(5);
                addWrappedText(headingMatch[2], {
                    size: headingMatch[1].length <= 2 ? 12.5 : 11.5,
                    font: "bold",
                    lineHeight: 16,
                    gapAfter: 2,
                });
                continue;
            }

            const bulletMatch = line.match(/^(\s*)(?:[-*]|\d+[.)])\s+(.+)$/);
            if (bulletMatch) {
                addBullet(bulletMatch[2], Math.floor(bulletMatch[1].length / 2));
                continue;
            }

            addWrappedText(trimmed, { gapAfter: 4 });
        }
    };

    addWrappedText(title || "NovaFlow idea", {
        size: 22,
        font: "bold",
        lineHeight: 27,
        gapAfter: 2,
    });
    addWrappedText("NovaFlow idea plan", {
        size: 9,
        color: COLORS.muted,
        lineHeight: 12,
        gapAfter: 8,
    });
    addRule();
    addGap(8);

    sections
        .filter((section) => section.heading.trim() || section.body.trim())
        .forEach((section, index) => {
            if (index > 0) {
                addGap(14);
            }

            ensureSpace(index === 0 ? 42 : MIN_SECTION_START_HEIGHT);
            addWrappedText(section.heading, {
                size: 14,
                font: "bold",
                lineHeight: 18,
                gapAfter: 2,
            });
            addRule();
            addGap(2);
            addBody(section.body);
        });

    return pages.filter((page) => page.length > 0);
}

function renderTextLine(line: PdfTextLine): string {
    return [
        "BT",
        `/${FONT_NAMES[line.font]} ${formatNumber(line.size)} Tf`,
        `${formatColor(line.color)} rg`,
        `1 0 0 1 ${formatNumber(line.x)} ${formatNumber(line.y)} Tm`,
        `(${escapePdfText(line.text)}) Tj`,
        "ET",
    ].join("\n");
}

function renderRule(rule: PdfRule): string {
    return [
        `${formatColor(COLORS.rule)} RG`,
        "0.6 w",
        `${formatNumber(MARGIN_X)} ${formatNumber(rule.y)} m`,
        `${formatNumber(PAGE_WIDTH - MARGIN_X)} ${formatNumber(rule.y)} l`,
        "S",
    ].join("\n");
}

function renderFooter(pageIndex: number, pageCount: number): string {
    const footerLeft = "Generated by NovaFlow";
    const footerRight = `Page ${pageIndex + 1} of ${pageCount}`;
    const rightWidth = estimateTextWidth(footerRight, 8, "regular");

    return [
        renderTextLine({
            type: "text",
            text: footerLeft,
            x: MARGIN_X,
            y: 32,
            size: 8,
            font: "regular",
            color: COLORS.muted,
        }),
        renderTextLine({
            type: "text",
            text: footerRight,
            x: PAGE_WIDTH - MARGIN_X - rightWidth,
            y: 32,
            size: 8,
            font: "regular",
            color: COLORS.muted,
        }),
    ].join("\n");
}

function renderPageContent(page: PdfElement[], pageIndex: number, pageCount: number): string {
    const elements = page.map((element) => (
        element.type === "text" ? renderTextLine(element) : renderRule(element)
    ));

    return [
        ...elements,
        renderFooter(pageIndex, pageCount),
    ].join("\n");
}

export function buildTextPdfDocument(title: string, sections: PdfSection[]): string {
    const pages = buildPages(cleanInlineMarkdown(title), sections);
    const pageCount = Math.max(pages.length, 1);
    const pageIds = Array.from({ length: pageCount }, (_, index) => 5 + index * 2);
    const objects: string[] = [];

    objects[1] = "<< /Type /Catalog /Pages 2 0 R >>";
    objects[2] = `<< /Type /Pages /Kids [${pageIds.map((id) => `${id} 0 R`).join(" ")}] /Count ${pageCount} >>`;
    objects[FONT_IDS.regular] = "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>";
    objects[FONT_IDS.bold] = "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>";

    for (let index = 0; index < pageCount; index += 1) {
        const pageId = pageIds[index];
        const contentId = pageId + 1;
        const content = renderPageContent(pages[index] ?? [], index, pageCount);

        objects[pageId] = `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${PAGE_WIDTH} ${PAGE_HEIGHT}] /Resources << /Font << /F1 ${FONT_IDS.regular} 0 R /F2 ${FONT_IDS.bold} 0 R >> >> /Contents ${contentId} 0 R >>`;
        objects[contentId] = `<< /Length ${content.length} >>\nstream\n${content}\nendstream`;
    }

    let pdf = "%PDF-1.4\n";
    const offsets: number[] = [0];

    for (let id = 1; id < objects.length; id += 1) {
        offsets[id] = pdf.length;
        pdf += `${id} 0 obj\n${objects[id]}\nendobj\n`;
    }

    const xrefOffset = pdf.length;
    pdf += `xref\n0 ${objects.length}\n`;
    pdf += "0000000000 65535 f \n";

    for (let id = 1; id < objects.length; id += 1) {
        pdf += `${String(offsets[id]).padStart(10, "0")} 00000 n \n`;
    }

    pdf += `trailer\n<< /Size ${objects.length} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF`;
    return pdf;
}

export function downloadTextPdf(filename: string, title: string, sections: PdfSection[]) {
    const blob = new Blob([buildTextPdfDocument(title, sections)], { type: "application/pdf" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename.replace(/[^a-z0-9._-]+/gi, "-").toLowerCase();
    link.click();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}
