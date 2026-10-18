// Admin API for the buckle catalogue. Runs as a Vercel serverless function.
// The shopkeeper sends a password; the GitHub key stays here on the server.
// Settings (Vercel → Project → Settings → Environment Variables):
//   ADMIN_PASSWORD  the shopkeeper's password
//   GITHUB_TOKEN    fine-grained token with Contents: Read and write on the repo
//   GITHUB_OWNER / GITHUB_REPO / GITHUB_BRANCH  optional, for when the repo moves
const crypto = require("crypto");

const OWNER = process.env.GITHUB_OWNER || "itzabhi2103";
const REPO = process.env.GITHUB_REPO || "buckle-website";
const BRANCH = process.env.GITHUB_BRANCH || "main";
const DATA = "products.json";
const GROUPS = ["shoe", "sandal", "plastic", "deco", "ring", "special"];
const FINISHES = ["gold", "silver", "black", "rose", "clear", "white"];

function passwordOk(given) {
  const want = process.env.ADMIN_PASSWORD || "";
  if (!want || typeof given !== "string") return false;
  const h = s => crypto.createHash("sha256").update(s).digest();
  return crypto.timingSafeEqual(h(given), h(want));
}

async function gh(path, opts = {}) {
  const url = `https://api.github.com/repos/${OWNER}/${REPO}/contents/${path}` + (opts.method ? "" : `?ref=${BRANCH}`);
  const r = await fetch(url, {
    ...opts,
    headers: {
      Authorization: `Bearer ${process.env.GITHUB_TOKEN}`,
      Accept: "application/vnd.github+json",
      "X-GitHub-Api-Version": "2022-11-28",
      "User-Agent": "okshoe-admin",
      ...(opts.body ? { "Content-Type": "application/json" } : {}),
    },
  });
  if (!r.ok) { const e = new Error(`GitHub ${r.status}`); e.status = r.status; throw e; }
  return r.status === 204 ? null : r.json();
}

async function load() {
  const f = await gh(DATA);
  return { sha: f.sha, list: JSON.parse(Buffer.from(f.content, "base64").toString("utf8")) };
}

function save(list, sha, message) {
  const content = Buffer.from(JSON.stringify(list, null, 2) + "\n", "utf8").toString("base64");
  return gh(DATA, { method: "PUT", body: JSON.stringify({ message, content, sha, branch: BRANCH }) });
}

// Apply a change to products.json; retry once if another save landed in between
async function update(change, message) {
  for (let attempt = 0; ; attempt++) {
    const { sha, list } = await load();
    const next = change(list);
    if (next === list) return list; // nothing to save
    try { await save(next, sha, message); return next; }
    catch (e) { if (e.status !== 409 || attempt) throw e; }
  }
}

const fail = (res, status, error) => res.status(status).json({ error });

module.exports = async (req, res) => {
  res.setHeader("Cache-Control", "no-store");
  if (req.method !== "POST") return fail(res, 405, "Use POST.");
  if (!process.env.GITHUB_TOKEN || !process.env.ADMIN_PASSWORD)
    return fail(res, 500, "The admin page isn't set up yet. Add GITHUB_TOKEN and ADMIN_PASSWORD in Vercel.");
  const body = req.body || {};
  if (!passwordOk(body.password)) {
    await new Promise(r => setTimeout(r, 1000)); // slow down password guessing
    return fail(res, 401, "Wrong password.");
  }

  try {
    if (body.action === "list") {
      const { list } = await load();
      return res.json({ products: list });
    }

    if (body.action === "add") {
      const p = body.product || {};
      const code = String(p.code || "").trim().toUpperCase();
      const name = String(p.name || "").trim().slice(0, 80);
      const nameHi = String(p.name_hi || "").trim().slice(0, 80) || name;
      const size = parseInt(p.size, 10);
      const image64 = String(body.image || "");
      if (!/^[A-Z]{1,5}-\d{1,4}$/.test(code)) return fail(res, 400, "Design code should look like SBM-005.");
      if (!GROUPS.includes(p.group)) return fail(res, 400, "Choose a category.");
      if (!FINISHES.includes(p.finish)) return fail(res, 400, "Choose a finish.");
      if (!name) return fail(res, 400, "Type a name for the buckle in English.");
      if (!(size > 0 && size < 200)) return fail(res, 400, "Enter the size in mm.");
      if (!image64 || image64.length > 3_000_000 || !/^[A-Za-z0-9+/]+=*$/.test(image64))
        return fail(res, 400, "Choose a photo of the buckle (JPG or PNG, under 2 MB).");

      const { list } = await load();
      if (list.some(x => x.code === code)) return fail(res, 409, `${code} is already on the website. Use a different code.`);

      const image = `images/${code.toLowerCase()}.jpg`;
      let existing;
      try { existing = (await gh(image)).sha; } catch (e) { if (e.status !== 404) throw e; }
      await gh(image, { method: "PUT", body: JSON.stringify({ message: `Add photo for ${code}`, content: image64, branch: BRANCH, ...(existing ? { sha: existing } : {}) }) });

      const item = { code, group: p.group, name, name_hi: nameHi, size, finish: p.finish, image };
      const next = await update(l => [...l.filter(x => x.code !== code), item], `Add buckle ${code}`);
      return res.json({ products: next });
    }

    if (body.action === "remove") {
      const code = String(body.code || "").trim().toUpperCase();
      let image = null;
      const next = await update(l => {
        const it = l.find(x => x.code === code);
        if (!it) return l;
        image = it.image;
        return l.filter(x => x.code !== code);
      }, `Remove buckle ${code}`);
      if (image) {
        try {
          const f = await gh(image);
          await gh(image, { method: "DELETE", body: JSON.stringify({ message: `Remove photo for ${code}`, sha: f.sha, branch: BRANCH }) });
        } catch (e) { /* the buckle is already off the list; a leftover photo does no harm */ }
      }
      return res.json({ products: next });
    }

    return fail(res, 400, "Unknown action.");
  } catch (e) {
    const msg = e.status === 401 ? "The server's GitHub key is wrong or has expired. Update GITHUB_TOKEN in Vercel."
      : e.status === 403 || e.status === 404 ? "The server's GitHub key can't change the website. It needs Contents: Read and write on the repo."
      : "Saving failed. Try again in a minute.";
    return fail(res, 502, msg);
  }
};
