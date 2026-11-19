const pptxgen = require("pptxgenjs");

// ===================== 尺寸与基础常量 =====================
const pres = new pptxgen();
pres.layout = "LAYOUT_WIDE"; // 13.333 x 7.5
const SLIDE_W = 13.333;
const SLIDE_H = 7.5;
const M = 0.7;
const CW = SLIDE_W - 2 * M;

// 配色：热（问题）→ 冷（对策）
const INK = "17282C";
const INK_2 = "22403F";
const TEAL = "1F7A74";
const TEAL_D = "14544F";
const TEAL_L = "DCEAE6";
const TEAL_XL = "EEF5F3";
const EMBER = "C0522A";
const EMBER_L = "F6E4DA";
const AMBER = "D99A4E";
const PAPER = "F7F5EF";
const WHITE = "FFFFFF";
const GRAY = "5F7070";
const GRAY_L = "9AA9A6";
const LINE = "D9DCD6";

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
  node.addTable = function (tableData, opts = {}) {
    const child = createVirtualNode("table", { tableData, opts }, node.absX, node.absY);
    node.children.push(child);
    return child;
  };
  return node;
}

function flattenNode(node, realSlide) {
  const absOpts = { ...node.data.opts, x: node.absX, y: node.absY };
  if (node.type === "shape" && absOpts.line && absOpts.line.width === 0 &&
      absOpts.fill && absOpts.fill.color) {
    // 避免零宽描边被渲染成黑色发丝线：用填充色描边
    absOpts.line = { color: absOpts.fill.color, width: 0.5 };
  }
  if (node.type === "shape") realSlide.addShape(node.data.shapeType, absOpts);
  else if (node.type === "text") realSlide.addText(node.data.text, absOpts);
  else if (node.type === "image") realSlide.addImage(absOpts);
  else if (node.type === "table") realSlide.addTable(node.data.tableData, absOpts);
  node.children.forEach((child) => flattenNode(child, realSlide));
}

const originalAddSlide = pres.addSlide.bind(pres);
pres.addSlide = function (options) {
  const realSlide = originalAddSlide(options);
  return {
    children: [],
    _realSlide: realSlide,
    set background(val) { realSlide.background = val; },
    get background() { return realSlide.background; },
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
    addTable: function (tableData, opts = {}) {
      const node = createVirtualNode("table", { tableData, opts }, 0, 0);
      this.children.push(node);
      return node;
    },
    addChart: function (chartType, data, opts = {}) {
      realSlide.addChart(chartType, data, opts);
    },
    render: function () {
      this.children.forEach((child) => flattenNode(child, realSlide));
    }
  };
};

// ===================== 通用组件 =====================
function kicker(slide, text, color = TEAL) {
  slide.addText(text, {
    x: M, y: 0.5, w: 7, h: 0.28,
    fontFace: BF, fontSize: 10.5, bold: true, color,
    charSpacing: 1.6, margin: 0
  });
}

function title(slide, text, color = INK, w = CW) {
  slide.addText(text, {
    x: M, y: 0.78, w, h: 0.72,
    fontFace: TF, fontSize: 27, bold: true, color,
    charSpacing: 0.8, margin: 0
  });
}

function footer(slide, section, page) {
  slide.addText(section, {
    x: M, y: 7.05, w: 8, h: 0.24,
    fontFace: BF, fontSize: 8.5, color: GRAY_L, margin: 0
  });
  slide.addText(String(page).padStart(2, "0"), {
    x: SLIDE_W - M - 0.8, y: 7.0, w: 0.8, h: 0.3,
    fontFace: TF, fontSize: 11, color: GRAY_L, align: "right", margin: 0
  });
}

function card(slide, x, y, w, h, opts = {}) {
  const c = slide.addShape(pres.shapes.ROUNDED_RECTANGLE, {
    x, y, w, h, rectRadius: 0.04,
    fill: { color: opts.fill || WHITE },
    line: { color: opts.line || LINE, width: opts.lineWidth || 0.75 },
    shadow: opts.shadow === false ? undefined : {
      type: "outer", color: "000000", blur: 10, offset: 2, angle: 90, opacity: 0.06
    }
  });
  return c;
}

function arrow(slide, x1, y1, x2, y2, color = TEAL, width = 1.5, dash = "solid") {
  slide.addShape(pres.shapes.LINE, {
    x: x1, y: y1, w: x2 - x1, h: y2 - y1,
    line: { color, width, dashType: dash, endArrowType: "triangle" }
  });
}

// ===================== 01 封面 =====================
let s = pres.addSlide();
s.background = { color: INK };
s.addText("暖通空调 · 运行优化方案", {
  x: 0.95, y: 1.15, w: 6.4, h: 0.3,
  fontFace: BF, fontSize: 10.5, color: "9FC0BA", charSpacing: 2, margin: 0
});
s.addText([
  { text: "VRV 室外机", options: { breakLine: true } },
  { text: "夏季高温工况换热优化" }
], {
  x: 0.95, y: 1.65, w: 6.5, h: 1.7,
  fontFace: TF, fontSize: 38, bold: true, color: WHITE,
  lineSpacing: 52, charSpacing: 2, margin: 0
});
s.addShape(pres.shapes.RECTANGLE, {
  x: 0.95, y: 3.55, w: 1.1, h: 0.05, fill: { color: AMBER }, line: { width: 0 }
});
s.addText("遮阳结构  ·  高反射冷屋面  ·  微雾蒸发预冷  ·  智能控制", {
  x: 0.95, y: 3.85, w: 6.4, h: 0.4,
  fontFace: BF, fontSize: 14.5, color: "DCE6E2", margin: 0
});
s.addText("技术方案建议书", {
  x: 0.95, y: 4.55, w: 3, h: 0.3,
  fontFace: BF, fontSize: 10.5, color: "8FA5A1", margin: 0
});
s.addText("2026.11", {
  x: 2.02, y: 4.55, w: 2, h: 0.3,
  fontFace: BF, fontSize: 10.5, color: "8FA5A1", margin: 0
});
s.addShape(pres.shapes.LINE, {
  x: 0.95, y: 6.15, w: 5.6, h: 0,
  line: { color: "3A5252", width: 0.75 }
});
s.addText("适用对象：屋面集中布置的多联机（VRV / VRF）系统", {
  x: 0.95, y: 6.3, w: 6, h: 0.3,
  fontFace: BF, fontSize: 9.5, color: "7E9491", margin: 0
});

// 右侧现场照片
s.addShape(pres.shapes.RECTANGLE, {
  x: 7.55, y: 0, w: 0.05, h: SLIDE_H, fill: { color: AMBER }, line: { width: 0 }
});
s.addImage({ path: "assets/VRV_1280x1707.jpg", x: 7.708, y: 0, w: 5.625, h: 7.5 });
s.addShape(pres.shapes.RECTANGLE, {
  x: 7.708, y: 6.62, w: 5.625, h: 0.88,
  fill: { color: INK, transparency: 25 }, line: { width: 0 }
});
s.addText("现场：屋面机组密集排布，深色屋面大面积吸热", {
  x: 7.95, y: 6.82, w: 5.2, h: 0.3,
  fontFace: BF, fontSize: 9, color: "DCE6E2", margin: 0
});
s.render();

// ===================== 02 目录 =====================
s = pres.addSlide();
s.background = { color: PAPER };
kicker(s, "CONTENTS  方案框架");
title(s, "一份从现场出发的处置清单");
footer(s, "方案框架", 2);

const agenda = [
  ["01", "现状与诊断", "现场条件、影响量化、传热与能耗链路"],
  ["02", "技术路线", "四类措施的分层逻辑与取舍原则"],
  ["03", "分项措施", "遮阳 / 冷屋面 / 微雾预冷 / 智能控制"],
  ["04", "实施与验证", "分期实施路径、测点布置与 KPI 口径"],
  ["05", "收益与风险", "收益结构、边界条件与运维注意事项"]
];
agenda.forEach((it, i) => {
  const y = 1.62 + i * 0.96;
  s.addText(it[0], {
    x: M, y: y, w: 0.75, h: 0.42,
    fontFace: TF, fontSize: 20, bold: true, color: TEAL, margin: 0
  });
  s.addText(it[1], {
    x: 1.55, y: y - 0.06, w: 4.3, h: 0.42,
    fontFace: BF, fontSize: 17, bold: true, color: INK, charSpacing: 0.5, margin: 0
  });
  s.addText(it[2], {
    x: 1.55, y: y + 0.4, w: 5.4, h: 0.3,
    fontFace: BF, fontSize: 10.5, color: GRAY, margin: 0
  });
  s.addShape(pres.shapes.LINE, {
    x: 1.55, y: y + 0.83, w: 5.3, h: 0,
    line: { color: LINE, width: 0.75 }
  });
});

const q = s.addShape(pres.shapes.RECTANGLE, {
  x: 8.35, y: 1.62, w: 4.28, h: 3.78,
  fill: { color: INK }, line: { width: 0 }
});
q.addText("核心判断", {
  x: 0.5, y: 0.45, w: 3.3, h: 0.3,
  fontFace: BF, fontSize: 9.5, color: "8FB3AD", charSpacing: 2, margin: 0
});
q.addText("机组不是\n能力不足，而是\n被自己的热环境\n拖住了。", {
  x: 0.5, y: 1.05, w: 3.3, h: 1.95,
  fontFace: TF, fontSize: 18, color: WHITE, lineSpacing: 30, charSpacing: 0.5, margin: 0
});
q.addShape(pres.shapes.RECTANGLE, {
  x: 0.5, y: 2.92, w: 0.7, h: 0.04, fill: { color: AMBER }, line: { width: 0 }
});
q.addText("遮阳与冷屋面削减得热，\n微雾预冷削掉尖峰，\n智能控制守住边界。", {
  x: 0.5, y: 3.1, w: 3.3, h: 0.55,
  fontFace: BF, fontSize: 9, color: "B9CEC9", lineSpacing: 13, margin: 0
});
s.render();

// ===================== 03 现状诊断 =====================
s = pres.addSlide();
s.background = { color: PAPER };
kicker(s, "01 / 现状诊断");
title(s, "现场条件：深色屋面 + 密集排布");
footer(s, "现状与诊断", 3);

s.addImage({ path: "assets/VRV_1280x1707.jpg", x: M, y: 1.5, w: 3.3, h: 4.4 });
s.addText("屋面机组实拍", {
  x: M, y: 5.95, w: 3.3, h: 0.26,
  fontFace: BF, fontSize: 8.5, color: GRAY_L, margin: 0
});

const diag = [
  ["01", "深色屋面持续蓄热", "卷材类防水层太阳吸收率高，夏季午后表面可达 60–70℃，近地空气被加热后直接进入机组进风侧。"],
  ["02", "成排布置、进风受限", "机组背靠背成排，两侧进风空间不足；排风在相邻机组与女儿墙之间折返，形成热风短路。"],
  ["03", "缺少遮阳与导流", "机组长期处于无遮挡状态，顶部与侧面同时受晒；无导流措施，排风与进风相互干扰。"]
];
diag.forEach((d, i) => {
  const y = 1.5 + i * 1.3;
  const c = card(s, 4.35, y, 8.25, 1.18);
  c.addText(d[0], {
    x: 0.28, y: 0.22, w: 0.6, h: 0.3,
    fontFace: TF, fontSize: 13, bold: true, color: EMBER, margin: 0
  });
  c.addText(d[1], {
    x: 0.95, y: 0.16, w: 7.0, h: 0.3,
    fontFace: BF, fontSize: 13.5, bold: true, color: INK, margin: 0
  });
  c.addText(d[2], {
    x: 0.95, y: 0.52, w: 7.0, h: 0.55,
    fontFace: BF, fontSize: 9.5, color: GRAY, lineSpacing: 14, margin: 0
  });
});

const concl = s.addShape(pres.shapes.RECTANGLE, {
  x: 4.35, y: 5.55, w: 8.25, h: 1.05,
  fill: { color: EMBER_L }, line: { color: "E8C7B5", width: 0.75 }
});
concl.addText("诊断结论", {
  x: 0.3, y: 0.18, w: 1.2, h: 0.26,
  fontFace: BF, fontSize: 9, bold: true, color: EMBER, charSpacing: 1.5, margin: 0
});
concl.addText("机组不是被天气打败的，是被自己的排风与脚下的屋面加热的：先把进风温度降下来，后面所有指标才会跟着改善。", {
  x: 0.3, y: 0.46, w: 7.6, h: 0.5,
  fontFace: BF, fontSize: 10.5, color: "6B3A24", lineSpacing: 15, margin: 0
});
s.render();

// ===================== 04 影响量化 =====================
s = pres.addSlide();
s.background = { color: PAPER };
kicker(s, "01 / 影响量化");
title(s, "进风温度每高 1℃，代价都在电表上");
footer(s, "现状与诊断", 4);

s.addChart(pres.charts.LINE, [
  { name: "相对制冷量", labels: ["30℃", "33℃", "36℃", "39℃", "42℃", "45℃"], values: [100, 96, 91, 85, 79, 72] },
  { name: "相对输入功率", labels: ["30℃", "33℃", "36℃", "39℃", "42℃", "45℃"], values: [100, 104, 109, 115, 122, 129] },
  { name: "能效比 COP", labels: ["30℃", "33℃", "36℃", "39℃", "42℃", "45℃"], values: [100, 92, 83, 74, 65, 56] }
], {
  x: 0.55, y: 1.52, w: 7.7, h: 4.25,
  chartColors: [TEAL, EMBER, AMBER],
  lineSize: 2.25,
  lineDataSymbol: "circle",
  lineDataSymbolSize: 5,
  showLegend: true,
  legendPos: "b",
  legendFontFace: BF,
  legendFontSize: 9,
  showTitle: false,
  catAxisLabelFontFace: BF,
  catAxisLabelFontSize: 9,
  catAxisLabelColor: GRAY,
  catAxisLineColor: LINE,
  valAxisLabelFontFace: BF,
  valAxisLabelFontSize: 9,
  valAxisLabelColor: GRAY,
  valAxisLineColor: "FFFFFF",
  valGridLine: { color: "E6E5DF", style: "solid", size: 0.75 },
  valAxisMinVal: 40,
  valAxisMaxVal: 135,
  valAxisMajorUnit: 20,
  catAxisTitle: "机组进风温度",
  catAxisTitleFontFace: BF,
  catAxisTitleFontSize: 9.5,
  catAxisTitleColor: GRAY
});
s.addText("指数化示意：以 30℃ 进风工况为 100。基于典型风冷机组变工况特性，实际曲线需以现场实测标定。", {
  x: 0.7, y: 5.9, w: 7.4, h: 0.3,
  fontFace: BF, fontSize: 8.5, color: GRAY_L, margin: 0
});

const metrics = [
  ["−1.5~2%", "进风温度每升高 1℃，制冷能力下降幅度", EMBER],
  ["+2~3%", "冷凝温度每升高 1℃，压缩机能耗增加幅度", EMBER],
  ["5~8℃", "现场机组进风相对气象干球的常见温差（待实测确认）", TEAL]
];
metrics.forEach((m, i) => {
  const y = 1.55 + i * 1.45;
  const c = card(s, 8.6, y, 4.03, 1.28);
  c.addText(m[0], {
    x: 0.3, y: 0.16, w: 3.4, h: 0.46,
    fontFace: TF, fontSize: 23, bold: true, color: m[2], margin: 0
  });
  c.addText(m[1], {
    x: 0.3, y: 0.68, w: 3.35, h: 0.48,
    fontFace: BF, fontSize: 9, color: GRAY, lineSpacing: 13, margin: 0
  });
});
s.addText("结论：把进风温度拉回接近气象温度，就同时拿到了“能力恢复”和“功耗下降”两份收益。", {
  x: 8.6, y: 5.95, w: 4.03, h: 0.55,
  fontFace: BF, fontSize: 9.5, color: INK, lineSpacing: 14, margin: 0
});
s.render();

// ===================== 05 机理双链 =====================
s = pres.addSlide();
s.background = { color: PAPER };
kicker(s, "01 / 机理链路");
title(s, "从热源到电表：同一条链的两个方向");
footer(s, "现状与诊断", 5);

const boxX = [1.75, 3.98, 6.21, 8.44, 10.67];
const boxW = 1.96;
const boxH = 0.95;

s.addText("现状链", {
  x: M, y: 1.72, w: 1.0, h: 0.3,
  fontFace: BF, fontSize: 10, bold: true, color: EMBER, charSpacing: 1, margin: 0
});
s.addText("热负荷", {
  x: M, y: 2.02, w: 1.0, h: 0.3,
  fontFace: BF, fontSize: 8.5, color: GRAY_L, margin: 0
});

const problem = ["太阳辐射\n排风热回流", "进风温度\n升高", "冷凝温度\n压力升高", "压缩机\n功耗增加", "制冷能力\n下降"];
problem.forEach((t, i) => {
  const c = s.addShape(pres.shapes.ROUNDED_RECTANGLE, {
    x: boxX[i], y: 1.5, w: boxW, h: boxH, rectRadius: 0.05,
    fill: { color: i === 0 ? EMBER : "E8CBBB" },
    line: { width: 0 }
  });
  c.addText(t, {
    x: 0.1, y: 0.12, w: boxW - 0.2, h: boxH - 0.24,
    fontFace: BF, fontSize: 10.5, bold: true,
    color: i === 0 ? WHITE : "6B3A24",
    align: "center", valign: "middle", lineSpacing: 15, margin: 0
  });
  if (i < 4) {
    s.addShape(pres.shapes.LINE, {
      x: boxX[i] + boxW + 0.05, y: 1.975, w: 0.17, h: 0,
      line: { color: EMBER, width: 1.5, endArrowType: "triangle" }
    });
  }
});

s.addText("对策链", {
  x: M, y: 3.97, w: 1.0, h: 0.3,
  fontFace: BF, fontSize: 10, bold: true, color: TEAL, charSpacing: 1, margin: 0
});
s.addText("干预点", {
  x: M, y: 4.27, w: 1.0, h: 0.3,
  fontFace: BF, fontSize: 8.5, color: GRAY_L, margin: 0
});

const solution = ["高反射遮阳", "冷屋面降温", "微雾预冷", "进风温度\n下降", "冷凝温度下降\n效率改善"];
solution.forEach((t, i) => {
  const c = s.addShape(pres.shapes.ROUNDED_RECTANGLE, {
    x: boxX[i], y: 3.75, w: boxW, h: boxH, rectRadius: 0.05,
    fill: { color: i < 3 ? TEAL : TEAL_L },
    line: { width: 0 }
  });
  c.addText(t, {
    x: 0.1, y: 0.12, w: boxW - 0.2, h: boxH - 0.24,
    fontFace: BF, fontSize: 10.5, bold: true,
    color: i < 3 ? WHITE : TEAL_D,
    align: "center", valign: "middle", lineSpacing: 15, margin: 0
  });
  if (i < 4) {
    s.addShape(pres.shapes.LINE, {
      x: boxX[i] + boxW + 0.05, y: 4.225, w: 0.17, h: 0,
      line: { color: TEAL, width: 1.5, endArrowType: "triangle" }
    });
  }
});

// 三条干预连线
[0, 1].forEach((i) => {
  const cx = boxX[i] + boxW / 2;
  arrow(s, cx, 3.7, cx, 2.52, AMBER, 1.25, "dash");
});
arrow(s, boxX[2] + 0.3, 3.75, boxX[1] + boxW - 0.35, 2.46, AMBER, 1.25, "dash");

// 终点
const out = s.addShape(pres.shapes.ROUNDED_RECTANGLE, {
  x: 1.75, y: 5.35, w: 10.88, h: 0.72, rectRadius: 0.03,
  fill: { color: INK }, line: { width: 0 }
});
out.addText("制冷功耗下降  ·  高温限频与停机风险下降  ·  设备寿命延长", {
  x: 0.2, y: 0.06, w: 10.5, h: 0.6,
  fontFace: BF, fontSize: 12, bold: true, color: WHITE,
  align: "center", valign: "middle", charSpacing: 0.5, margin: 0
});

s.addText("经验关系：冷凝温度每降低 1℃，压缩机能耗约下降 2–3%；进风温度每降低 1℃，制冷能力约提升 1.5–2%。数值用于方向判断，项目收益以实测为准。", {
  x: M, y: 6.3, w: 11.9, h: 0.4,
  fontFace: BF, fontSize: 8.5, color: GRAY, margin: 0
});
s.render();

// ===================== 06 技术路线 =====================
s = pres.addSlide();
s.background = { color: PAPER };
kicker(s, "02 / 技术路线");
title(s, "三层措施：先削得热，再削尖峰，最后守边界");
footer(s, "技术路线", 6);

const layers = [
  ["基础层", "必做", "高反射遮阳  +  高反射冷屋面", "削减进入机组的辐射得热与屋面长波辐射，把进风温度拉回接近气象温度。", TEAL, TEAL_L],
  ["增强层", "按需", "微雾蒸发预冷", "只在极端高温、低湿时段启用，削掉午后 2–4 小时的温度尖峰，不做常态运行。", "2E7D8F", "DCE9EC"],
  ["控制层", "贯穿", "智能控制与联锁", "按进风温度分级投入，湿度、水质、风速联锁保护，并让每一度温降都可计量。", INK_2, "E3E7E5"]
];
layers.forEach((l, i) => {
  const y = 1.55 + i * 1.52;
  const c = card(s, M, y, 8.1, 1.34, { fill: WHITE });
  c.addShape(pres.shapes.RECTANGLE, {
    x: 0, y: 0, w: 0.09, h: 1.34, fill: { color: l[4] }, line: { width: 0 }
  });
  c.addText(l[0], {
    x: 0.32, y: 0.2, w: 1.6, h: 0.32,
    fontFace: TF, fontSize: 14, bold: true, color: l[4], charSpacing: 1, margin: 0
  });
  c.addShape(pres.shapes.ROUNDED_RECTANGLE, {
    x: 0.28, y: 0.74, w: 0.72, h: 0.36, rectRadius: 0.18,
    fill: { color: l[5] }, line: { width: 0 }
  });
  c.addText(l[1], {
    x: 0.28, y: 0.74, w: 0.72, h: 0.36,
    fontFace: BF, fontSize: 8, color: l[4], align: "center", valign: "middle", margin: 0
  });
  c.addText(l[2], {
    x: 1.85, y: 0.18, w: 6.0, h: 0.34,
    fontFace: BF, fontSize: 13, bold: true, color: INK, margin: 0
  });
  c.addText(l[3], {
    x: 1.85, y: 0.58, w: 5.95, h: 0.62,
    fontFace: BF, fontSize: 9.3, color: GRAY, lineSpacing: 14, margin: 0
  });
});

// 右侧结论卡
const rc = s.addShape(pres.shapes.RECTANGLE, {
  x: 9.05, y: 1.55, w: 3.58, h: 4.36,
  fill: { color: INK }, line: { width: 0 }
});
rc.addText("预期效果区间", {
  x: 0.35, y: 0.35, w: 2.9, h: 0.28,
  fontFace: BF, fontSize: 9, color: "8FB3AD", charSpacing: 1.6, margin: 0
});
rc.addText("−3~6℃", {
  x: 0.35, y: 0.72, w: 2.9, h: 0.5,
  fontFace: TF, fontSize: 22, bold: true, color: AMBER, margin: 0
});
rc.addText("机组进风温度", {
  x: 0.35, y: 1.22, w: 2.9, h: 0.24,
  fontFace: BF, fontSize: 8.5, color: "B9CEC9", margin: 0
});
rc.addText("−0.1~0.2MPa", {
  x: 0.35, y: 1.62, w: 2.9, h: 0.5,
  fontFace: TF, fontSize: 18, bold: true, color: "9FC9C2", margin: 0
});
rc.addText("冷凝压力", {
  x: 0.35, y: 2.1, w: 2.9, h: 0.24,
  fontFace: BF, fontSize: 8.5, color: "B9CEC9", margin: 0
});
rc.addText("−8~15%", {
  x: 0.35, y: 2.5, w: 2.9, h: 0.5,
  fontFace: TF, fontSize: 20, bold: true, color: "9FC9C2", margin: 0
});
rc.addText("压缩机输入功率", {
  x: 0.35, y: 2.98, w: 2.9, h: 0.24,
  fontFace: BF, fontSize: 8.5, color: "B9CEC9", margin: 0
});
rc.addShape(pres.shapes.LINE, {
  x: 0.35, y: 3.42, w: 2.85, h: 0,
  line: { color: "3A5252", width: 0.75 }
});
rc.addText("目标值需经试点实测标定；\n优先保证不遮挡排风、\n不产生新的热风短路。", {
  x: 0.35, y: 3.56, w: 2.9, h: 0.7,
  fontFace: BF, fontSize: 8.5, color: "8FA5A1", lineSpacing: 13, margin: 0
});
s.render();

// ===================== 07 措施一：遮阳 =====================
s = pres.addSlide();
s.background = { color: PAPER };
kicker(s, "03 / 分项措施 · 01");
title(s, "高反射遮阳：先挡住头顶的太阳");
footer(s, "分项措施", 7);

const sunPts = [
  ["01", "结构与材质", "铝合金 / 镀锌钢骨架 + 高反射涂层金属板，工厂预制、现场装配，不在屋面开孔。"],
  ["02", "高度与覆盖", "板底距机组顶部 ≥1.5 m；覆盖机组顶部与进风侧上方，排风方向保持完全敞开。"],
  ["03", "安全与维护", "按屋面风荷载校核锚固，预留检修通道与排水坡；每年清洗一次以保持反射率。"]
];
sunPts.forEach((p, i) => {
  const y = 1.5 + i * 1.02;
  s.addText(p[0], {
    x: M, y: y, w: 0.45, h: 0.26,
    fontFace: TF, fontSize: 10, bold: true, color: TEAL, margin: 0
  });
  s.addText(p[1], {
    x: 1.15, y: y - 0.05, w: 4.9, h: 0.28,
    fontFace: BF, fontSize: 12, bold: true, color: INK, margin: 0
  });
  s.addText(p[2], {
    x: 1.15, y: y + 0.3, w: 4.9, h: 0.58,
    fontFace: BF, fontSize: 9, color: GRAY, lineSpacing: 13.5, margin: 0
  });
});

s.addShape(pres.shapes.LINE, { x: M, y: 4.55, w: 5.3, h: 0, line: { color: LINE, width: 0.75 } });
const specs = [["太阳反射率", "≥0.80"], ["热发射率", "≥0.85"], ["板底净高", "≥1.5 m"], ["安装倾角", "5–10°"]];
specs.forEach((sp, i) => {
  const x = M + (i % 2) * 2.72;
  const y = 4.78 + Math.floor(i / 2) * 0.92;
  s.addText(sp[0], {
    x, y, w: 1.6, h: 0.24, fontFace: BF, fontSize: 8.5, color: GRAY, margin: 0
  });
  s.addText(sp[1], {
    x, y: y + 0.26, w: 2.5, h: 0.34,
    fontFace: TF, fontSize: 15, bold: true, color: TEAL_D, margin: 0
  });
});

// 右侧构造示意
const dx = 6.35;
s.addText("构造示意（立面）", {
  x: 10.75, y: 1.4, w: 1.75, h: 0.24,
  fontFace: BF, fontSize: 8.5, color: GRAY_L, charSpacing: 1, align: "right", margin: 0
});
s.addShape(pres.shapes.RECTANGLE, {
  x: 6.55, y: 5.13, w: 6.0, h: 0.09, fill: { color: "CFC9BB" }, line: { width: 0 }
});
s.addText("屋面", {
  x: 11.95, y: 5.24, w: 0.55, h: 0.22, fontFace: BF, fontSize: 7.5, color: GRAY_L, margin: 0
});
// 机组
s.addShape(pres.shapes.RECTANGLE, {
  x: 7.75, y: 3.62, w: 3.55, h: 1.49,
  fill: { color: WHITE }, line: { color: "9AA9A6", width: 1 }
});
s.addShape(pres.shapes.OVAL, {
  x: 8.95, y: 3.85, w: 1.15, h: 1.05,
  fill: { color: "E4E7E2" }, line: { color: "C3CAC6", width: 0.75 }
});
s.addShape(pres.shapes.OVAL, {
  x: 9.28, y: 4.12, w: 0.5, h: 0.5,
  fill: { color: "CBD2CE" }, line: { width: 0 }
});
s.addText("VRV 室外机", {
  x: 7.92, y: 4.82, w: 1.5, h: 0.24, fontFace: BF, fontSize: 7.5, color: GRAY, margin: 0
});
// 遮阳板与立柱
s.addShape(pres.shapes.RECTANGLE, {
  x: 6.95, y: 2.3, w: 5.15, h: 0.14,
  fill: { color: "D9E1DC" }, line: { color: "8FA5A1", width: 1 }
});
s.addShape(pres.shapes.RECTANGLE, {
  x: 6.98, y: 2.47, w: 0.07, h: 2.63, fill: { color: "B4C0BA" }, line: { width: 0 }
});
s.addShape(pres.shapes.RECTANGLE, {
  x: 11.98, y: 2.47, w: 0.07, h: 2.63, fill: { color: "B4C0BA" }, line: { width: 0 }
});
s.addText("高反射遮阳板", {
  x: 9.35, y: 2.5, w: 1.9, h: 0.26,
  fontFace: BF, fontSize: 8.5, bold: true, color: TEAL_D, margin: 0
});
// 太阳辐射
s.addText("夏季太阳辐射", {
  x: 6.9, y: 1.48, w: 1.8, h: 0.26,
  fontFace: BF, fontSize: 8.5, color: AMBER, margin: 0
});
[[8.75, 9.3], [9.75, 10.3], [10.75, 11.3]].forEach((p) => {
  arrow(s, p[0], 1.72, p[1], 2.28, AMBER, 1.5);
});
// 高度标注
s.addShape(pres.shapes.LINE, {
  x: 7.45, y: 2.47, w: 0, h: 1.13,
  line: { color: TEAL, width: 0.75 }
});
s.addShape(pres.shapes.LINE, {
  x: 7.37, y: 2.47, w: 0.16, h: 0, line: { color: TEAL, width: 0.75 }
});
s.addShape(pres.shapes.LINE, {
  x: 7.37, y: 3.6, w: 0.16, h: 0, line: { color: TEAL, width: 0.75 }
});
s.addText("≥1.5 m", {
  x: 7.52, y: 2.86, w: 0.72, h: 0.24,
  fontFace: BF, fontSize: 8, bold: true, color: TEAL_D, margin: 0
});
// 排风
arrow(s, 11.33, 4.32, 11.96, 4.32, TEAL, 2.5);
s.addText("水平排风", {
  x: 11.34, y: 3.98, w: 0.85, h: 0.24,
  fontFace: BF, fontSize: 7.5, color: TEAL_D, margin: 0
});
s.addText("遮阳板只覆盖顶部，不阻断背面进风与水平排风；立柱落在机组两端外侧。", {
  x: 6.55, y: 5.45, w: 6.0, h: 0.44,
  fontFace: BF, fontSize: 8, color: GRAY, lineSpacing: 12, margin: 0
});
const sunFu = s.addShape(pres.shapes.RECTANGLE, {
  x: M, y: 6.34, w: 5.35, h: 0.6,
  fill: { color: TEAL_XL }, line: { width: 0 }
});
sunFu.addText("预期效果：机组表面辐射得热降低约 50–70%，顶板下表面温度明显低于环境温度。", {
  x: 0.22, y: 0.06, w: 4.95, h: 0.48,
  fontFace: BF, fontSize: 8.4, color: TEAL_D, lineSpacing: 12, margin: 0
});
s.render();

// ===================== 08 措施二：冷屋面 =====================
s = pres.addSlide();
s.background = { color: PAPER };
kicker(s, "03 / 分项措施 · 02");
title(s, "高反射冷屋面：把脚下的热源关掉");
footer(s, "分项措施", 8);

const roofStats = [
  ["SRI ≥ 78", "初始太阳反射指数，满足冷屋面基本要求"],
  ["−15~25℃", "夏季午后屋面表面温度降幅（经验区间）"],
  ["−2~3℃", "机组周围近地空气温度降幅（经验区间）"]
];
roofStats.forEach((r, i) => {
  const x = M + i * 4.1;
  const c = card(s, x, 1.5, 3.74, 1.08);
  c.addText(r[0], {
    x: 0.28, y: 0.16, w: 3.2, h: 0.42,
    fontFace: TF, fontSize: 19, bold: true, color: TEAL, margin: 0
  });
  c.addText(r[1], {
    x: 0.28, y: 0.62, w: 3.15, h: 0.36,
    fontFace: BF, fontSize: 8.5, color: GRAY, lineSpacing: 12, margin: 0
  });
});

s.addText("屋面表面温度对比（℃ · 夏季午后示意）", {
  x: M, y: 2.85, w: 6.2, h: 0.28,
  fontFace: BF, fontSize: 9.5, bold: true, color: INK, margin: 0
});
const bars = [
  ["现状深色屋面", 70, EMBER],
  ["高反射冷屋面", 50, TEAL],
  ["近地空气", 35, "A9B5B0"]
];
bars.forEach((b, i) => {
  const y = 3.45 + i * 0.78;
  const val = b[1];
  const w = val * 0.055;
  s.addText(b[0], {
    x: M, y: y + 0.04, w: 1.75, h: 0.26,
    fontFace: BF, fontSize: 9, color: INK, margin: 0
  });
  s.addShape(pres.shapes.RECTANGLE, {
    x: 2.55, y: y, w: 4.4, h: 0.34, fill: { color: "E8E7E0" }, line: { width: 0 }
  });
  s.addShape(pres.shapes.RECTANGLE, {
    x: 2.55, y: y, w: w, h: 0.34, fill: { color: b[2] }, line: { width: 0 }
  });
  s.addText(val + "℃", {
    x: 2.62 + w, y: y + 0.04, w: 0.8, h: 0.26,
    fontFace: TF, fontSize: 10, bold: true, color: i === 2 ? GRAY : b[2], margin: 0
  });
});
s.addText("屋面反射率提升后，白天蓄热量显著下降，夜间也不再向机组持续辐射放热。", {
  x: M, y: 5.85, w: 6.1, h: 0.5,
  fontFace: BF, fontSize: 9, color: GRAY, lineSpacing: 13, margin: 0
});

s.addText("施工工序", {
  x: 7.35, y: 2.85, w: 3, h: 0.28,
  fontFace: BF, fontSize: 9.5, bold: true, color: INK, margin: 0
});
const steps = ["基层清理、修补空鼓与裂缝", "滚涂封闭底涂，增强附着力", "两遍面涂，纵横交叉施工", "养护 24 h，验收反射率与附着力"];
steps.forEach((t, i) => {
  const y = 3.28 + i * 0.66;
  const c = s.addShape(pres.shapes.OVAL, {
    x: 7.35, y: y, w: 0.36, h: 0.36, fill: { color: TEAL_L }, line: { width: 0 }
  });
  c.addText(String(i + 1), {
    x: 0, y: 0, w: 0.36, h: 0.36,
    fontFace: BF, fontSize: 9, bold: true, color: TEAL_D, align: "center", valign: "middle", margin: 0
  });
  s.addText(t, {
    x: 7.9, y: y + 0.06, w: 4.3, h: 0.28,
    fontFace: BF, fontSize: 9.5, color: INK, margin: 0
  });
});

const note = s.addShape(pres.shapes.RECTANGLE, {
  x: 7.35, y: 6.05, w: 4.85, h: 0.62,
  fill: { color: TEAL_XL }, line: { width: 0 }
});
note.addText("选材要点：与既有防水层相容、耐候抗污、湿态防滑；上人屋面需满足防滑等级。", {
  x: 0.2, y: 0.08, w: 4.45, h: 0.46,
  fontFace: BF, fontSize: 8, color: TEAL_D, lineSpacing: 12, margin: 0
});
s.render();

// ===================== 09 措施三：微雾预冷 =====================
s = pres.addSlide();
s.background = { color: PAPER };
kicker(s, "03 / 分项措施 · 03");
title(s, "微雾蒸发预冷：只削尖峰，不做常态");
footer(s, "分项措施", 9);

const mistPts = [
  ["原理", "高压微雾把水雾化到 5–15 μm，在进风侧蒸发吸热，使进风干球温度逼近湿球温度。"],
  ["布置", "喷嘴沿进风侧上部布置，雾流与进风同向；距翅片 ≥0.5 m，禁止直接喷淋换热器。"],
  ["水质", "软化 / 反渗透处理，控制硬度与电导率；防止翅片结垢、白粉与腐蚀，喷嘴可快拆清洗。"]
];
mistPts.forEach((p, i) => {
  const y = 1.5 + i * 0.98;
  s.addText(p[0], {
    x: M, y: y, w: 0.8, h: 0.26,
    fontFace: BF, fontSize: 9, bold: true, color: TEAL, charSpacing: 1, margin: 0
  });
  s.addText(p[1], {
    x: 1.55, y: y - 0.08, w: 5.05, h: 0.8,
    fontFace: BF, fontSize: 10.5, color: INK, lineSpacing: 16, margin: 0
  });
});

const warn = s.addShape(pres.shapes.RECTANGLE, {
  x: M, y: 4.5, w: 6.15, h: 1.05,
  fill: { color: EMBER_L }, line: { width: 0 }
});
warn.addText("使用边界", {
  x: 0.25, y: 0.16, w: 1.2, h: 0.24,
  fontFace: BF, fontSize: 8.5, bold: true, color: EMBER, charSpacing: 1.5, margin: 0
});
warn.addText("仅在高温、低湿的午后时段启用；相对湿度偏高时蒸发效率骤降且易在翅片形成水膜，应立即停用。", {
  x: 0.25, y: 0.46, w: 5.6, h: 0.5,
  fontFace: BF, fontSize: 9.2, color: "6B3A24", lineSpacing: 14, margin: 0
});

s.addText("进风温降估算（按蒸发效率 60–70%）", {
  x: 7.15, y: 1.5, w: 5.4, h: 0.3,
  fontFace: BF, fontSize: 9.5, bold: true, color: INK, margin: 0
});

const th = (t) => ({ text: t, options: { fill: { color: INK }, color: WHITE, bold: true, fontFace: BF, fontSize: 9 } });
s.addTable([
  [th("干球温度"), th("相对湿度"), th("湿球温度"), th("可达温降")],
  ["38℃", "45%", "27.6℃", "5–6℃"],
  ["40℃", "40%", "27.6℃", "6–7℃"],
  ["35℃", "60%", "28.4℃", "4–5℃"]
], {
  x: 7.15, y: 1.88, w: 5.4,
  colW: [1.25, 1.25, 1.4, 1.5],
  rowH: 0.46,
  border: { pt: 0.75, color: "E2E0D8" },
  fontFace: BF, fontSize: 9.5, color: INK,
  align: "center", valign: "middle",
  fill: { color: WHITE }
});
s.addText("湿球温度按常压空气近似计算，用于方案判断；现场应实测干湿球后复核。", {
  x: 7.15, y: 3.8, w: 5.4, h: 0.28,
  fontFace: BF, fontSize: 8, color: GRAY_L, margin: 0
});

const bounds = ["相对湿度 ≤80%RH", "进风侧风速 ≤3 m/s", "水质：软化 / RO", "冬季：排空防冻"];
bounds.forEach((b, i) => {
  const x = 7.15 + (i % 2) * 2.8;
  const y = 4.25 + Math.floor(i / 2) * 0.62;
  s.addShape(pres.shapes.ROUNDED_RECTANGLE, {
    x, y, w: 2.6, h: 0.46, rectRadius: 0.22,
    fill: { color: TEAL_XL }, line: { color: "CFE0DB", width: 0.75 }
  });
  s.addText(b, {
    x: x + 0.12, y: y + 0.1, w: 2.36, h: 0.26,
    fontFace: BF, fontSize: 8.5, color: TEAL_D, margin: 0
  });
});
s.addText("微雾是“尖峰工具”，不是常态手段：按温湿度自动投入，投入时长按月统计并纳入复盘。", {
  x: 7.15, y: 5.6, w: 5.4, h: 0.6,
  fontFace: BF, fontSize: 9, color: GRAY, lineSpacing: 13, margin: 0
});
s.render();

// ===================== 10 措施四：智能控制 =====================
s = pres.addSlide();
s.background = { color: PAPER };
kicker(s, "03 / 分项措施 · 04");
title(s, "智能控制：让四类措施自动守住边界");
footer(s, "分项措施", 10);

const ctrl = [
  ["感知", "进风 / 排风温度", "环境温湿度 · 冷凝压力", "机组电流 · 水耗"],
  ["决策", "群控控制器", "分级阈值与回差", "联锁逻辑 · 数据记录"],
  ["执行", "喷雾电磁阀组", "机组频率与台数", "告警 · 需求响应"]
];
ctrl.forEach((c, i) => {
  const x = M + i * 3.92;
  const cardC = card(s, x, 1.5, 3.66, 1.7);
  cardC.addShape(pres.shapes.RECTANGLE, {
    x: 0, y: 0, w: 3.66, h: 0.45, fill: { color: i === 1 ? INK : TEAL }, line: { width: 0 }
  });
  cardC.addText(c[0], {
    x: 0.28, y: 0.08, w: 3.1, h: 0.3,
    fontFace: BF, fontSize: 11, bold: true, color: WHITE, charSpacing: 2, margin: 0
  });
  cardC.addText(c.slice(1).join("\n"), {
    x: 0.28, y: 0.6, w: 3.1, h: 0.95,
    fontFace: BF, fontSize: 9.5, color: GRAY, lineSpacing: 16, margin: 0
  });
  if (i < 2) {
    arrow(s, x + 3.66, 2.35, x + 3.92, 2.35, TEAL, 1.75);
  }
});

const rh = (t) => ({ text: t, options: { fill: { color: INK }, color: WHITE, bold: true, fontFace: BF, fontSize: 9 } });
s.addTable([
  [rh("进风温度区间"), rh("微雾与遮阳"), rh("群控与告警")],
  ["< 35℃", "喷雾关闭；遮阳与冷屋面常态生效", "正常运行，持续记录基线数据"],
  ["35–38℃", "喷雾按 30% 占空比间歇投入", "跟踪冷凝压力趋势，不改变群控策略"],
  ["38–41℃", "喷雾 60–80% 连续投入", "限制同时运行频率，按负荷优化开机台数"],
  ["> 41℃ 或 RH > 80%", "喷雾强制关闭，防止湿翅片", "提升风机、触发告警、必要时需求响应"]
], {
  x: M, y: 3.5, w: 11.93,
  colW: [2.45, 4.3, 5.18],
  rowH: 0.5,
  border: { pt: 0.75, color: "E2E0D8" },
  fontFace: BF, fontSize: 9.5, color: INK,
  align: "left", valign: "middle",
  fill: { color: WHITE },
  margin: 0.1
});
s.addText("取值口径：进风温度取机组进风侧 1 m 处 1 min 均值，并设 0.5℃ 回差，避免临界点频繁启停。", {
  x: M, y: 6.25, w: 11.9, h: 0.3,
  fontFace: BF, fontSize: 8.5, color: GRAY, margin: 0
});
s.render();

// ===================== 11 实施路径 =====================
s = pres.addSlide();
s.background = { color: PAPER };
kicker(s, "04 / 实施与验证");
title(s, "四步走：先量、再改、后调、最后固化");
footer(s, "实施与验证", 11);

const phases = [
  ["0", "诊断实测", "2 周", ["红外热像与表面温度普查", "烟雾 / 丝线观察风场与回流", "温湿度、压力、电流连续记录"], "《基线测试报告》"],
  ["1", "基础改造", "4 周", ["遮阳结构加工与安装", "屋面清理与冷屋面施工", "避让排风口、复核检修通道"], "《隐蔽验收记录》"],
  ["2", "精细调控", "3 周", ["2–3 台机组接入微雾试点", "整定分级阈值与回差", "编制联锁与故障处理逻辑"], "《控制逻辑说明》"],
  ["3", "验证固化", "4 周", ["改造前后同工况对比测试", "KPI 评估与投资回收复核", "运维培训与作业指导书"], "《效果评估报告》"]
];
phases.forEach((p, i) => {
  const x = M + i * 3.05;
  const c = card(s, x, 1.62, 2.85, 4.0);
  c.addText(p[0], {
    x: 0.24, y: 0.18, w: 0.6, h: 0.5,
    fontFace: TF, fontSize: 24, bold: true, color: TEAL, margin: 0
  });
  c.addText(p[2], {
    x: 0.85, y: 0.28, w: 1.7, h: 0.26,
    fontFace: BF, fontSize: 9, color: GRAY, align: "right", margin: 0
  });
  c.addText(p[1], {
    x: 0.24, y: 0.72, w: 2.4, h: 0.32,
    fontFace: BF, fontSize: 13, bold: true, color: INK, margin: 0
  });
  c.addShape(pres.shapes.LINE, {
    x: 0.24, y: 1.12, w: 2.36, h: 0, line: { color: LINE, width: 0.75 }
  });
  p[3].forEach((t, j) => {
    c.addText("·  " + t, {
      x: 0.24, y: 1.3 + j * 0.66, w: 2.38, h: 0.6,
      fontFace: BF, fontSize: 8.6, color: GRAY, lineSpacing: 12, margin: 0
    });
  });
  c.addShape(pres.shapes.ROUNDED_RECTANGLE, {
    x: 0.18, y: 3.45, w: 2.49, h: 0.36, rectRadius: 0.1,
    fill: { color: i === 0 ? TEAL : TEAL_L },
    line: { color: i === 0 ? TEAL : TEAL_L, width: 0.5 }
  });
  c.addText("交付 · " + p[4].replace(/[《》]/g, ""), {
    x: 0.3, y: 3.51, w: 2.3, h: 0.24,
    fontFace: BF, fontSize: 8.2, bold: true,
    color: i === 0 ? WHITE : TEAL_D, margin: 0
  });
});

s.addText("总周期约 13 周。建议先选 2–3 台典型机组做闭环验证，确认真实温降与能耗变化后再批量复制。", {
  x: M, y: 6.05, w: 11.9, h: 0.3,
  fontFace: BF, fontSize: 9.5, color: INK, margin: 0
});
s.render();

// ===================== 12 效果验证 =====================
s = pres.addSlide();
s.background = { color: PAPER };
kicker(s, "04 / 实施与验证");
title(s, "用同一口径，量出真实收益");
footer(s, "实施与验证", 12);

const kth = (t) => ({ text: t, options: { fill: { color: INK }, color: WHITE, bold: true, fontFace: BF, fontSize: 9 } });
s.addTable([
  [kth("验证指标"), kth("基线取法"), kth("目标值（待标定）"), kth("测点与测试方法")],
  ["机组进风温度", "改造前同期 1 周均值", "气象干球 + ≤2℃", "进风侧 1 m，1 min 均值"],
  ["冷凝压力", "改造前同期均值", "−0.1 ~ 0.2 MPa", "机组高压传感器 / 压力表"],
  ["压缩机输入功率", "改造前同期均值", "−8% ~ 15%", "分项电表，钳表抽检校核"],
  ["制冷能力", "改造前同期均值", "+5% ~ 10%", "水温流量法（冷冻水侧）"],
  ["单位面积能耗", "改造前同期均值", "−6% ~ 12%", "分项计量，做度日修正"],
  ["微雾耗水量", "—", "按投入时长计量", "水表 + 控制柜运行记录"]
], {
  x: M, y: 1.55, w: 11.93,
  colW: [2.45, 3.3, 2.85, 3.33],
  rowH: 0.55,
  border: { pt: 0.75, color: "E2E0D8" },
  fontFace: BF, fontSize: 9.3, color: INK,
  align: "left", valign: "middle",
  fill: { color: WHITE },
  margin: 0.1
});

const vn = s.addShape(pres.shapes.RECTANGLE, {
  x: M, y: 5.65, w: 11.93, h: 0.92,
  fill: { color: TEAL_XL }, line: { width: 0 }
});
vn.addText("对比测试原则", {
  x: 0.35, y: 0.14, w: 1.6, h: 0.24,
  fontFace: BF, fontSize: 8.5, bold: true, color: TEAL, charSpacing: 1.2, margin: 0
});
vn.addText("同机组、同时段、同负荷率对比：优先采用改造前后各 7 天的连续数据；无法同工况时，按室外干球与负荷率做归一化修正。所有目标值在试点后按实测重新标定。", {
  x: 0.35, y: 0.42, w: 11.2, h: 0.42,
  fontFace: BF, fontSize: 9, color: TEAL_D, lineSpacing: 13, margin: 0
});
s.render();

// ===================== 13 收益结构 =====================
s = pres.addSlide();
s.background = { color: PAPER };
kicker(s, "05 / 收益与风险");
title(s, "收益不止电费：能力、能耗与可靠性");
footer(s, "收益与风险", 13);

const benefits = [
  ["能耗", "−8~15%", "压缩机输入功率在高温时段下降，按制冷季电量折算节约电费。", TEAL],
  ["能力", "+5~10%", "高温时段制冷量恢复，减少限频、降温慢与末端不达标投诉。", "2E7D8F"],
  ["可靠性", "寿命↑", "冷凝压力与排气温度下降，压缩机、变频模块负荷减轻，故障率与维保成本下降。", INK_2]
];
benefits.forEach((b, i) => {
  const x = M + i * 4.1;
  const c = card(s, x, 1.55, 3.74, 2.5);
  c.addText(b[0], {
    x: 0.3, y: 0.24, w: 2.0, h: 0.28,
    fontFace: BF, fontSize: 9, bold: true, color: b[3], charSpacing: 1.6, margin: 0
  });
  c.addText(b[1], {
    x: 0.3, y: 0.56, w: 3.1, h: 0.58,
    fontFace: TF, fontSize: 25, bold: true, color: b[3], margin: 0
  });
  c.addShape(pres.shapes.LINE, {
    x: 0.3, y: 1.25, w: 3.1, h: 0, line: { color: LINE, width: 0.75 }
  });
  c.addText(b[2], {
    x: 0.3, y: 1.38, w: 3.1, h: 0.95,
    fontFace: BF, fontSize: 9, color: GRAY, lineSpacing: 14, margin: 0
  });
});

s.addText("测算口径", {
  x: M, y: 4.35, w: 3, h: 0.28,
  fontFace: BF, fontSize: 9.5, bold: true, color: INK, margin: 0
});
const formula = s.addShape(pres.shapes.RECTANGLE, {
  x: M, y: 4.7, w: 7.7, h: 1.55,
  fill: { color: WHITE }, line: { color: LINE, width: 0.75 }
});
formula.addText([
  { text: "年节约电费  =  制冷季电量  ×  节能率  ×  电价", options: { breakLine: true } },
  { text: "静态回收期  =  改造投资  ÷  年节约电费", options: { breakLine: true } },
  { text: "需输入：电费账单、运行小时、机组台数与容量、改造报价", options: {} }
], {
  x: 0.35, y: 0.2, w: 7.0, h: 1.15,
  fontFace: BF, fontSize: 10, color: INK, lineSpacing: 22, margin: 0
});

const honest = s.addShape(pres.shapes.RECTANGLE, {
  x: 8.75, y: 4.7, w: 3.9, h: 1.55,
  fill: { color: EMBER_L }, line: { width: 0 }
});
honest.addText("评估建议", {
  x: 0.25, y: 0.16, w: 1.2, h: 0.24,
  fontFace: BF, fontSize: 8.5, bold: true, color: EMBER, charSpacing: 1.2, margin: 0
});
honest.addText("仅计电费时回收期往往偏长；应把能力恢复、停机损失与设备寿命一并纳入综合评估。", {
  x: 0.25, y: 0.45, w: 3.4, h: 0.95,
  fontFace: BF, fontSize: 8.8, color: "6B3A24", lineSpacing: 14, margin: 0
});
s.render();

// ===================== 14 风险与边界 =====================
s = pres.addSlide();
s.background = { color: PAPER };
kicker(s, "05 / 收益与风险");
title(s, "六类实施风险，提前写进方案");
footer(s, "收益与风险", 14);

const riskH = (t) => ({ text: t, options: { fill: { color: INK }, color: WHITE, bold: true, fontFace: BF, fontSize: 9 } });
s.addTable([
  [riskH("风险项"), riskH("可能后果"), riskH("应对措施")],
  ["遮阳板遮挡排风", "热风短路，进风反而更热", "板面只覆盖顶部，排风侧留足通道；安装后烟雾复测"],
  ["微雾打湿翅片", "换热恶化、翅片腐蚀", "控制粒径与距离，湿度联锁，禁止直喷换热器"],
  ["水质结垢 / 白粉", "喷嘴堵塞、外观污染", "软化或 RO 处理，定期清洗与水质检测"],
  ["反射涂层污损", "反射率逐年衰减", "选耐污自清洁材料，年度清洗并复测反射率"],
  ["屋面防水与荷载", "渗漏、结构安全风险", "优先配重或夹具固定，必要时结构复核与隐蔽验收"],
  ["控制频繁启停", "阀件与风机寿命下降", "设回差、延时与手动旁路，异常时自动退出"]
], {
  x: M, y: 1.55, w: 11.93,
  colW: [2.75, 3.75, 5.43],
  rowH: 0.58,
  border: { pt: 0.75, color: "E2E0D8" },
  fontFace: BF, fontSize: 9.3, color: INK,
  align: "left", valign: "middle",
  fill: { color: WHITE },
  margin: 0.1
});
s.addText("原则：任何一项措施，都不能以牺牲进风通路或屋面防水为代价；边界不清时宁可不做。", {
  x: M, y: 6.2, w: 11.9, h: 0.3,
  fontFace: BF, fontSize: 9.5, bold: true, color: TEAL_D, margin: 0
});
s.render();

// ===================== 15 结语 =====================
s = pres.addSlide();
s.background = { color: INK };
s.addText("下一步", {
  x: 0.95, y: 1.05, w: 4, h: 0.3,
  fontFace: BF, fontSize: 10, color: "8FB3AD", charSpacing: 2, margin: 0
});
s.addText([
  { text: "先让机组站在阴凉里，", options: { breakLine: true } },
  { text: "再谈效率。" }
], {
  x: 0.95, y: 1.5, w: 8.6, h: 1.5,
  fontFace: TF, fontSize: 34, bold: true, color: WHITE,
  lineSpacing: 48, charSpacing: 1.5, margin: 0
});
s.addShape(pres.shapes.RECTANGLE, {
  x: 0.95, y: 3.15, w: 1.1, h: 0.05, fill: { color: AMBER }, line: { width: 0 }
});

const nexts = [
  ["01", "布点实测", "用 1 周连续数据锁定基线，确认进风温升与回流路径。"],
  ["02", "试点验证", "选 2–3 台机组先做遮阳 + 冷屋面，加装微雾旁路。"],
  ["03", "标准复制", "形成做法与验收标准，按屋面分区批量推进。"]
];
nexts.forEach((n, i) => {
  const x = 0.95 + i * 4.05;
  s.addText(n[0], {
    x, y: 3.65, w: 0.6, h: 0.28,
    fontFace: TF, fontSize: 12, bold: true, color: AMBER, margin: 0
  });
  s.addText(n[1], {
    x, y: 4.0, w: 3.6, h: 0.32,
    fontFace: BF, fontSize: 14, bold: true, color: WHITE, margin: 0
  });
  s.addText(n[2], {
    x, y: 4.42, w: 3.55, h: 0.85,
    fontFace: BF, fontSize: 9.5, color: "9FB3AF", lineSpacing: 14, margin: 0
  });
  s.addShape(pres.shapes.LINE, {
    x, y: 3.55, w: 3.55, h: 0,
    line: { color: "3A5252", width: 0.75 }
  });
});

s.addText("VRV 室外机夏季高温工况换热优化方案", {
  x: 0.95, y: 6.55, w: 6.5, h: 0.26,
  fontFace: BF, fontSize: 8.5, color: "7E9491", margin: 0
});
s.addText("2026.11", {
  x: SLIDE_W - M - 1.0, y: 6.55, w: 1.0, h: 0.26,
  fontFace: BF, fontSize: 8.5, color: "7E9491", align: "right", margin: 0
});
s.render();

pres.writeFile({ fileName: "VRV室外机夏季高温工况换热优化方案.pptx" }).then((f) => {
  console.log("written:", f);
});
