type Rgb = [number, number, number];

const PAGE_WIDTH = 595;
const PAGE_HEIGHT = 842;

function escapePdfText(value: string) {
  return value.replace(/\\/g, "\\\\").replace(/\(/g, "\\(").replace(/\)/g, "\\)");
}

function toPdfY(topY: number) {
  return PAGE_HEIGHT - topY;
}

class PdfBuilder {
  private pages: string[] = [];
  private ops: string[] = [];

  addPage() {
    if (this.ops.length > 0) {
      this.pages.push(this.ops.join("\n"));
    }
    this.ops = [];
  }

  rect(x: number, y: number, width: number, height: number, color: Rgb) {
    const pdfY = toPdfY(y + height);
    this.ops.push(`${color[0]} ${color[1]} ${color[2]} rg`);
    this.ops.push(`${x} ${pdfY} ${width} ${height} re f`);
  }

  strokeLine(x1: number, y1: number, x2: number, y2: number, color: Rgb, width = 1) {
    this.ops.push(`${width} w`);
    this.ops.push(`${color[0]} ${color[1]} ${color[2]} RG`);
    this.ops.push(`${x1} ${toPdfY(y1)} m ${x2} ${toPdfY(y2)} l S`);
  }

  text(
    value: string,
    x: number,
    y: number,
    size = 11,
    color: Rgb = [0.16, 0.2, 0.27],
    font = "F1"
  ) {
    this.ops.push("BT");
    this.ops.push(`/${font} ${size} Tf`);
    this.ops.push(`${color[0]} ${color[1]} ${color[2]} rg`);
    this.ops.push(`${x} ${toPdfY(y)} Td`);
    this.ops.push(`(${escapePdfText(value)}) Tj`);
    this.ops.push("ET");
  }

  finalize() {
    if (this.ops.length > 0) {
      this.pages.push(this.ops.join("\n"));
      this.ops = [];
    }

    const objects: string[] = [];
    objects.push("<< /Type /Catalog /Pages 2 0 R >>");

    const pageObjectIds: number[] = [];
    const contentObjectIds: number[] = [];

    for (let index = 0; index < this.pages.length; index += 1) {
      pageObjectIds.push(4 + index * 2);
      contentObjectIds.push(5 + index * 2);
    }

    objects.push(`<< /Type /Pages /Count ${this.pages.length} /Kids [${pageObjectIds.map((id) => `${id} 0 R`).join(" ")}] >>`);
    objects.push("<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>");

    this.pages.forEach((page, index) => {
      const pageObjectId = pageObjectIds[index];
      const contentObjectId = contentObjectIds[index];
      objects[pageObjectId - 1] = `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${PAGE_WIDTH} ${PAGE_HEIGHT}] /Resources << /Font << /F1 3 0 R >> >> /Contents ${contentObjectId} 0 R >>`;
      objects[contentObjectId - 1] = `<< /Length ${page.length} >>\nstream\n${page}\nendstream`;
    });

    const chunks: string[] = ["%PDF-1.4\n"];
    const offsets: number[] = [0];

    objects.forEach((object, index) => {
      offsets[index + 1] = chunks.join("").length;
      chunks.push(`${index + 1} 0 obj\n${object}\nendobj\n`);
    });

    const xrefOffset = chunks.join("").length;
    chunks.push(`xref\n0 ${objects.length + 1}\n`);
    chunks.push("0000000000 65535 f \n");
    offsets.slice(1).forEach((offset) => {
      chunks.push(`${offset.toString().padStart(10, "0")} 00000 n \n`);
    });
    chunks.push(`trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF`);

    return new TextEncoder().encode(chunks.join(""));
  }
}

type ReportRow = {
  date: string;
  label: string;
  hours?: string;
  note?: string;
  tone?: Rgb;
};

export function createTabularPdf(input: {
  title: string;
  subtitle: string;
  info: string[];
  rows: ReportRow[];
}) {
  const pdf = new PdfBuilder();
  pdf.addPage();

  let y = 48;
  const rowHeight = 22;
  const headerTone: Rgb = [0.1, 0.18, 0.31];
  const lineTone: Rgb = [0.86, 0.89, 0.93];

  pdf.rect(40, 32, 515, 64, headerTone);
  pdf.text(input.title, 56, 62, 22, [1, 1, 1]);
  pdf.text(input.subtitle, 56, 82, 11, [0.85, 0.9, 0.98]);

  y = 128;
  input.info.forEach((line) => {
    pdf.text(line, 48, y, 11);
    y += 16;
  });

  y += 14;
  pdf.rect(40, y - 12, 515, 24, [0.94, 0.96, 0.98]);
  pdf.text("Datum", 50, y + 3, 10);
  pdf.text("Status", 150, y + 3, 10);
  pdf.text("Stunden", 335, y + 3, 10);
  pdf.text("Hinweis", 420, y + 3, 10);
  y += 24;

  input.rows.forEach((row) => {
    if (y > 760) {
      pdf.addPage();
      y = 50;
    }

    pdf.strokeLine(40, y + rowHeight, 555, y + rowHeight, lineTone);
    if (row.tone) {
      pdf.rect(44, y - 2, 8, rowHeight - 6, row.tone);
    }
    pdf.text(row.date, 58, y + 12, 10);
    pdf.text(row.label, 150, y + 12, 10);
    pdf.text(row.hours ?? "—", 335, y + 12, 10);
    pdf.text(row.note ?? "—", 420, y + 12, 10);
    y += rowHeight;
  });

  return pdf.finalize();
}
