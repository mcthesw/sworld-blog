import assert from "node:assert/strict"
import { execFileSync } from "node:child_process"
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { fileURLToPath, pathToFileURL } from "node:url"
import test from "node:test"
import { parse } from "yaml"
import sharp from "sharp"
import { createHash } from "node:crypto"
const pixel = await sharp({ create: { width: 16, height: 16, channels: 4, background: "#ffaa0080" } }).png().toBuffer()
const imageName = (name) => name.replace(/\.[^.]+$/, "") + "-" + createHash("sha256").update(pixel).digest("hex").slice(0, 12) + ".webp"

// The preload mocks every CLI call; this test never connects to a real SiYuan workspace.
const mock = `import fs from "node:fs"
import cp from "node:child_process"
import { syncBuiltinESMExports } from "node:module"
const db = JSON.parse(fs.readFileSync("fixture.json", "utf8"))
const respond = (command, args) => {
  if (command !== "siyuan") throw new Error("Unexpected command")
  let result
  if (args[0] === "workspace") result = { path: process.cwd() }
  else if (args[0] === "attr" || args[0] === "block") {
    const source = args[0] === "attr" ? db.attrs : db.markdown
    result = Object.fromEntries(args[args.indexOf("--ids") + 1].split(",").filter((id) => id in source).map((id) => [id, source[id]]))
  }
  else if (args[0] === "sql") {
    const query = args[1]
    if (query.startsWith("select id, root_id")) {
      result = [...query.matchAll(/'(\\d{14}-[a-z0-9]{7})'/g)]
        .map((m) => m[1])
        .filter((id) => db.roots[id])
        .map((id) => ({ id, root_id: db.roots[id] }))
    } else if (query.includes("from refs where def_block_root_id")) {
      const targetId = query.match(/def_block_root_id = '([^']+)'/)[1]
      result = db.backlinks?.[targetId] ?? []
    } else {
      const ids = query.includes("select block_id")
        ? Object.keys(db.attrs).filter(id => db.attrs[id]["custom-publish"] === "true")
        : [...query.matchAll(/'(\\d{14}-[a-z0-9]{7})'/g)].map(m => m[1])
      result = db.docs.filter(doc => ids.includes(doc.id))
    }
  } else throw new Error("Unexpected CLI operation: " + args[0])
  return JSON.stringify(result)
}
cp.execFile = (command, args, options, done) => {
  try { done(null, respond(command, args)) } catch (error) { done(error) }
}
syncBuiltinESMExports()
`

function fixture(t) {
  const root = mkdtempSync(join(tmpdir(), "sworld-links-"))
  t.after(() => rmSync(root, { recursive: true, force: true }))
  writeFileSync(join(root, "mock.mjs"), mock)
  const ids = ["aaaaaaa", "bbbbbbb", "ccccccc", "ddddddd"].map(
    (suffix) => `20260101000000-${suffix}`,
  )
  const [a, b, privateId, blocked] = ids
  const block = "20260101000000-eeeeeee"
  const db = {
    docs: ids.map((id, i) => ({
      id,
      title: ["公开甲", "公开乙", "私人标题", "日记标题"][i],
      hpath: i === 3 ? "/daily note/日记标题" : `/笔记${i}`,
      created: "20260101000000",
      updated: "20260102000000",
    })),
    attrs: {
      [a]: {
        "custom-publish": "true",
        "custom-permalink": "/2026/01/first/",
        tags: "私人标签",
        memo: "私人备注",
      },
      [b]: { "custom-publish": "true", "custom-permalink": "/2026/01/second/" },
      [privateId]: {},
      [blocked]: { "custom-publish": "true" },
    },
    roots: { ...Object.fromEntries(ids.map((id) => [id, id])), [block]: b },
    markdown: {
      [a]: `((${block} "公开乙"))\n\n((${privateId} '私人引用文字'))\n\n[日记别名](siyuan://blocks/${blocked})`,
      [b]: `((${a} '公开甲'))`,
      [privateId]: "私人正文不应被读取",
      [blocked]: "日记正文不应被读取",
    },
  }
  const run = (...args) => {
    writeFileSync(join(root, "fixture.json"), JSON.stringify(db))
    return execFileSync(
      process.execPath,
      [
        "--import",
        pathToFileURL(join(root, "mock.mjs")).href,
        fileURLToPath(new URL("./sync-siyuan.mjs", import.meta.url)),
        ...args,
      ],
      { cwd: root, encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] },
    )
  }
  const read = (name) => readFileSync(join(root, "content/2026/01", `${name}.md`), "utf8")
  return { root, db, a, b, privateId, blocked, run, read }
}

test("sync exports only eligible documents, scrubs private references and handles withdrawal", (t) => {
  const { root, db, b, privateId, blocked, run, read } = fixture(t)
  run()
  const first = read("first")
  assert.match(first, /\[公开乙\]\(\.\.\/\.\.\/2026\/01\/second\)/)
  assert.match(read("second"), /\[公开甲\]/)
  assert.equal((first.match(/\(\.\.\/\.\.\/not-public\)/g) ?? []).length, 2)
  assert.match(first, /\[私人引用文字\]/)
  assert.match(first, /\[日记别名\]/)
  for (const secret of [
    privateId,
    blocked,
    "私人正文不应被读取",
    "日记正文不应被读取",
    "私人标签",
    "私人备注",
  ]) {
    assert.ok(!first.includes(secret), secret)
  }
  const fm = parse(first.match(/^---\n([\s\S]*?)\n---/)[1])
  assert.equal(fm.type, undefined)
  assert.equal(fm.tags, undefined)
  assert.equal(fm.description, undefined)
  assert.equal(fm.cover, undefined)

  db.docs.find((doc) => doc.id === b).title = "改过标题的公开乙"
  run()
  assert.match(read("second"), /改过标题的公开乙/)
  assert.match(read("first"), /2026\/01\/second/)

  db.attrs[b]["custom-publish"] = "false"
  run()
  assert.equal(existsSync(join(root, "content/2026/01/second.md")), false)
  assert.equal((read("first").match(/\(\.\.\/\.\.\/not-public\)/g) ?? []).length, 3)
  assert.match(read("first"), /\[公开乙\]\(\.\.\/\.\.\/not-public\)/)
})

test("explicit multi-document preview preserves mutual links without publishing or pruning", (t) => {
  const { root, db, a, b, blocked, run, read } = fixture(t)
  db.attrs[a]["custom-publish"] = "false"
  db.attrs[b]["custom-publish"] = "false"
  run("--id", a, "--id", b, "--dry-run")
  assert.equal(existsSync(join(root, "content")), false)
  mkdirSync(join(root, "content"))
  writeFileSync(join(root, "content/keep.md"), '---\nsource: "siyuan"\n---\n保留\n')
  run("--id", a, "--id", b, "--id", blocked)
  assert.match(read("first"), /\[公开乙\]/)
  assert.match(read("second"), /\[公开甲\]/)
  assert.ok(existsSync(join(root, "content/keep.md")))
  assert.equal(db.attrs[a]["custom-publish"], "false")
})

test("native title images supply covers without a duplicate body reference", (t) => {
  const { root, db, a, b, run, read } = fixture(t)
  mkdirSync(join(root, "data/assets"), { recursive: true })
  writeFileSync(join(root, "data/assets/header image.png"), pixel)
  db.attrs[a]["title-img"] =
    'background-image:url("assets/header%20image.png");object-position:center 35%'
  db.attrs[b]["title-img"] = 'background-image:url("https://example.test/cover(1).webp");'
  const metadata = (name) => parse(read(name).match(/^---\n([\s\S]*?)\n---/)[1])
  run()
  assert.equal(metadata("first").cover, "/assets/first/" + encodeURIComponent(imageName("header image.png")))
  assert.equal(
    readFileSync(join(root, "content/assets/first", imageName("header image.png"))).subarray(0, 4).toString(),
    "RIFF",
  )
  assert.equal(metadata("second").cover, "https://example.test/cover(1).webp")

  db.attrs[a]["title-img"] = "background-image:linear-gradient(white, black)"
  delete db.attrs[b]["title-img"]
  run()
  assert.equal(metadata("first").cover, undefined)
  assert.equal(metadata("second").cover, undefined)
  assert.equal(existsSync(join(root, "content/assets/first", imageName("header image.png"))), false)
})

test("preflight failures leave the complete previous output untouched", (t) => {
  const { root, db, a, b, run, read } = fixture(t)
  run()
  const before = [read("first"), read("second")]
  db.attrs[b]["custom-publish"] = "false"
  assert.throws(() => run("--id"), /argument/)
  assert.throws(() => run("--id", "20260101000000-missing"), /找不到指定文档/)
  assert.deepEqual([read("first"), read("second")], before)
  db.attrs[b]["custom-publish"] = "true"
  db.markdown[a] = "本次修改不能提前写入"
  db.markdown[b] = "![缺图](assets/missing.png)"
  for (const args of [[], ["--dry-run"]]) assert.throws(() => run(...args), /缺少资源/)
  assert.deepEqual([read("first"), read("second")], before)

  db.markdown[b] = "正文正常"
  db.attrs[b]["title-img"] = 'background-image:url("assets/missing-cover.png")'
  assert.throws(() => run(), /缺少资源/)
  assert.deepEqual([read("first"), read("second")], before)
  delete db.attrs[b]["title-img"]

  db.attrs[b]["custom-permalink"] = "/2026/01/first/"
  assert.throws(() => run(), /重复的发布路径/)
  db.attrs[b]["custom-permalink"] = "/2027/01/first/"
  assert.throws(() => run(), /文章资源目录冲突/)
  db.attrs[b]["custom-permalink"] = "/../outside/"
  assert.throws(() => run(), /不安全的相对路径/)
  assert.deepEqual([read("first"), read("second")], before)
  assert.equal(existsSync(join(root, "outside.md")), false)

  db.attrs[b]["custom-permalink"] = "/posts/"
  writeFileSync(join(root, "content/posts.md"), "手工维护的时间线")
  assert.throws(() => run(), /拒绝覆盖其他来源/)
  assert.equal(readFileSync(join(root, "content/posts.md"), "utf8"), "手工维护的时间线")
  assert.deepEqual([read("first"), read("second")], before)

  db.attrs[b]["custom-permalink"] = "/2026/01/second/"
  db.markdown[b] = "![越界资源](assets/../secret.txt)"
  assert.throws(() => run(), /不安全的相对路径/)
  assert.deepEqual([read("first"), read("second")], before)
})

test("withdrawal prunes owned assets but preserves other pages and shared references", (t) => {
  const { root, db, a, b, run } = fixture(t)
  const input = join(root, "data/assets")
  mkdirSync(join(input, "nested"), { recursive: true })
  writeFileSync(join(input, "nested/shared.png"), pixel)
  writeFileSync(join(input, "private.png"), pixel)
  db.markdown[a] += "\n\n![共同图片](assets/nested/shared.png)"
  db.markdown[b] += "\n\n![共同图片](assets/nested/shared.png)\n\n![独有图片](assets/private.png)"
  run()
  const firstImage = join(root, "content/assets/first", imageName("nested/shared.png"))
  const secondImage = join(root, "content/assets/second", imageName("nested/shared.png"))
  const privateImage = join(root, "content/assets/second", imageName("private.png"))
  assert.equal(readFileSync(firstImage).subarray(0, 4).toString(), "RIFF")
  writeFileSync(
    join(root, "content/handwritten.md"),
    `![仍在使用](/assets/second/${imageName("nested/shared.png")})`,
  )
  mkdirSync(join(root, "content/assets/unmanaged"))
  writeFileSync(join(root, "content/assets/unmanaged/keep.txt"), "不属于同步器")
  db.attrs[b]["custom-publish"] = "false"
  run("--dry-run")
  assert.ok(existsSync(privateImage))
  assert.ok(existsSync(join(root, "content/2026/01/second.md")))
  run()
  assert.equal(existsSync(privateImage), false)
  assert.equal(existsSync(join(root, "content/2026/01/second.md")), false)
  assert.ok(existsSync(firstImage))
  assert.ok(existsSync(secondImage))
  assert.ok(existsSync(join(root, "content/assets/unmanaged/keep.txt")))
})

test("asset links support definitions and leave code examples literal", (t) => {
  const { root, db, a, run, read } = fixture(t)
  mkdirSync(join(root, "data/assets"), { recursive: true })
  writeFileSync(join(root, "data/assets/image.png"), pixel)
  db.markdown[a] =
    '![引用式图片][pic]\n\n[pic]: assets/image.png "图片说明"\n\n```md\n![示例](assets/not-a-file.png)\n```'
  db.markdown[a] += "\n\n[![原图](assets/image.png)](assets/image.png)"
  run()
  const url = "../../assets/first/" + imageName("image.png")
  assert.ok(read("first").includes(`[![原图](${url})](${url})`))
  assert.ok(read("first").includes(`[pic]: ${url} "图片说明"`))
  assert.match(read("first"), /!\[示例\]\(assets\/not-a-file.png\)/)
  assert.ok(existsSync(join(root, "content/assets/first", imageName("image.png"))))
})

test("featured flag and backlink collection extract only cited blocks from daily notes", (t) => {
  const { root, db, a, b, privateId, run, read } = fixture(t)
  db.attrs[a]["custom-featured"] = "true"
  db.attrs[b]["custom-backlinks"] = "true"
  const itemBlock = "20260103120000-item001"
  const paraBlock = "20260103120001-para001"
  db.backlinks = {
    [b]: [
      {
        id: paraBlock,
        parent_id: itemBlock,
        type: "p",
        created: "20260103120001",
        parent_type: "i",
        parent_created: "20260103120000",
      },
      { id: "20260103120002-para003", root_id: a, parent_id: a, type: "p", created: "20260103120002", parent_type: "d" },
    ],
  }
  db.markdown["20260103120002-para003"] = `相关：((${b} "公开乙"))`
  db.markdown[itemBlock] =
    `* ((${b} "随记"))：读《((${privateId} "未公开作品"))》，联想到 ((${a} "公开甲"))\n  第二行感想`
  run()
  const fmFirst = parse(read("first").match(/^---\n([\s\S]*?)\n---/)[1])
  assert.equal(fmFirst.featured, true)
  const second = read("second")
  assert.match(second, /### 2026-01-03/)
  assert.match(second, /读《\[未公开作品\]\(\.\.\/\.\.\/not-public\)》，联想到 \[公开甲\]\(\.\.\/\.\.\/2026\/01\/first\)/)
  assert.match(second, /第二行感想/)
  assert.ok(!second.includes("日记正文不应被读取"))
  assert.ok(!second.includes("相关"))
  assert.ok(!second.includes(b + ' "随记"'))
})

test("backlink entry keeps child items and uses the daily note date", (t) => {
  const { db, b, run, read } = fixture(t)
  db.attrs[b]["custom-backlinks"] = "true"
  const itemBlock = "20261104120000-item002"
  db.backlinks = {
    [b]: [
      {
        id: "20261104120001-para002",
        parent_id: itemBlock,
        type: "p",
        created: "20261104120001",
        parent_type: "i",
        parent_created: "20261104120000",
        dailynote: "20260104",
      },
    ],
  }
  db.markdown[itemBlock] = [
    `- {: id="${itemBlock}"}((${b} '阅读随记'))`,
    `  {: id="20260104120001-para002"}`,
    ``,
    `  - {: id="20260104120002-chld001"}今天的1`,
    `    {: id="20260104120002-chld0p1"}`,
    `    - {: id="20260104120005-gchd001"}细节`,
    `      {: id="20260104120005-gchd0p1"}`,
    `    {: id="20260104120005-list002"}`,
    `  - {: id="20260104120003-chld002"}2`,
    `    {: id="20260104120003-chld0p2"}`,
    `  {: id="20260104120004-list001"}`,
  ].join("\n")
  run()
  const entry = read("second").split("### 2026-01-04")[1]
  assert.equal(entry.trim(), "- 今天的1\n  - 细节\n- 2")
})
