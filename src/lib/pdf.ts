import { jsPDF } from "jspdf";
import type { MosaicResult } from "./mosaic";
import { BASEPLATE } from "./mosaic";
import { readableOn, type LegoColor } from "./palette";
import { codeMap, type Bom } from "./bom";
import { renderMosaicCanvas } from "./exports";

const SECTION = 24; // studs per guide page section (a baseplate = 2x2 sections)
const MARGIN = 12;

function sectionLabel(sx: number, sy: number): string {
  return `${String.fromCharCode(65 + sy)}${sx + 1}`;
}

export function buildGuidePdf(
  result: MosaicResult,
  palette: LegoColor[],
  bom: Bom,
  filename = "brickwave-build-guide.pdf",
) {
  const doc = new jsPDF({ unit: "mm", format: "a4", orientation: "portrait" });
  const pageW = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();

  const codes = codeMap(bom);
  const codeByIdx = palette.map((c) => codes.get(c.id) ?? 0);
  const { width, height, indices } = result;

  // ---- Cover / summary ----
  doc.setFillColor(22, 19, 17);
  doc.rect(0, 0, pageW, 46, "F");
  doc.setTextColor(255, 205, 0);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(30);
  doc.text("BRICKWAVE", MARGIN, 26);
  doc.setTextColor(246, 238, 220);
  doc.setFontSize(13);
  doc.text("Build guide", MARGIN, 37);

  doc.setTextColor(20, 17, 15);
  doc.setFontSize(12);
  let y = 62;
  const line = (label: string, val: string) => {
    doc.setFont("helvetica", "bold");
    doc.text(label, MARGIN, y);
    doc.setFont("helvetica", "normal");
    doc.text(val, MARGIN + 55, y);
    y += 9;
  };
  line("Grid", `${width} x ${height} studs`);
  line("Total pieces", `${bom.totalPieces.toLocaleString()} round tiles (98138)`);
  line("Colors", `${bom.colorsUsed}`);
  line("Baseplates", `${bom.baseplates.total}  (${bom.baseplates.cols} x ${bom.baseplates.rows} of 48x48)`);
  line(
    "Finished size",
    `${bom.size.wCm.toFixed(1)} x ${bom.size.hCm.toFixed(1)} cm  (${bom.size.wIn.toFixed(1)} x ${bom.size.hIn.toFixed(1)} in)`,
  );
  line("Approx cost", `$${bom.approxCost.toFixed(2)} USD`);

  y += 4;
  doc.setFont("helvetica", "italic");
  doc.setFontSize(10.5);
  doc.setTextColor(80, 70, 60);
  doc.text(
    [
      "How to build: each following page is a 24x24 stud section, labeled like A1.",
      "Match every numbered cell to its color in the key. Work left-to-right, top-to-bottom.",
      "Heavier lines mark the seams between 48x48 baseplates.",
    ],
    MARGIN,
    y,
    { maxWidth: pageW - 2 * MARGIN, lineHeightFactor: 1.5 },
  );

  // ---- Section map (thumbnail with grid) ----
  doc.addPage();
  pageHeader(doc, "Section map", pageW);
  const thumb = renderMosaicCanvas(result, palette, 10);
  const availW = pageW - 2 * MARGIN;
  const availH = pageH - 34 - MARGIN;
  const ratio = thumb.width / thumb.height;
  let imgW = availW;
  let imgH = imgW / ratio;
  if (imgH > availH) {
    imgH = availH;
    imgW = imgH * ratio;
  }
  const imgX = (pageW - imgW) / 2;
  const imgY = 34;
  doc.addImage(thumb.toDataURL("image/png"), "PNG", imgX, imgY, imgW, imgH);

  const sectionsX = Math.ceil(width / SECTION);
  const sectionsY = Math.ceil(height / SECTION);
  const pxPerStudX = imgW / width;
  const pxPerStudY = imgH / height;

  // section grid + labels
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  for (let sy = 0; sy < sectionsY; sy++) {
    for (let sx = 0; sx < sectionsX; sx++) {
      const x = imgX + sx * SECTION * pxPerStudX;
      const yy = imgY + sy * SECTION * pxPerStudY;
      const w = Math.min(SECTION, width - sx * SECTION) * pxPerStudX;
      const h = Math.min(SECTION, height - sy * SECTION) * pxPerStudY;
      doc.setDrawColor(255, 255, 255);
      doc.setLineWidth(0.2);
      doc.rect(x, yy, w, h, "S");
      doc.setFillColor(0, 0, 0);
      doc.rect(x + 0.5, yy + 0.5, 7, 4.5, "F");
      doc.text(sectionLabel(sx, sy), x + 1, yy + 3.6);
    }
  }
  // baseplate seams (every 48)
  doc.setDrawColor(255, 205, 0);
  doc.setLineWidth(0.7);
  for (let bx = BASEPLATE; bx < width; bx += BASEPLATE) {
    const x = imgX + bx * pxPerStudX;
    doc.line(x, imgY, x, imgY + imgH);
  }
  for (let by = BASEPLATE; by < height; by += BASEPLATE) {
    const yy = imgY + by * pxPerStudY;
    doc.line(imgX, yy, imgX + imgW, yy);
  }

  // ---- Color key ----
  doc.addPage();
  pageHeader(doc, "Color key — your shopping list", pageW);
  const colW = (pageW - 2 * MARGIN) / 2;
  const rowH = 8.5;
  let kx = MARGIN;
  let ky = 36;
  doc.setFontSize(10);
  for (const e of bom.entries) {
    if (ky > pageH - MARGIN) {
      kx += colW;
      ky = 36;
      if (kx > pageW - MARGIN - 10) {
        doc.addPage();
        pageHeader(doc, "Color key (cont.)", pageW);
        kx = MARGIN;
        ky = 36;
      }
    }
    const [r, g, b] = e.color.rgb;
    doc.setFillColor(r, g, b);
    doc.setDrawColor(40, 40, 40);
    doc.setLineWidth(0.2);
    doc.rect(kx, ky - 4, 7, 7, "FD");
    // code badge
    doc.setTextColor(20, 17, 15);
    doc.setFont("helvetica", "bold");
    doc.text(String(e.code).padStart(2, "0"), kx + 10, ky + 1);
    doc.setFont("helvetica", "normal");
    doc.text(
      `${e.color.name}  ·  ${e.count.toLocaleString()}`,
      kx + 20,
      ky + 1,
    );
    ky += rowH;
  }

  // ---- Section pages ----
  for (let sy = 0; sy < sectionsY; sy++) {
    for (let sx = 0; sx < sectionsX; sx++) {
      const x0 = sx * SECTION;
      const y0 = sy * SECTION;
      const sw = Math.min(SECTION, width - x0);
      const sh = Math.min(SECTION, height - y0);
      doc.addPage();
      drawSectionPage(
        doc,
        { x0, y0, sw, sh, label: sectionLabel(sx, sy) },
        { width, height, indices, codeByIdx, palette },
        pageW,
        pageH,
      );
    }
  }

  // footer page numbers
  const total = doc.getNumberOfPages();
  for (let i = 1; i <= total; i++) {
    doc.setPage(i);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(150, 140, 130);
    doc.text(`BRICKWAVE  ·  page ${i} / ${total}`, pageW - MARGIN, pageH - 5, {
      align: "right",
    });
  }

  doc.save(filename);
}

function pageHeader(doc: jsPDF, title: string, pageW: number) {
  doc.setTextColor(20, 17, 15);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(16);
  doc.text(title, MARGIN, 22);
  doc.setDrawColor(255, 205, 0);
  doc.setLineWidth(1);
  doc.line(MARGIN, 26, pageW - MARGIN, 26);
}

interface SectionRect {
  x0: number;
  y0: number;
  sw: number;
  sh: number;
  label: string;
}
interface GridData {
  width: number;
  height: number;
  indices: Uint16Array;
  codeByIdx: number[];
  palette: LegoColor[];
}

function drawSectionPage(
  doc: jsPDF,
  sec: SectionRect,
  data: GridData,
  pageW: number,
  pageH: number,
) {
  const { x0, y0, sw, sh, label } = sec;
  const { width, indices, codeByIdx, palette } = data;

  doc.setTextColor(20, 17, 15);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(16);
  doc.text(`Section ${label}`, MARGIN, 20);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor(90, 80, 70);
  doc.text(
    `cols ${x0 + 1}-${x0 + sw}, rows ${y0 + 1}-${y0 + sh}`,
    MARGIN,
    27,
  );

  const top = 34;
  const availW = pageW - 2 * MARGIN;
  const availH = pageH - top - MARGIN;
  const cell = Math.min(availW / (sw + 1), availH / (sh + 1));
  const gx = MARGIN + cell; // grid origin x (after row-number gutter)
  const gy = top + cell; // grid origin y (after col-number gutter)

  const codeFs = Math.max(5, Math.min(12, cell * 1.7));
  const numFs = Math.max(4, Math.min(9, cell * 1.1));

  // column + row numbers
  doc.setTextColor(60, 50, 45);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(numFs);
  for (let cx = 0; cx < sw; cx++) {
    doc.text(String(x0 + cx + 1), gx + cx * cell + cell / 2, gy - 1.5, {
      align: "center",
    });
  }
  for (let cy = 0; cy < sh; cy++) {
    doc.text(String(y0 + cy + 1), gx - 1.5, gy + cy * cell + cell / 2 + 1, {
      align: "right",
    });
  }

  // cells
  doc.setFontSize(codeFs);
  for (let cy = 0; cy < sh; cy++) {
    for (let cx = 0; cx < sw; cx++) {
      const gi = (y0 + cy) * width + (x0 + cx);
      const pi = indices[gi];
      const color = palette[pi];
      const [r, g, b] = color.rgb;
      const px = gx + cx * cell;
      const py = gy + cy * cell;
      doc.setFillColor(r, g, b);
      doc.setDrawColor(120, 120, 120);
      doc.setLineWidth(0.1);
      doc.rect(px, py, cell, cell, "FD");
      const txt = readableOn(color.rgb) === "#000" ? 20 : 245;
      doc.setTextColor(txt, txt, txt);
      doc.setFont("helvetica", "bold");
      doc.text(String(codeByIdx[pi]), px + cell / 2, py + cell / 2, {
        align: "center",
        baseline: "middle",
      });
    }
  }

  // heavier baseplate seams inside section
  doc.setDrawColor(20, 17, 15);
  doc.setLineWidth(0.7);
  for (let cx = 0; cx <= sw; cx++) {
    if ((x0 + cx) % BASEPLATE === 0) {
      const px = gx + cx * cell;
      doc.line(px, gy, px, gy + sh * cell);
    }
  }
  for (let cy = 0; cy <= sh; cy++) {
    if ((y0 + cy) % BASEPLATE === 0) {
      const py = gy + cy * cell;
      doc.line(gx, py, gx + sw * cell, py);
    }
  }
  // outer border
  doc.setLineWidth(0.5);
  doc.rect(gx, gy, sw * cell, sh * cell, "S");
}
