const pptxgen = require("pptxgenjs");

const pres = new pptxgen();
pres.layout = "LAYOUT_16x9";
pres.title = "RAG Web Demo - Project Structure";

// ─── Color Palette ───────────────────────────────────────────────
const C = {
  darkBg:   "0F1923",   // 타이틀/마무리 슬라이드 배경
  midBg:    "1A2B3C",   // 중간 슬라이드 배경
  navy:     "065A82",   // 주요 강조 (박스 헤더)
  teal:     "0D9488",   // 서비스 레이어
  mint:     "02C39A",   // 액센트 선
  sky:      "38BDF8",   // 외부 서비스
  light:    "E8F4F8",   // 박스 배경
  white:    "FFFFFF",
  gray:     "94A3B8",
  darkText: "1E293B",
};

function makeShadow() {
  return { type: "outer", color: "000000", blur: 8, offset: 3, angle: 135, opacity: 0.25 };
}

// ════════════════════════════════════════════════════════
//  SLIDE 1 – Title
// ════════════════════════════════════════════════════════
{
  const s = pres.addSlide();
  s.background = { color: C.darkBg };

  // 상단 장식 바
  s.addShape(pres.shapes.RECTANGLE, {
    x: 0, y: 0, w: 10, h: 0.08,
    fill: { color: C.mint }, line: { color: C.mint },
  });

  // 배경 원형 장식 (반투명)
  s.addShape(pres.shapes.OVAL, {
    x: 6.5, y: -1, w: 5, h: 5,
    fill: { color: C.navy, transparency: 75 },
    line: { color: C.navy, transparency: 75 },
  });
  s.addShape(pres.shapes.OVAL, {
    x: -1.5, y: 2.5, w: 4, h: 4,
    fill: { color: C.teal, transparency: 80 },
    line: { color: C.teal, transparency: 80 },
  });

  // 태그
  s.addShape(pres.shapes.RECTANGLE, {
    x: 0.7, y: 1.5, w: 1.6, h: 0.35,
    fill: { color: C.teal },
    line: { color: C.teal },
  });
  s.addText("FastAPI  ·  React", {
    x: 0.7, y: 1.5, w: 1.6, h: 0.35,
    fontSize: 9, color: C.white, bold: true, align: "center", valign: "middle", margin: 0,
  });

  // 메인 타이틀
  s.addText("RAG Web Demo", {
    x: 0.7, y: 1.95, w: 8.5, h: 1.1,
    fontSize: 52, fontFace: "Calibri", color: C.white, bold: true, align: "left",
  });

  // 서브 타이틀
  s.addText("프로젝트 구조 한눈에 보기", {
    x: 0.7, y: 3.05, w: 8, h: 0.6,
    fontSize: 20, color: C.mint, align: "left",
  });

  // 설명
  s.addText("FastAPI Backend  ·  React Frontend  ·  Qdrant VectorDB  ·  Claude API", {
    x: 0.7, y: 3.75, w: 8.5, h: 0.4,
    fontSize: 12, color: C.gray, align: "left",
  });

  // 하단 선
  s.addShape(pres.shapes.RECTANGLE, {
    x: 0, y: 5.53, w: 10, h: 0.095,
    fill: { color: C.navy }, line: { color: C.navy },
  });
}

// ════════════════════════════════════════════════════════
//  SLIDE 2 – 전체 아키텍처 (3-box)
// ════════════════════════════════════════════════════════
{
  const s = pres.addSlide();
  s.background = { color: C.midBg };

  // 상단 바
  s.addShape(pres.shapes.RECTANGLE, {
    x: 0, y: 0, w: 10, h: 0.08, fill: { color: C.mint }, line: { color: C.mint },
  });

  // 슬라이드 제목
  s.addText("전체 아키텍처 개요", {
    x: 0.5, y: 0.18, w: 9, h: 0.55,
    fontSize: 26, fontFace: "Calibri", color: C.white, bold: true,
  });
  s.addText("Frontend  →  Backend  →  External Services", {
    x: 0.5, y: 0.7, w: 9, h: 0.3,
    fontSize: 11, color: C.gray,
  });

  // ── Helper: 박스 그리기 ──────────────────────────
  function drawBox(s, x, y, w, h, headerColor, headerLabel, lines) {
    // 카드 몸통
    s.addShape(pres.shapes.RECTANGLE, {
      x, y, w, h,
      fill: { color: "1E3348" },
      line: { color: headerColor, width: 1.5 },
      shadow: makeShadow(),
    });
    // 헤더 바
    s.addShape(pres.shapes.RECTANGLE, {
      x, y, w, h: 0.38,
      fill: { color: headerColor },
      line: { color: headerColor },
    });
    s.addText(headerLabel, {
      x, y, w, h: 0.38,
      fontSize: 13, color: C.white, bold: true, align: "center", valign: "middle", margin: 0,
    });
    // 내용
    const itemH = (h - 0.38 - 0.15) / lines.length;
    lines.forEach((line, i) => {
      s.addText(line.text, {
        x: x + 0.15,
        y: y + 0.38 + 0.08 + i * itemH,
        w: w - 0.3,
        h: itemH,
        fontSize: line.size || 10.5,
        color: line.color || C.light,
        bold: !!line.bold,
        align: "left",
        valign: "middle",
      });
    });
  }

  // Frontend 박스
  drawBox(s, 0.3, 1.15, 2.8, 3.85, C.sky, "Frontend  (React + Vite)", [
    { text: "📄 Pages", bold: true, color: C.white, size: 11 },
    { text: "IngestPage", size: 10 },
    { text: "CollectionsPage", size: 10 },
    { text: "SearchPage", size: 10 },
    { text: "RAGPage", size: 10 },
    { text: "ExperimentsPage", size: 10 },
    { text: "", size: 6 },
    { text: "🔌 api/client.ts", bold: true, color: C.sky, size: 10 },
    { text: "hooks / components / ui", size: 10 },
  ]);

  // Backend 박스
  drawBox(s, 3.6, 1.15, 3.2, 3.85, C.navy, "Backend  (FastAPI)", [
    { text: "main.py · config.py", bold: true, color: C.white, size: 11 },
    { text: "", size: 4 },
    { text: "routers/", bold: true, color: "93C5FD", size: 10.5 },
    { text: "collections · documents", size: 10 },
    { text: "rag · search · experiments", size: 10 },
    { text: "", size: 4 },
    { text: "services/", bold: true, color: C.mint, size: 10.5 },
    { text: "rag_pipeline · qdrant", size: 10 },
    { text: "chunking · embedding · pdf", size: 10 },
    { text: "", size: 4 },
    { text: "models/schemas.py", bold: true, color: C.gray, size: 10 },
  ]);

  // External Services 박스
  drawBox(s, 7.3, 1.15, 2.4, 3.85, "6D28D9", "External Services", [
    { text: "Qdrant", bold: true, color: "C4B5FD", size: 11 },
    { text: "Vector DB", size: 10 },
    { text: "유사문서 검색", size: 10, color: C.gray },
    { text: "", size: 8 },
    { text: "Anthropic API", bold: true, color: "C4B5FD", size: 11 },
    { text: "Claude LLM", size: 10 },
    { text: "답변 생성 (Streaming)", size: 10, color: C.gray },
    { text: "", size: 8 },
    { text: "SQLite", bold: true, color: "C4B5FD", size: 11 },
    { text: "메타데이터 저장", size: 10, color: C.gray },
  ]);

  // 화살표 (Frontend → Backend)
  s.addShape(pres.shapes.LINE, {
    x: 3.1, y: 3.1, w: 0.5, h: 0,
    line: { color: C.mint, width: 2.5 },
  });
  s.addText("REST\nSSE", {
    x: 3.05, y: 2.85, w: 0.6, h: 0.55,
    fontSize: 7.5, color: C.mint, align: "center",
  });

  // 화살표 (Backend → External)
  s.addShape(pres.shapes.LINE, {
    x: 6.8, y: 3.1, w: 0.5, h: 0,
    line: { color: "A78BFA", width: 2.5 },
  });
  s.addText("API\nCall", {
    x: 6.75, y: 2.85, w: 0.55, h: 0.55,
    fontSize: 7.5, color: "A78BFA", align: "center",
  });

  // 하단 바
  s.addShape(pres.shapes.RECTANGLE, {
    x: 0, y: 5.53, w: 10, h: 0.095,
    fill: { color: C.navy }, line: { color: C.navy },
  });
}

// ════════════════════════════════════════════════════════
//  SLIDE 3 – Backend 레이어 구조
// ════════════════════════════════════════════════════════
{
  const s = pres.addSlide();
  s.background = { color: C.midBg };

  s.addShape(pres.shapes.RECTANGLE, {
    x: 0, y: 0, w: 10, h: 0.08, fill: { color: C.mint }, line: { color: C.mint },
  });

  s.addText("Backend 레이어 구조", {
    x: 0.5, y: 0.18, w: 9, h: 0.55,
    fontSize: 26, fontFace: "Calibri", color: C.white, bold: true,
  });
  s.addText("진입점 → 라우터 → 서비스 → 모델 · 데이터", {
    x: 0.5, y: 0.7, w: 9, h: 0.3,
    fontSize: 11, color: C.gray,
  });

  // 레이어별 가로 블록 (왼쪽 레이블 + 오른쪽 카드들)
  const layers = [
    {
      label: "진입점",
      color: "0EA5E9",
      y: 1.1,
      items: ["main.py\n앱 초기화 · CORS 설정", "config.py\n환경변수 로드"],
    },
    {
      label: "라우터",
      color: C.navy,
      y: 2.05,
      items: ["collections.py\n컬렉션 CRUD", "documents.py\n문서 관리", "rag.py\nRAG 엔드포인트", "search.py\n검색", "experiments.py\n실험"],
    },
    {
      label: "서비스",
      color: C.teal,
      y: 3.0,
      items: ["rag_pipeline.py\nRAG 파이프라인", "qdrant.py\n벡터DB 연동", "chunking.py\n청킹 전략", "embedding.py\n임베딩 생성", "pdf_parser.py\nPDF 파싱"],
    },
    {
      label: "모델·데이터",
      color: "7C3AED",
      y: 3.95,
      items: ["schemas.py\nPydantic 모델", "meta.db\nSQLite", "prompts/\nSystem Prompt"],
    },
  ];

  layers.forEach(({ label, color, y, items }) => {
    // 레이어 레이블
    s.addShape(pres.shapes.RECTANGLE, {
      x: 0.2, y, w: 1.2, h: 0.78,
      fill: { color }, line: { color },
      shadow: makeShadow(),
    });
    s.addText(label, {
      x: 0.2, y, w: 1.2, h: 0.78,
      fontSize: 10.5, color: C.white, bold: true, align: "center", valign: "middle", margin: 0,
    });

    // 화살표
    s.addShape(pres.shapes.LINE, {
      x: 1.4, y: y + 0.39, w: 0.25, h: 0,
      line: { color, width: 2 },
    });

    // 아이템 카드들
    const cardW = (10 - 1.95 - 0.2 * (items.length + 1)) / items.length;
    items.forEach((text, i) => {
      const cx = 1.65 + i * (cardW + 0.15);
      s.addShape(pres.shapes.RECTANGLE, {
        x: cx, y, w: cardW, h: 0.78,
        fill: { color: "1E3348" },
        line: { color, width: 1 },
        shadow: makeShadow(),
      });
      s.addShape(pres.shapes.RECTANGLE, {
        x: cx, y, w: 0.05, h: 0.78,
        fill: { color }, line: { color },
      });
      const [title, sub] = text.split("\n");
      s.addText(title, {
        x: cx + 0.1, y: y + 0.08, w: cardW - 0.15, h: 0.3,
        fontSize: 9.5, color: C.white, bold: true, align: "left",
      });
      if (sub) {
        s.addText(sub, {
          x: cx + 0.1, y: y + 0.38, w: cardW - 0.15, h: 0.3,
          fontSize: 8.5, color: C.gray, align: "left",
        });
      }
    });
  });

  s.addShape(pres.shapes.RECTANGLE, {
    x: 0, y: 5.53, w: 10, h: 0.095,
    fill: { color: C.navy }, line: { color: C.navy },
  });
}

// ════════════════════════════════════════════════════════
//  SLIDE 4 – 데이터 흐름 (2-flow)
// ════════════════════════════════════════════════════════
{
  const s = pres.addSlide();
  s.background = { color: C.midBg };

  s.addShape(pres.shapes.RECTANGLE, {
    x: 0, y: 0, w: 10, h: 0.08, fill: { color: C.mint }, line: { color: C.mint },
  });

  s.addText("주요 데이터 흐름", {
    x: 0.5, y: 0.18, w: 9, h: 0.55,
    fontSize: 26, fontFace: "Calibri", color: C.white, bold: true,
  });

  // ── 왼쪽: 문서 수집 흐름 ──
  s.addShape(pres.shapes.RECTANGLE, {
    x: 0.25, y: 0.85, w: 4.5, h: 0.4,
    fill: { color: C.navy }, line: { color: C.navy }, shadow: makeShadow(),
  });
  s.addText("문서 수집 (Ingestion) 흐름", {
    x: 0.25, y: 0.85, w: 4.5, h: 0.4,
    fontSize: 13, color: C.white, bold: true, align: "center", valign: "middle", margin: 0,
  });

  const ingestSteps = [
    { label: "PDF 업로드", color: "0EA5E9" },
    { label: "pdf_parser.py\nPDF 텍스트 추출", color: C.navy },
    { label: "chunking.py\n청킹 (고정/의미)", color: C.navy },
    { label: "embedding.py\n임베딩 생성", color: C.teal },
    { label: "qdrant.py\nVectorDB 저장", color: "7C3AED" },
    { label: "database.py\nSQLite 메타 저장", color: "7C3AED" },
  ];

  ingestSteps.forEach(({ label, color }, i) => {
    const y = 1.38 + i * 0.65;
    s.addShape(pres.shapes.RECTANGLE, {
      x: 0.5, y, w: 3.8, h: 0.5,
      fill: { color: "1E3348" }, line: { color, width: 1.5 }, shadow: makeShadow(),
    });
    s.addShape(pres.shapes.RECTANGLE, {
      x: 0.5, y, w: 0.06, h: 0.5,
      fill: { color }, line: { color },
    });
    s.addText(label, {
      x: 0.65, y: y + 0.04, w: 3.6, h: 0.42,
      fontSize: 10, color: C.light, align: "left", valign: "middle",
    });
    if (i < ingestSteps.length - 1) {
      s.addShape(pres.shapes.LINE, {
        x: 2.3, y: y + 0.5, w: 0, h: 0.15,
        line: { color: C.mint, width: 1.5 },
      });
    }
  });

  // ── 오른쪽: RAG 질의응답 흐름 ──
  s.addShape(pres.shapes.RECTANGLE, {
    x: 5.25, y: 0.85, w: 4.5, h: 0.4,
    fill: { color: C.teal }, line: { color: C.teal }, shadow: makeShadow(),
  });
  s.addText("RAG 질의응답 흐름", {
    x: 5.25, y: 0.85, w: 4.5, h: 0.4,
    fontSize: 13, color: C.white, bold: true, align: "center", valign: "middle", margin: 0,
  });

  const ragSteps = [
    { label: "사용자 질문 입력", color: "0EA5E9" },
    { label: "embedding.py\n질문 임베딩 생성", color: C.teal },
    { label: "qdrant.py\n유사 문서 검색 (Top-K)", color: "7C3AED" },
    { label: "rag_pipeline.py\nPrompt 구성", color: C.teal },
    { label: "Claude API\n답변 생성 (Streaming)", color: "F59E0B" },
    { label: "SSE → Frontend\n실시간 스트리밍 응답", color: "0EA5E9" },
  ];

  ragSteps.forEach(({ label, color }, i) => {
    const y = 1.38 + i * 0.65;
    s.addShape(pres.shapes.RECTANGLE, {
      x: 5.5, y, w: 3.8, h: 0.5,
      fill: { color: "1E3348" }, line: { color, width: 1.5 }, shadow: makeShadow(),
    });
    s.addShape(pres.shapes.RECTANGLE, {
      x: 5.5, y, w: 0.06, h: 0.5,
      fill: { color }, line: { color },
    });
    s.addText(label, {
      x: 5.65, y: y + 0.04, w: 3.6, h: 0.42,
      fontSize: 10, color: C.light, align: "left", valign: "middle",
    });
    if (i < ragSteps.length - 1) {
      s.addShape(pres.shapes.LINE, {
        x: 7.3, y: y + 0.5, w: 0, h: 0.15,
        line: { color: C.mint, width: 1.5 },
      });
    }
  });

  // 구분선
  s.addShape(pres.shapes.LINE, {
    x: 5.0, y: 0.9, w: 0, h: 4.5,
    line: { color: C.navy, width: 1, dashType: "dash" },
  });

  s.addShape(pres.shapes.RECTANGLE, {
    x: 0, y: 5.53, w: 10, h: 0.095,
    fill: { color: C.navy }, line: { color: C.navy },
  });
}

// ════════════════════════════════════════════════════════
//  SLIDE 5 – 마무리
// ════════════════════════════════════════════════════════
{
  const s = pres.addSlide();
  s.background = { color: C.darkBg };

  s.addShape(pres.shapes.RECTANGLE, {
    x: 0, y: 0, w: 10, h: 0.08, fill: { color: C.mint }, line: { color: C.mint },
  });

  s.addShape(pres.shapes.OVAL, {
    x: 6, y: 0.5, w: 5, h: 5,
    fill: { color: C.navy, transparency: 78 },
    line: { color: C.navy, transparency: 78 },
  });

  s.addText("기술 스택 요약", {
    x: 0.7, y: 1.1, w: 5, h: 0.55,
    fontSize: 26, color: C.white, bold: true,
  });

  const stack = [
    { cat: "Backend",  val: "FastAPI · Python · Pydantic · uvicorn",   color: C.sky   },
    { cat: "Frontend", val: "React 18 · TypeScript · Vite · Tailwind",  color: "93C5FD" },
    { cat: "VectorDB", val: "Qdrant · sentence-transformers",            color: "C4B5FD" },
    { cat: "LLM",      val: "Anthropic Claude API · SSE Streaming",      color: C.mint  },
    { cat: "DB",       val: "SQLite (aiosqlite) · pdfplumber",           color: C.gray  },
  ];

  stack.forEach(({ cat, val, color }, i) => {
    const y = 1.85 + i * 0.65;
    s.addShape(pres.shapes.RECTANGLE, {
      x: 0.5, y, w: 8.5, h: 0.52,
      fill: { color: "1A2B3C" }, line: { color, width: 1 }, shadow: makeShadow(),
    });
    s.addShape(pres.shapes.RECTANGLE, {
      x: 0.5, y, w: 0.07, h: 0.52,
      fill: { color }, line: { color },
    });
    s.addText(cat, {
      x: 0.7, y: y + 0.09, w: 1.2, h: 0.34,
      fontSize: 11, color, bold: true, align: "left",
    });
    s.addText(val, {
      x: 1.95, y: y + 0.09, w: 6.8, h: 0.34,
      fontSize: 11, color: C.light, align: "left",
    });
  });

  s.addShape(pres.shapes.RECTANGLE, {
    x: 0, y: 5.53, w: 10, h: 0.095,
    fill: { color: C.navy }, line: { color: C.navy },
  });
}

// ── 저장 ──────────────────────────────────────────────
pres.writeFile({ fileName: "D:/ai_study/rag_web_demo/RAG_Project_Structure.pptx" })
  .then(() => console.log("✅ RAG_Project_Structure.pptx 생성 완료!"))
  .catch(e => { console.error(e); process.exit(1); });
