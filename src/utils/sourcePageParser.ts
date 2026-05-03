export interface ParsedLocalSourcePage {
  title: string;
  subtitle?: string;
  summary: string;
  imageUrl: string | null;
  facts: Array<{ label: string; value: string }>;
  sections: Array<{ title: string; paragraphs: string[] }>;
}

const SECTION_TITLE_BLACKLIST = new Set([
  "目录",
  "相关星图",
  "图库",
  "图册",
  "词条图册",
  "地图信息",
  "参考资料",
  "参考文献",
  "参见",
  "外部链接",
  "延伸阅读",
  "相关搜索",
  "旅游信息",
  "地理位置",
  "交通信息",
]);

const NOISY_TEXT_PATTERN =
  /登录|注册|进入词条|全站搜索|百度首页|百度百科|帮助|投诉|分享到微信|使用百度前必读|百科协议|隐私政策|主菜单|移至侧栏|随机条目|联络我们|关于维基百科|维基社群|最近更改|特殊页面|外观|资助维基百科|创建账号|个人工具|打印[\/／]导出|页面信息|固定链接|获取短链接|相关搜索|词条统计|突出贡献榜|版权声明/u;

function cleanText(value: string) {
  return String(value ?? "")
    .replace(/\[[^\]]*?\]/g, "")
    .replace(/\s+/g, " ")
    .replace(/\s*([，。；：！？、])/g, "$1")
    .replace(/\(\s+/g, "(")
    .replace(/\s+\)/g, ")")
    .trim();
}

function dedupeParagraphs(paragraphs: string[]) {
  return Array.from(new Set(paragraphs.map((item) => cleanText(item)).filter(Boolean)));
}

function getText(node: Element | null) {
  return cleanText(node?.textContent || "");
}

function normalizeTitle(rawTitle: string) {
  return cleanText(rawTitle)
    .replace(/_百度百科|_搜狗百科|_维基百科| - 维基百科，自由的百科全书/g, "")
    .trim();
}

function cleanSectionTitle(rawTitle: string) {
  return cleanText(rawTitle)
    .replace(/\[\s*编辑\s*\]/g, "")
    .replace(/编辑$/g, "")
    .trim();
}

function extractMeta(doc: Document, name: string) {
  return (
    doc.querySelector(`meta[property="${name}"]`)?.getAttribute("content") ||
    doc.querySelector(`meta[name="${name}"]`)?.getAttribute("content") ||
    ""
  ).trim();
}

function isMeaningfulParagraph(text: string) {
  const normalized = cleanText(text);
  if (normalized.length < 18) return false;
  if (NOISY_TEXT_PATTERN.test(normalized)) return false;
  if (/^目录/.test(normalized)) return false;
  if (/^(展开|收起|播报|编辑|讨论|收藏|分享)/.test(normalized)) return false;
  return true;
}

function isUsefulSectionTitle(title: string) {
  const normalized = cleanSectionTitle(title);
  if (!normalized) return false;
  if (SECTION_TITLE_BLACKLIST.has(normalized)) return false;
  return !NOISY_TEXT_PATTERN.test(normalized);
}

function pickBestSummary(candidateParagraphs: string[], fallbackSummary: string) {
  const candidates = dedupeParagraphs(candidateParagraphs).filter(isMeaningfulParagraph);
  if (candidates.length > 0) {
    return candidates.slice(0, 2).join(" ");
  }
  return cleanText(fallbackSummary) || "暂无可提取的本地页面摘要。";
}

function toAbsoluteAssetUrl(filePath: string, assetPath: string) {
  try {
    const current = new URL(filePath, window.location.origin);
    const resolved = new URL(assetPath, current.href);
    return resolved.href;
  } catch {
    return null;
  }
}

function extractFactsFromWiki(doc: Document) {
  const facts: Array<{ label: string; value: string }> = [];

  doc.querySelectorAll("table.infobox tr").forEach((row) => {
    const label = getText(row.querySelector("th"));
    const value = getText(row.querySelector("td"));
    if (label && value) {
      facts.push({ label, value });
    }
  });

  return facts;
}

function extractFactsFromBaike(doc: Document) {
  const facts: Array<{ label: string; value: string }> = [];

  const pairs = Array.from(doc.querySelectorAll(".basicInfo_rqB5f dt, .basicInfo_rqB5f dd"));
  for (let index = 0; index < pairs.length - 1; index += 2) {
    const label = getText(pairs[index]);
    const value = getText(pairs[index + 1]);
    if (label && value) {
      facts.push({ label, value });
    }
  }

  return facts;
}

function pushSection(
  sections: Array<{ title: string; paragraphs: string[] }>,
  title: string,
  paragraphs: string[],
) {
  const normalizedTitle = cleanSectionTitle(title);
  const normalizedParagraphs = dedupeParagraphs(paragraphs).filter(isMeaningfulParagraph).slice(0, 4);

  if (!isUsefulSectionTitle(normalizedTitle) || normalizedParagraphs.length === 0) return;

  sections.push({
    title: normalizedTitle,
    paragraphs: normalizedParagraphs,
  });
}

function collectListItems(node: Element) {
  return Array.from(node.querySelectorAll("li"))
    .map((item) => getText(item))
    .filter(isMeaningfulParagraph);
}

function extractLocalImage(doc: Document, filePath: string) {
  const candidates = [
    doc.querySelector(".abstractAlbum_IADMC img"),
    doc.querySelector("table.infobox img"),
    doc.querySelector(".infobox img"),
    doc.querySelector(".mw-file-element"),
    doc.querySelector(".summary-pic img"),
    doc.querySelector(".lemmaSummary_Ohgb5 img"),
    doc.querySelector(".mainContent_aBgKB img"),
    doc.querySelector(".main-content img"),
    doc.querySelector("img"),
  ];

  for (const candidate of candidates) {
    const src = candidate?.getAttribute("src") || "";
    if (!src) continue;
    if (/^https?:/i.test(src)) continue;
    if (/logo|unsubscribe|voice|copy_|new\.png|wikipedia-wordmark|wikipedia-tagline|WMA_button/i.test(src)) {
      continue;
    }
    const resolved = toAbsoluteAssetUrl(filePath, src);
    if (resolved) {
      return resolved;
    }
  }

  return null;
}

function isWikipediaPage(doc: Document) {
  return Boolean(doc.querySelector(".mw-parser-output"));
}

function isBaikePage(doc: Document) {
  return Boolean(doc.querySelector(".lemmaSummary_Ohgb5, .J-summary, .paraTitle_o4UVe, .basicInfo_rqB5f"));
}

function isWikiHeading(node: Element) {
  if (node.matches(".mw-heading")) return true;
  if (node.matches("h2, h3")) return true;
  return false;
}

function getWikiHeadingTitle(node: Element) {
  if (node.matches(".mw-heading")) {
    return cleanSectionTitle(getText(node.querySelector("h2, h3")) || getText(node));
  }
  return cleanSectionTitle(getText(node));
}

function parseWikipediaPage(doc: Document, filePath: string): ParsedLocalSourcePage {
  const root = doc.querySelector(".mw-parser-output");
  const summaryParagraphs: string[] = [];
  const sections: Array<{ title: string; paragraphs: string[] }> = [];

  if (root) {
    let node = root.firstElementChild;
    while (node) {
      if (isWikiHeading(node)) break;
      if (node.matches("p")) {
        const text = getText(node);
        if (isMeaningfulParagraph(text)) summaryParagraphs.push(text);
      } else if (node.matches("ul, ol")) {
        summaryParagraphs.push(...collectListItems(node));
      }
      node = node.nextElementSibling;
    }

    node = root.firstElementChild;
    while (node) {
      if (!isWikiHeading(node)) {
        node = node.nextElementSibling;
        continue;
      }

      const title = getWikiHeadingTitle(node);
      const paragraphs: string[] = [];
      let sibling = node.nextElementSibling;

      while (sibling && !isWikiHeading(sibling)) {
        if (sibling.matches("p")) {
          const text = getText(sibling);
          if (isMeaningfulParagraph(text)) paragraphs.push(text);
        } else if (sibling.matches("ul, ol")) {
          paragraphs.push(...collectListItems(sibling));
        }
        sibling = sibling.nextElementSibling;
      }

      pushSection(sections, title, paragraphs);
      node = sibling;
    }
  }

  const title =
    normalizeTitle(getText(doc.querySelector("#firstHeading")) || extractMeta(doc, "og:title") || doc.title) ||
    "建筑详细信息";

  return {
    title,
    summary: pickBestSummary(summaryParagraphs, extractMeta(doc, "description") || extractMeta(doc, "og:description")),
    imageUrl: extractLocalImage(doc, filePath),
    facts: extractFactsFromWiki(doc).slice(0, 8),
    sections: sections.slice(0, 6),
  };
}

function parseBaikePage(doc: Document, filePath: string): ParsedLocalSourcePage {
  const summaryParagraphs = dedupeParagraphs(
    Array.from(
      doc.querySelectorAll(
        ".lemmaSummary_Ohgb5 .para_efdCF, .lemmaSummary_Ohgb5 [class*='para_'], .J-summary .para_efdCF, .J-summary [class*='para_']",
      ),
    )
      .map((node) => getText(node))
      .filter(isMeaningfulParagraph),
  ).slice(0, 3);

  const sections: Array<{ title: string; paragraphs: string[] }> = [];
  const headingBlocks = Array.from(doc.querySelectorAll(".paraTitle_o4UVe"));

  headingBlocks.forEach((block) => {
    const title = getText(block.querySelector("h2, h3")) || getText(block);
    const paragraphs: string[] = [];
    let sibling = block.nextElementSibling;

    while (sibling && !sibling.matches(".paraTitle_o4UVe")) {
      if (sibling.matches(".para_efdCF, .content_f_Uak, [class*='content_f_']")) {
        const text = getText(sibling);
        if (isMeaningfulParagraph(text)) paragraphs.push(text);
      } else {
        sibling
          .querySelectorAll(".para_efdCF, [class*='content_f_']")
          .forEach((node) => {
            const text = getText(node);
            if (isMeaningfulParagraph(text)) paragraphs.push(text);
          });
      }
      sibling = sibling.nextElementSibling;
    }

    pushSection(sections, title, paragraphs);
  });

  const title =
    normalizeTitle(getText(doc.querySelector("h1.lemmaTitle_ye0Zj, h1")) || extractMeta(doc, "og:title") || doc.title) ||
    "建筑详细信息";

  const subtitle =
    cleanText(getText(doc.querySelector(".lemmaDescText_LuX_m, .lemmaDesc")) || extractMeta(doc, "keywords").split(",")[0] || "") ||
    undefined;

  return {
    title,
    subtitle: subtitle && subtitle !== title ? subtitle : undefined,
    summary: pickBestSummary(summaryParagraphs, extractMeta(doc, "description") || extractMeta(doc, "og:description")),
    imageUrl: extractLocalImage(doc, filePath),
    facts: extractFactsFromBaike(doc).slice(0, 8),
    sections: sections.slice(0, 6),
  };
}

function parseGenericPage(doc: Document, filePath: string): ParsedLocalSourcePage {
  const title = normalizeTitle(extractMeta(doc, "og:title") || doc.title) || "建筑详细信息";
  const subtitle = cleanText(extractMeta(doc, "keywords").split(",")[0] || "") || undefined;

  const paragraphCandidates = dedupeParagraphs(
    Array.from(
      doc.querySelectorAll(
        "article p, main p, .content p, .main-content p, .mainContent p, [class*='article'] p, [class*='content'] p",
      ),
    )
      .map((node) => getText(node))
      .filter(isMeaningfulParagraph),
  );

  const sections: Array<{ title: string; paragraphs: string[] }> = [];
  const headings = Array.from(doc.querySelectorAll("article h2, article h3, main h2, main h3, .content h2, .content h3"));

  headings.forEach((heading) => {
    const headingTitle = getText(heading);
    const paragraphs: string[] = [];
    let sibling = heading.nextElementSibling;
    while (sibling && !sibling.matches("h2, h3")) {
      if (sibling.matches("p")) {
        const text = getText(sibling);
        if (isMeaningfulParagraph(text)) paragraphs.push(text);
      } else if (sibling.matches("ul, ol")) {
        paragraphs.push(...collectListItems(sibling));
      }
      sibling = sibling.nextElementSibling;
    }
    pushSection(sections, headingTitle, paragraphs);
  });

  return {
    title,
    subtitle: subtitle && subtitle !== title ? subtitle : undefined,
    summary: pickBestSummary(paragraphCandidates, extractMeta(doc, "description") || extractMeta(doc, "og:description")),
    imageUrl: extractLocalImage(doc, filePath),
    facts: [],
    sections: sections.slice(0, 6),
  };
}

export function parseLocalSourcePage(html: string, filePath: string): ParsedLocalSourcePage {
  const doc = new DOMParser().parseFromString(html, "text/html");

  if (isWikipediaPage(doc)) {
    return parseWikipediaPage(doc, filePath);
  }

  if (isBaikePage(doc)) {
    return parseBaikePage(doc, filePath);
  }

  return parseGenericPage(doc, filePath);
}
