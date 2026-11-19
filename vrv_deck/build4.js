const pptxgen = require("pptxgenjs");

// ===================== 尺寸与基础常量 =====================
const pres = new pptxgen();
pres.layout = "LAYOUT_WIDE"; // 13.333 x 7.5
const SLIDE_W = 13.333;
const SLIDE_H = 7.5;
const M = 0.7;
const CW = SLIDE_W - 2 * M;

const INK = "17282C";
const TEAL = "1F7A74";
const TEAL_D = "14544F";
const TEAL_L = "DCEAE6";
const AMBER = "D99A4E";
const EMBER = "C0522A";
const EMBER_L = "F6E4DA";
const PAPER = "F7F5EF";
const WHITE = "FFFFFF";
const GRAY = "5F7070";
const GRAY_L = "9AA9A6";
const LINE = "D9DCD6";
const CREAM = "EFE9DC";

const TF = "Noto Serif CJK SC";
const BF = "Noto Sans CJK SC";

pres.author = "HVAC 运行优化";
pres.title = "VRV 室外机夏季高温工况换热优化方案";
pres.subject = "遮阳 · 冷屋面 · 微雾预冷 · 智能控制";

// ===================== 容器系统 =====================
function createVirtualNode(type, data, parentX = 0, parentY = 0) {
  const opts = data.opts || {};
  const node = {
    type, data,
    absX: parentX + (opts.x || 0),
    absY: parentY + (opts.y || 0),
    w: opts.w || 0, h: opts.h || 0,
    children: []
  };
  node.addShape = function (shapeType, opts = {}) {
    const child = createVirtualNode("shape", { shapeType, opts }, node.absX, node.absY);
    node.children.push(child);
    return child;
  };
  node.addText = function (text, opts = {}) {
    const safeOpts = { fit: "shrink", ...opts };
    const child = createVirtualNode("text", { text, opts: safeOpts }, node.absX, node.absY);
    node.children.push(child);
    return child;
  };
  node.addImage = function (opts = {}) {
    const child = createVirtualNode("image", { opts }, node.absX, node.absY);
    node.children.push(child);
    return child;
  };
  return node;
}

function flattenNode(node, realSlide) {
  const absOpts = { ...node.data.opts, x: node.absX, y: node.absY };
  if (node.type === "shape" && absOpts.line && absOpts.line.width === 0 &&
      absOpts.fill && absOpts.fill.color) {
    absOpts.line = { color: absOpts.fill.color, width: 0.5 };
  }
  if (node.type === "shape") realSlide.addShape(node.data.shapeType, absOpts);
  else if (node.type === "text") realSlide.addText(node.data.text, absOpts);
  else if (node.type === "image") realSlide.addImage(absOpts);
  node.children.forEach((child) => flattenNode(child, realSlide));
}

const originalAddSlide = pres.addSlide.bind(pres);
pres.addSlide = function (options) {
  const realSlide = originalAddSlide(options);
  return {
    children: [],
    set background(val) { realSlide.background = val; },
    addShape: function (shapeType, opts = {}) {
      const node = createVirtualNode("shape", { shapeType, opts }, 0, 0);
      this.children.push(node);
      return node;
    },
    addText: function (text, opts = {}) {
      const safeOpts = { fit: "shrink", ...opts };
      const node = createVirtualNode("text", { text, opts: safeOpts }, 0, 0);
      this.children.push(node);
      return node;
    },
    addImage: function (opts = {}) {
      const node = createVirtualNode("image", { opts }, 0, 0);
      this.children.push(node);
      return node;
    },
    render: function () {
      this.children.forEach((child) => flattenNode(child, realSlide));
    }
  };
};

// ===================== 组件 =====================
const kicker = (s, t) =>
  s.addText(t, {
    x: M, y: 0.52, w: 6, h: 0.26,
    fontFace: BF, fontSize: 8.5, bold: true, color: TEAL, charSpacing: 2.2, margin: 0
  });

const title = (s, t, y = 0.92, size = 28) =>
  s.addText(t, {
    x: M, y, w: 12.2, h: 0.7,
    fontFace: TF, fontSize: size, bold: true, color: INK, charSpacing: 1, margin: 0
  });

const arrow = (s, x1, y1, x2, y2, color, width = 1.25, dash = "solid") => {
  s.addShape(pres.shapes.LINE, {
    x: Math.min(x1, x2), y: Math.min(y1, y2),
    w: Math.abs(x2 - x1), h: Math.abs(y2 - y1),
    line: { color, width, dashType: dash, endArrowType: "triangle", beginArrowType: "none" }
  });
};

// ===================== 01 封面 =====================
let s = pres.addSlide();
s.background = { color: INK };
s.addImage({ path: "assets/cover_2341x1317.jpg", x: 0, y: 0, w: SLIDE_W, h: SLIDE_H, sizing: { type: "cover", w: SLIDE_W, h: SLIDE_H } });

s.addText("暖通空调 · 运行优化方案", {
  x: 0.95, y: 1.25, w: 5, h: 0.28,
  fontFace: BF, fontSize: 9.5, bold: true, color: "9FC2BA", charSpacing: 2.4, margin: 0
});
s.addText("VRV 室外机", {
  x: 0.9, y: 1.85, w: 5.6, h: 0.82,
  fontFace: TF, fontSize: 40, bold: true, color: WHITE, charSpacing: 2, margin: 0
});
s.addText("夏季高温换热优化", {
  x: 0.9, y: 2.72, w: 5.6, h: 0.82,
  fontFace: TF, fontSize: 40, bold: true, color: WHITE, charSpacing: 2, margin: 0
});
s.addShape(pres.shapes.RECTANGLE, {
  x: 0.95, y: 3.78, w: 0.78, h: 0.05, fill: { color: AMBER }, line: { width: 0 }
});
s.addText("遮阳结构   ·   冷屋面   ·   微雾预冷   ·   智能控制", {
  x: 0.95, y: 4.05, w: 6.2, h: 0.32,
  fontFace: BF, fontSize: 12.5, color: "DCE7E3", charSpacing: 0.5, margin: 0
});
s.addShape(pres.shapes.LINE, {
  x: 0.95, y: 6.38, w: 4.6, h: 0, line: { color: "46605C", width: 0.75 }
});
s.addText("技术方案建议书   ·   2026.11", {
  x: 0.95, y: 6.52, w: 4.6, h: 0.3,
  fontFace: BF, fontSize: 9.5, color: "7E948F", margin: 0
});
s.render();

// ===================== 02 问题与机理 =====================
s = pres.addSlide();
s.background = { color: PAPER };
kicker(s, "01 / 问题与机理");
title(s, "问题不在能力，在进风温度");
s.addText("同一排机组、同样的天气，差别只在进风侧的热环境。屋面辐射与排风回流叠加，把进风温度抬高 5–8℃。", {
  x: M, y: 1.66, w: 11.9, h: 0.3,
  fontFace: BF, fontSize: 10.5, color: GRAY, margin: 0
});

// 链条
const nodes = [
  ["太阳辐射\n排风热回流", EMBER, WHITE],
  ["进风温度\n升高", EMBER_L, "6B3A24"],
  ["冷凝温度\n压力升高", EMBER_L, "6B3A24"],
  ["压缩机\n功耗增加", EMBER_L, "6B3A24"],
  ["制冷能力\n下降", EMBER_L, "6B3A24"]
];
const nGap = 0.42;
const nW = (CW - 4 * nGap) / 5;
const chainY = 2.24;
const chainH = 1.02;
nodes.forEach((n, i) => {
  const x = M + i * (nW + nGap);
  const c = s.addShape(pres.shapes.ROUNDED_RECTANGLE, {
    x, y: chainY, w: nW, h: chainH, rectRadius: 0.04,
    fill: { color: n[1] }, line: { color: n[1], width: 0.5 }
  });
  c.addText(String(i + 1).padStart(2, "0"), {
    x: 0.18, y: 0.14, w: 0.5, h: 0.22,
    fontFace: BF, fontSize: 7.5, bold: true,
    color: i === 0 ? "F2C6AC" : "B98268", charSpacing: 1, margin: 0
  });
  c.addText(n[0], {
    x: 0.18, y: 0.44, w: nW - 0.3, h: 0.52,
    fontFace: BF, fontSize: 9.6, bold: true, color: n[2], lineSpacing: 14, margin: 0
  });
  if (i < 4) {
    arrow(s, x + nW, chainY + chainH / 2, x + nW + nGap, chainY + chainH / 2, "C99A7E", 1.5);
  }
});

// 干预点
const interventions = [
  [0, "遮阳 + 冷屋面"],
  [1, "微雾预冷"],
  [3, "智能控制"]
];
interventions.forEach((iv) => {
  const cx = M + iv[0] * (nW + nGap) + nW / 2;
  arrow(s, cx, 3.88, cx, chainY + chainH + 0.04, TEAL, 1.25, "dash");
  const pw = 1.86;
  const p = s.addShape(pres.shapes.ROUNDED_RECTANGLE, {
    x: cx - pw / 2, y: 3.9, w: pw, h: 0.44, rectRadius: 0.22,
    fill: { color: TEAL_D }, line: { color: TEAL_D, width: 0.5 }
  });
  p.addText(iv[1], {
    x: 0, y: 0.02, w: pw, h: 0.4,
    fontFace: BF, fontSize: 9, bold: true, color: WHITE,
    align: "center", valign: "middle", charSpacing: 0.5, margin: 0
  });
});

// 量化条
const strip = s.addShape(pres.shapes.RECTANGLE, {
  x: M, y: 4.78, w: CW, h: 1.16, fill: { color: INK }, line: { width: 0 }
});
const stats = [
  ["−3~6", "℃", "机组进风温度"],
  ["−8~15", "%", "压缩机输入功率"],
  ["+5~10", "%", "高温时段制冷能力"]
];
stats.forEach((st, i) => {
  const x = 0.62 + i * 3.93;
  strip.addText([
    { text: st[0], options: { fontFace: TF, fontSize: 25, bold: true, color: AMBER } },
    { text: st[1], options: { fontFace: TF, fontSize: 13, bold: true, color: "E4C08D" } }
  ], {
    x, y: 0.2, w: 2.9, h: 0.5,
    margin: 0, valign: "middle"
  });
  strip.addText(st[2], {
    x, y: 0.72, w: 2.9, h: 0.28,
    fontFace: BF, fontSize: 9, color: "AFC4BE", margin: 0
  });
  if (i > 0) {
    strip.addShape(pres.shapes.LINE, {
      x: x - 0.42, y: 0.24, w: 0, h: 0.68,
      line: { color: "3A5252", width: 0.75 }
    });
  }
});

s.addText("经验关系：进风温度每升 1℃，制冷量降 1.5–2%、功耗增 2–3%；冷凝温度每降 1℃，功耗降 2–3%。数值用于方向判断，收益以试点实测为准。", {
  x: M, y: 6.3, w: 11.9, h: 0.5,
  fontFace: BF, fontSize: 8.5, color: GRAY_L, lineSpacing: 12, margin: 0
});
s.render();

// ===================== 03 解决方案 =====================
s = pres.addSlide();
s.background = { color: PAPER };
kicker(s, "02 / 解决方案");
title(s, "四件事，把进风拉回气象温度");
s.addText("先削得热，再削尖峰，最后守边界；单项有效，叠加才显著。", {
  x: M, y: 1.66, w: 4.3, h: 0.32,
  fontFace: BF, fontSize: 9.3, color: GRAY, lineSpacing: 13, margin: 0
});

const measures = [
  ["01", "高反射遮阳", "棚底距排风口 ≥1.5 m、反射率 ≥0.80；四周敞开，只挡顶部。"],
  ["02", "高反射冷屋面", "SRI ≥78；屋面表面降 15–25℃，机组近地气温降 2–3℃。"],
  ["03", "微雾蒸发预冷", "喷嘴沿进风侧架设，距翅片 0.3–0.5 m；RH >80% 停用。"],
  ["04", "智能控制联锁", "按进风温度分级投切，湿度 / 水质 / 风速三级联锁。"]
];
measures.forEach((m, i) => {
  const y = 2.42 + i * 1.0;
  s.addText(m[0], {
    x: M, y: y + 0.02, w: 0.44, h: 0.3,
    fontFace: BF, fontSize: 9, bold: true, color: TEAL, charSpacing: 0.5, margin: 0
  });
  s.addText(m[1], {
    x: M, y: y + 0.3, w: 4.2, h: 0.3,
    fontFace: BF, fontSize: 12, bold: true, color: INK, margin: 0
  });
  s.addText(m[2], {
    x: M, y: y + 0.62, w: 4.16, h: 0.34,
    fontFace: BF, fontSize: 8.4, color: GRAY, lineSpacing: 11.5, margin: 0
  });
  if (i < 3) {
    s.addShape(pres.shapes.LINE, {
      x: M, y: y + 0.96, w: 4.1, h: 0, line: { color: LINE, width: 0.75 }
    });
  }
});

// 效果图
const IMG = { x: 5.22, y: 1.48, w: 7.14, h: 4.94 };
s.addImage({ path: "assets/hero_1903x1317.jpg", x: IMG.x, y: IMG.y, w: IMG.w, h: IMG.h });

// 标注
const pins = [
  ["1", 0.22, 0.135],
  ["2", 0.93, 0.845],
  ["3", 0.565, 0.545],
  ["4", 0.705, 0.30]
];
pins.forEach((p) => {
  const px = IMG.x + p[1] * IMG.w - 0.2;
  const py = IMG.y + p[2] * IMG.h - 0.2;
  s.addShape(pres.shapes.OVAL, {
    x: px, y: py, w: 0.4, h: 0.4,
    fill: { color: TEAL_D }, line: { color: WHITE, width: 2 }
  });
  s.addText(p[0], {
    x: px, y: py, w: 0.4, h: 0.4,
    fontFace: BF, fontSize: 10, bold: true, color: WHITE,
    align: "center", valign: "middle", margin: 0
  });
});

s.addText("效果示意：顶出风机组棚底高出排风口 ≥1.5 m 且四周敞开；微雾喷管沿进风侧架设，雾流随进风进入翅片；屋面为高反射涂层。", {
  x: IMG.x, y: 6.5, w: IMG.w, h: 0.3,
  fontFace: BF, fontSize: 7.2, color: GRAY_L, lineSpacing: 10, margin: 0
});
s.render();

// ===================== 04 实施与收益 =====================
s = pres.addSlide();
s.background = { color: PAPER };
kicker(s, "03 / 实施与收益");
title(s, "三步落地，用数据收口");
s.addText("不追求一次改全楼：先在一个分区做闭环，用同工况对比说话，再按屋面分区复制。", {
  x: M, y: 1.66, w: 6.1, h: 0.3,
  fontFace: BF, fontSize: 9.5, color: GRAY, margin: 0
});

// 时间轴
s.addShape(pres.shapes.LINE, {
  x: 1.0, y: 2.3, w: 0, h: 3.62, line: { color: "C9D3CF", width: 1 }
});
const phases = [
  ["01", "测", "1 周", "基线实测", "红外热像、烟雾风场、温压流连续记录，锁定进风温升与回流路径。"],
  ["02", "改", "4–6 周", "构造改造", "先选 2–3 台典型机组加装遮阳、涂刷冷屋面，避让排风与检修通道。"],
  ["03", "调", "3–4 周", "联调验证", "接入微雾与分级控制，改造前后同工况对比，输出效果评估报告。"]
];
phases.forEach((p, i) => {
  const y = 2.3 + i * 1.24;
  s.addShape(pres.shapes.LINE, {
    x: 1.0, y: y + 0.28, w: 0.5, h: 0, line: { color: "C9D3CF", width: 0.75 }
  });
  s.addShape(pres.shapes.OVAL, {
    x: 0.82, y: y + 0.16, w: 0.36, h: 0.36,
    fill: { color: i === 2 ? TEAL_D : WHITE },
    line: { color: TEAL, width: 1.25 }
  });
  s.addText(p[0], {
    x: 0.82, y: y + 0.2, w: 0.36, h: 0.28,
    fontFace: BF, fontSize: 8.5, bold: true,
    color: i === 2 ? WHITE : TEAL, align: "center", margin: 0
  });
  s.addText(p[1] + "　" + p[2], {
    x: 1.5, y: y + 0.06, w: 4.9, h: 0.28,
    fontFace: BF, fontSize: 9, bold: true, color: TEAL, charSpacing: 0.5, margin: 0
  });
  s.addText(p[3], {
    x: 1.5, y: y + 0.34, w: 4.9, h: 0.32,
    fontFace: BF, fontSize: 12.5, bold: true, color: INK, margin: 0
  });
  s.addText(p[4], {
    x: 1.5, y: y + 0.68, w: 4.95, h: 0.42,
    fontFace: BF, fontSize: 8.6, color: GRAY, lineSpacing: 12, margin: 0
  });
});

s.addText("总周期 9–11 周，可在制冷季前完成；改造不影响机组正常运行。", {
  x: M, y: 6.12, w: 6.2, h: 0.28,
  fontFace: BF, fontSize: 8.5, color: GRAY_L, margin: 0
});

// 收益面板
const panel = s.addShape(pres.shapes.RECTANGLE, {
  x: 6.98, y: 1.7, w: 5.65, h: 4.62, fill: { color: INK }, line: { width: 0 }
});
panel.addText("预期收益（试点标定后确认）", {
  x: 0.5, y: 0.42, w: 4.6, h: 0.28,
  fontFace: BF, fontSize: 8.5, bold: true, color: "9FC2BA", charSpacing: 2, margin: 0
});
const bens = [
  ["−8~15%", "制冷季电耗"],
  ["+5~10%", "高温时段制冷能力"],
  ["−3~6℃", "机组进风温度"]
];
bens.forEach((b, i) => {
  const y = 0.92 + i * 1.02;
  panel.addText(b[0], {
    x: 0.5, y, w: 3.0, h: 0.5,
    fontFace: TF, fontSize: 24, bold: true, color: AMBER, margin: 0
  });
  panel.addText(b[1], {
    x: 0.5, y: y + 0.52, w: 4.6, h: 0.26,
    fontFace: BF, fontSize: 9, color: "AFC4BE", margin: 0
  });
});
panel.addShape(pres.shapes.LINE, {
  x: 0.5, y: 3.92, w: 4.65, h: 0, line: { color: "3A5252", width: 0.75 }
});
panel.addText("收益主要来自两台账：制冷季电费，以及高温时段被限频、停机吃掉的冷量。", {
  x: 0.5, y: 4.08, w: 4.7, h: 0.44,
  fontFace: BF, fontSize: 8.6, color: "9FB8B2", lineSpacing: 12, margin: 0
});

s.addText("底线：任何措施都不能以牺牲进风通道或屋面防水为代价；回收期以电费单与运行小时实测为准。", {
  x: M, y: 6.55, w: 11.9, h: 0.3,
  fontFace: BF, fontSize: 9, bold: true, color: INK, margin: 0
});
s.render();

pres.writeFile({ fileName: "VRV室外机夏季高温工况换热优化方案.pptx" }).then(() => {
  console.log("written");
});
