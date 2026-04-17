from __future__ import annotations

import tempfile
import os

import pypdfium2 as pdfium

#표를 마크다운 형식으로 바꾸는걸 만들었는데 쓰진못했음 ㅜ
def _table_to_markdown(table: list[list[str | None]]) -> str:
    if not table:
        return ""
    rows = [[cell.strip() if cell else "" for cell in row] for row in table]
    col_count = max(len(row) for row in rows)
    rows = [row + [""] * (col_count - len(row)) for row in rows]
    header = rows[0]
    body = rows[1:]
    lines = []
    lines.append("| " + " | ".join(header) + " |")
    lines.append("|" + "|".join(["---"] * col_count) + "|")
    for row in body:
        lines.append("| " + " | ".join(row) + " |")
    return "\n".join(lines)


def extract_text(file_bytes: bytes) -> str:
    text_parts: list[str] = []

    with tempfile.NamedTemporaryFile(suffix=".pdf", delete=False) as tmp:
        tmp.write(file_bytes)
        tmp_path = tmp.name

    try:
        pdf = pdfium.PdfDocument(tmp_path)
        for page in pdf:
            textpage = page.get_textpage()
            text = textpage.get_text_range().strip()
            if text:
                text_parts.append(text)
        pdf.close()
    finally:
        try:
            os.unlink(tmp_path)
        except OSError:
            pass

    return "\n\n".join(text_parts)
