function toAscii(value: string): string {
    return value
        .normalize("NFKD")
        .replace(/[^\x20-\x7E\n]/g, "")
        .replace(/\r/g, "");
}

function wrapLine(value: string, width: number): string[] {
    if (!value.trim()) {
        return [""];
    }

    const words = value.split(/\s+/);
    const lines: string[] = [];
    let line = "";

    for (const word of words) {
        const candidate = line ? `${line} ${word}` : word;
        if (candidate.length <= width) {
            line = candidate;
            continue;
        }

        if (line) {
            lines.push(line);
        }
        line = word;
    }

    if (line) {
        lines.push(line);
    }
    return lines;
}

function escapePdfText(value: string): string {
    return value.replace(/\\/g, "\\\\").replace(/\(/g, "\\(").replace(/\)/g, "\\)");
}

export function downloadTextPdf(filename: string, title: string, sections: Array<{ heading: string; body: string }>) {
    const sourceLines = [
        title,
        "",
        ...sections.flatMap((section) => [
            section.heading,
            "",
            section.body,
            "",
        ]),
    ];

    const lines = sourceLines.flatMap((line) => wrapLine(toAscii(line), 92));
    const pages: string[][] = [];
    for (let index = 0; index < lines.length; index += 48) {
        pages.push(lines.slice(index, index + 48));
    }

    const pageCount = Math.max(pages.length, 1);
    const fontId = 3;
    const objects: string[] = [];
    const pageIds = Array.from({ length: pageCount }, (_, index) => 4 + index * 2);

    objects[1] = "<< /Type /Catalog /Pages 2 0 R >>";
    objects[2] = `<< /Type /Pages /Kids [${pageIds.map((id) => `${id} 0 R`).join(" ")}] /Count ${pageCount} >>`;
    objects[fontId] = "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>";

    for (let index = 0; index < pageCount; index += 1) {
        const pageId = pageIds[index];
        const contentId = pageId + 1;
        const pageLines = pages[index] ?? [""];
        const content = [
            "BT",
            "/F1 10 Tf",
            "50 790 Td",
            "14 TL",
            ...pageLines.map((line) => `(${escapePdfText(line)}) Tj T*`),
            "ET",
        ].join("\n");

        objects[pageId] = `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 842] /Resources << /Font << /F1 ${fontId} 0 R >> >> /Contents ${contentId} 0 R >>`;
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

    const blob = new Blob([pdf], { type: "application/pdf" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename.replace(/[^a-z0-9._-]+/gi, "-").toLowerCase();
    link.click();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}
