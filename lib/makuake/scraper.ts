import type { RawMakuakeProject } from "@/lib/makuake/types";

type PlaywrightBrowser = {
  newPage: (options?: Record<string, unknown>) => Promise<PlaywrightPage>;
  close: () => Promise<void>;
};

type PlaywrightPage = {
  goto: (url: string, options?: Record<string, unknown>) => Promise<unknown>;
  waitForLoadState: (state: string, options?: Record<string, unknown>) => Promise<unknown>;
  waitForTimeout: (timeout: number) => Promise<unknown>;
  evaluate: <T>(callback: () => T) => Promise<T>;
};

type PlaywrightModule = {
  chromium: {
    launch: (options?: Record<string, unknown>) => Promise<PlaywrightBrowser>;
  };
};

const LAZY_LOAD_ROUNDS = 30;
const LAZY_LOAD_WAIT_MS = 900;

export async function scrapeComingSoonProjects(sourceUrl: string) {
  const playwright = await loadPlaywright();
  const browser = await launchBrowser(playwright);

  try {
    const page = await browser.newPage({
      userAgent:
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 " +
        "MakuakeGadgetWeeklyScout/1.0 Safari/537.36",
      viewport: {
        width: 1365,
        height: 1100
      },
      locale: "ja-JP"
    });

    await page.goto(sourceUrl, {
      waitUntil: "domcontentloaded",
      timeout: 45000
    });
    await page.waitForLoadState("networkidle", { timeout: 15000 }).catch(() => null);
    await page.waitForTimeout(1500);
    await loadLazyProjectCards(page);

    return await page.evaluate<RawMakuakeProject[]>(() => {
      const anchors = uniqueBy(
        Array.from(
          document.querySelectorAll<HTMLAnchorElement>(
            'a[href*="/project/"], a[href*="/projects/"]'
          )
        ).filter((anchor) => isProjectUrl(anchor.href)),
        (anchor) => normalizeProjectUrl(anchor.href)
      );
      const projectImages = uniqueBy(
        Array.from(document.querySelectorAll<HTMLImageElement>("img")).filter((image) =>
          /\/upload\/project\/|static\.makuake\.com/.test(image.currentSrc || image.src)
        ),
        (image) => image.currentSrc || image.src
      );
      const byUrl = new Map<string, RawMakuakeProject>();

      anchors.forEach((anchor, index) => {
        const href = normalizeProjectUrl(anchor.href);

        if (!href || byUrl.has(href)) {
          return;
        }

        const container = findProjectCard(anchor);
        const text = normalizeDomText(container?.textContent ?? anchor.textContent ?? "");
        const image =
          container?.querySelector<HTMLImageElement>("img") ??
          anchor.querySelector<HTMLImageElement>("img") ??
          projectImages[index];
        const heading =
          container?.querySelector("h2,h3,h4")?.textContent ??
          findLikelyTitleFromText(text) ??
          image?.alt ??
          anchor.getAttribute("aria-label") ??
          anchor.textContent ??
          "";
        const title = normalizeDomText(heading);

        if (!isUsableTitle(title)) {
          return;
        }

        const description = normalizeDomText(text.replace(title, "")).slice(0, 260);
        const startAt =
          text.match(/20\d{2}[./年-]\s?\d{1,2}[./月-]\s?\d{1,2}(?:日)?(?:\s?\d{1,2}:\d{2})?/)?.[0] ??
          text.match(/\d{1,2}月\s?\d{1,2}日(?:\s?\d{1,2}:\d{2})?/)?.[0] ??
          "";

        byUrl.set(href, {
          sourceUrl: href,
          title,
          description,
          imageUrl: image?.currentSrc || image?.src || "",
          startAt
        });
      });

      if (byUrl.size < Math.min(anchors.length, 5)) {
        const fallbackProjects = buildProjectsFromBodyText(anchors, projectImages);

        for (const project of fallbackProjects) {
          if (!project) {
            continue;
          }

          if (!byUrl.has(project.sourceUrl)) {
            byUrl.set(project.sourceUrl, project);
          }
        }
      }

      return Array.from(byUrl.values()).filter((project) => isUsableTitle(project.title));

      function normalizeDomText(value: string) {
        return value.replace(/\s+/g, " ").trim();
      }

      function normalizeProjectUrl(value: string) {
        try {
          const url = new URL(value, location.href);

          url.hash = "";

          return url.href;
        } catch {
          return value;
        }
      }

      function isProjectUrl(value: string) {
        return /^https:\/\/www\.makuake\.com\/project\/[^/?#]+\/?/i.test(value);
      }

      function findProjectCard(anchor: HTMLAnchorElement) {
        let current: HTMLElement | null = anchor;

        while (current && current !== document.body) {
          const text = normalizeDomText(current.textContent ?? "");
          const links = Array.from(
            current.querySelectorAll<HTMLAnchorElement>('a[href*="/project/"]')
          ).filter((link) => isProjectUrl(link.href));
          const hasImage = Boolean(current.querySelector("img"));
          const looksCardSized = text.length >= 8 && text.length <= 700;

          if (hasImage && looksCardSized && links.length <= 2) {
            return current;
          }

          current = current.parentElement;
        }

        return anchor;
      }

      function findLikelyTitleFromText(text: string) {
        const cleaned = text
          .replace(/^.*推奨実行者マーク/, "")
          .replace(/^.*表示設定/, "")
          .replace(/\d+人が登録中.*$/, "")
          .trim();

        if (!cleaned) {
          return "";
        }

        return cleaned.slice(0, 110);
      }

      function buildProjectsFromBodyText(
        projectAnchors: HTMLAnchorElement[],
        images: HTMLImageElement[]
      ) {
        const bodyText = normalizeDomText(document.body.innerText ?? "");
        const counts = Array.from(bodyText.matchAll(/(\d{1,5})人が登録中/g)).map(
          (match) => match[1]
        );
        const titleSegments = bodyText
          .split(/\d{1,5}人が登録中/g)
          .slice(0, counts.length)
          .map((segment) =>
            normalizeDomText(segment)
              .replace(/^.*推奨実行者マーク/, "")
              .replace(/^.*表示設定/, "")
              .replace(/^ホームもうすぐ開始/, "")
              .trim()
          )
          .filter(Boolean);

        return titleSegments
          .map((title, index) => {
            const anchor = projectAnchors[index];
            const image = images[index];

            if (!anchor || !isUsableTitle(title)) {
              return null;
            }

            return {
              sourceUrl: normalizeProjectUrl(anchor.href),
              title,
              description: counts[index]
                ? `${counts[index]}人が開始通知に登録中。`
                : "",
              imageUrl: image?.currentSrc || image?.src || "",
              startAt: ""
            };
          })
          .filter((project): project is NonNullable<typeof project> => Boolean(project));
      }

      function isUsableTitle(title: string) {
        return Boolean(
          title &&
            title.length >= 8 &&
            title !== "もうすぐ開始" &&
            !/^(Makuake|ホーム|表示設定|ログイン|検索|もっと見る)/.test(title)
        );
      }

      function uniqueBy<T>(items: T[], keySelector: (item: T) => string) {
        const seen = new Set<string>();

        return items.filter((item) => {
          const key = keySelector(item);

          if (!key || seen.has(key)) {
            return false;
          }

          seen.add(key);

          return true;
        });
      }
    });
  } finally {
    await browser.close();
  }
}

async function loadLazyProjectCards(page: PlaywrightPage) {
  let stableRounds = 0;
  let previousProjectCount = 0;
  let previousScrollHeight = 0;

  for (let round = 0; round < LAZY_LOAD_ROUNDS; round += 1) {
    const before = await interactWithLazyPage(page);

    await page.waitForLoadState("networkidle", { timeout: 5000 }).catch(() => null);
    await page.waitForTimeout(LAZY_LOAD_WAIT_MS);

    const after = await readProjectMetrics(page);

    const madeProgress =
      after.projectCount > previousProjectCount ||
      after.scrollHeight > previousScrollHeight ||
      before.clickedMore;

    if (madeProgress) {
      stableRounds = 0;
    } else {
      stableRounds += 1;
    }

    previousProjectCount = after.projectCount;
    previousScrollHeight = after.scrollHeight;

    if (stableRounds >= 2) {
      break;
    }
  }
}

async function interactWithLazyPage(page: PlaywrightPage) {
  return page.evaluate(() => {
    const clickedMore = clickMoreButton();

    window.scrollTo(0, getDocumentHeight());

    return {
      clickedMore,
      projectCount: countProjectLinks(),
      scrollHeight: getDocumentHeight()
    };

    function clickMoreButton() {
      const candidates = Array.from(
        document.querySelectorAll<HTMLElement>('button, [role="button"]')
      );
      const moreButton = candidates.find((element) => {
        const text = normalizeText(element.textContent ?? element.getAttribute("aria-label") ?? "");
        const rect = element.getBoundingClientRect();
        const disabled =
          element.getAttribute("aria-disabled") === "true" ||
          (element instanceof HTMLButtonElement && element.disabled);

        return (
          !disabled &&
          rect.width > 0 &&
          rect.height > 0 &&
          /もっと見る|さらに表示|more|load more/i.test(text)
        );
      });

      if (!moreButton) {
        return false;
      }

      moreButton.click();

      return true;
    }

    function countProjectLinks() {
      const links = Array.from(
        document.querySelectorAll<HTMLAnchorElement>('a[href*="/project/"], a[href*="/projects/"]')
      );
      const urls = new Set(
        links
          .map((link) => normalizeProjectUrl(link.href))
          .filter((href) => /^https:\/\/www\.makuake\.com\/project\/[^/?#]+\/?/i.test(href))
      );

      return urls.size;
    }

    function getDocumentHeight() {
      return Math.max(
        document.body.scrollHeight,
        document.documentElement.scrollHeight,
        document.body.offsetHeight,
        document.documentElement.offsetHeight
      );
    }

    function normalizeText(value: string) {
      return value.replace(/\s+/g, " ").trim();
    }

    function normalizeProjectUrl(value: string) {
      try {
        const url = new URL(value, location.href);

        url.hash = "";

        return url.href;
      } catch {
        return value;
      }
    }
  });
}

async function readProjectMetrics(page: PlaywrightPage) {
  return page.evaluate(() => {
    return {
      projectCount: countProjectLinks(),
      scrollHeight: getDocumentHeight()
    };

    function countProjectLinks() {
      const links = Array.from(
        document.querySelectorAll<HTMLAnchorElement>('a[href*="/project/"], a[href*="/projects/"]')
      );
      const urls = new Set(
        links
          .map((link) => normalizeProjectUrl(link.href))
          .filter((href) => /^https:\/\/www\.makuake\.com\/project\/[^/?#]+\/?/i.test(href))
      );

      return urls.size;
    }

    function getDocumentHeight() {
      return Math.max(
        document.body.scrollHeight,
        document.documentElement.scrollHeight,
        document.body.offsetHeight,
        document.documentElement.offsetHeight
      );
    }

    function normalizeProjectUrl(value: string) {
      try {
        const url = new URL(value, location.href);

        url.hash = "";

        return url.href;
      } catch {
        return value;
      }
    }
  });
}

async function loadPlaywright() {
  try {
    const imported = await import("playwright");

    return imported as PlaywrightModule;
  } catch (error) {
    throw new Error(
      `Playwrightを読み込めませんでした。npm install playwright --save-dev --ignore-scripts を実行してください。${
        error instanceof Error ? ` 詳細: ${error.message}` : ""
      }`
    );
  }
}

async function launchBrowser(playwright: PlaywrightModule) {
  const baseOptions = {
    headless: true
  };

  try {
    return await playwright.chromium.launch({
      ...baseOptions,
      channel: process.env.MAKUAKE_BROWSER_CHANNEL || "chrome"
    });
  } catch {
    return playwright.chromium.launch(baseOptions);
  }
}
