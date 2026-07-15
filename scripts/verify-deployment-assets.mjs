import { exit } from "node:process";

function usage() {
  console.log(
    [
      "Usage:",
      "  node scripts/verify-deployment-assets.mjs <baseUrl> <path1> [path2 ...]",
      "",
      "Examples:",
      "  node scripts/verify-deployment-assets.mjs https://crm.aeriavoyages.com /signin /bookings",
      "  node scripts/verify-deployment-assets.mjs http://127.0.0.1:3000 /signin",
    ].join("\n"),
  );
}

function resolveUrl(baseUrl, value) {
  try {
    return new URL(value).toString();
  } catch {
    return new URL(value, baseUrl).toString();
  }
}

function unique(values) {
  return [...new Set(values)];
}

function extractAssetUrls(html) {
  const urls = [];
  const patterns = [/<script[^>]+src="([^"]+)"/g, /<link[^>]+href="([^"]+)"/g];

  for (const pattern of patterns) {
    for (const match of html.matchAll(pattern)) {
      const value = match[1];
      if (
        value.startsWith("/_next/") ||
        value.startsWith("/images/") ||
        value.startsWith("/favicon") ||
        value.startsWith("/apple-") ||
        value.startsWith("/icon")
      ) {
        urls.push(value);
      }
    }
  }

  return unique(urls);
}

async function checkUrl(url) {
  const cookie = process.env.CHECK_COOKIE || "";
  const response = await fetch(url, {
    redirect: "manual",
    headers: {
      "user-agent": "aeria-crm-deployment-check/1.0",
      ...(cookie ? { cookie } : {}),
    },
  });

  return {
    status: response.status,
    ok: response.ok,
    contentType: response.headers.get("content-type") ?? "",
    location: response.headers.get("location") ?? "",
  };
}

async function main() {
  const [baseUrlRaw, ...paths] = process.argv.slice(2);
  const baseUrl = process.env.CHECK_BASE_URL || baseUrlRaw;

  if (!baseUrl || paths.length === 0) {
    usage();
    exit(1);
  }

  let failures = 0;

  for (const path of paths) {
    const pageUrl = resolveUrl(baseUrl, path);
    const pageCheck = await checkUrl(pageUrl);

    if (!pageCheck.ok) {
      failures += 1;
      console.error(
        `[FAIL] ${pageUrl} -> HTTP ${pageCheck.status}${pageCheck.location ? ` (${pageCheck.location})` : ""}`,
      );
      continue;
    }

    const html = await (await fetch(pageUrl)).text();
    const assetUrls = extractAssetUrls(html);
    const pageAssets = assetUrls.filter(
      (asset) =>
        asset.includes("/_next/") ||
        asset.startsWith("/images/") ||
        asset.startsWith("/favicon") ||
        asset.startsWith("/apple-") ||
        asset.startsWith("/icon"),
    );

    console.log(`[OK] ${pageUrl} -> HTML ${pageCheck.status}, assets: ${pageAssets.length}`);

    for (const asset of pageAssets) {
      const assetUrl = resolveUrl(baseUrl, asset);
      const assetCheck = await checkUrl(assetUrl);
      if (!assetCheck.ok) {
        failures += 1;
        console.error(
          `[FAIL] ${assetUrl} -> HTTP ${assetCheck.status}${assetCheck.location ? ` (${assetCheck.location})` : ""}`,
        );
      }
    }
  }

  if (failures > 0) {
    console.error(`Deployment asset check failed (${failures} error${failures > 1 ? "s" : ""}).`);
    exit(1);
  }

  console.log("Deployment asset check passed.");
}

main().catch((error) => {
  console.error(error);
  exit(1);
});
