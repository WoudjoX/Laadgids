// Haalt de laatste release van open-ev-data-dataset op naar data/import/open-ev-data-<tag>.json.
// Gebruik: pnpm fetch-open-ev-data [tag]
import { promises as fs } from "node:fs";
import path from "node:path";

const REPO = "open-ev-data/open-ev-data-dataset";

async function main() {
  let tag = process.argv[2];
  if (!tag) {
    const res = await fetch(`https://api.github.com/repos/${REPO}/releases/latest`, { headers: { accept: "application/vnd.github+json" } });
    if (!res.ok) throw new Error(`GitHub API ${res.status}`);
    tag = ((await res.json()) as { tag_name: string }).tag_name;
  }
  const url = `https://github.com/${REPO}/releases/download/${tag}/open-ev-data-${tag}.json`;
  const res = await fetch(url, { redirect: "follow" });
  if (!res.ok) throw new Error(`download ${res.status} for ${url}`);
  const out = path.join(process.cwd(), "data", "import", `open-ev-data-${tag}.json`);
  await fs.mkdir(path.dirname(out), { recursive: true });
  await fs.writeFile(out, Buffer.from(await res.arrayBuffer()));
  console.log(`${tag} → ${path.relative(process.cwd(), out)}`);
  console.log(`Next: pnpm import-open-ev-data ${path.relative(process.cwd(), out)}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
