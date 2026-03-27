import { gzipSync } from "node:zlib";
import { readdirSync, readFileSync, statSync } from "node:fs";
import { resolve } from "node:path";


const distAssetsDir = resolve(process.cwd(), "dist/assets");
const bundleBudget = {
  maxJavaScriptBytes: 550 * 1024,
  maxJavaScriptGzipBytes: 180 * 1024,
  maxCssBytes: 16 * 1024,
  maxCssGzipBytes: 4 * 1024
};

function getAssetFiles(extension) {
  return readdirSync(distAssetsDir)
    .filter((fileName) => fileName.endsWith(extension))
    .map((fileName) => resolve(distAssetsDir, fileName));
}

function getLargestAsset(files) {
  return files.reduce((largestAsset, assetPath) => {
    const assetSize = statSync(assetPath).size;
    return largestAsset == null || assetSize > largestAsset.size
      ? { path: assetPath, size: assetSize, gzipSize: gzipSync(readFileSync(assetPath)).length }
      : largestAsset;
  }, null);
}

function assertBudget(asset, rawBudget, gzipBudget, label) {
  if (asset == null) {
    throw new Error(`No ${label} assets were found in dist/assets.`);
  }

  if (asset.size > rawBudget) {
    throw new Error(
      `${label} asset ${asset.path} is ${asset.size} bytes, which exceeds the ${rawBudget} byte budget.`
    );
  }

  if (asset.gzipSize > gzipBudget) {
    throw new Error(
      `${label} asset ${asset.path} is ${asset.gzipSize} gzip bytes, which exceeds the ${gzipBudget} byte budget.`
    );
  }
}

const largestJavaScriptAsset = getLargestAsset(getAssetFiles(".js"));
const largestCssAsset = getLargestAsset(getAssetFiles(".css"));

assertBudget(
  largestJavaScriptAsset,
  bundleBudget.maxJavaScriptBytes,
  bundleBudget.maxJavaScriptGzipBytes,
  "JavaScript"
);
assertBudget(largestCssAsset, bundleBudget.maxCssBytes, bundleBudget.maxCssGzipBytes, "CSS");

console.log("Bundle budgets are within the configured thresholds.");
