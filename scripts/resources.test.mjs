import assert from "node:assert/strict"
import { mkdtempSync, rmSync, writeFileSync } from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"
import test from "node:test"
import sharp from "sharp"
import { websiteAsset } from "./lib/resources.mjs"

test("website images shrink, preserve alpha and never alter source buffers", async () => {
  const input = await sharp({ create: { width: 3000, height: 120, channels: 4, background: "#f008" } }).png().toBuffer()
  const before = Buffer.from(input)
  const output = await websiteAsset("screenshot.png", input)
  const metadata = await sharp(output.data).metadata()
  assert.equal(metadata.format, "webp")
  assert.equal(metadata.width, 2560)
  assert.equal(metadata.hasAlpha, true)
  assert.deepEqual(input, before)
  const jpeg = await websiteAsset("screenshot.jpg", await sharp(input).jpeg().toBuffer())
  assert.notEqual(output.name, jpeg.name)
  const existing = await websiteAsset("ready.webp", output.data)
  assert.deepEqual(existing.data, output.data)
})

test("an already exported image is reused instead of re-encoded", async () => {
  const input = await sharp({ create: { width: 4, height: 4, channels: 3, background: "#fff" } }).png().toBuffer()
  const cacheDir = mkdtempSync(join(tmpdir(), "assets-"))
  const fresh = await websiteAsset("photo.png", input)
  writeFileSync(join(cacheDir, fresh.name), "cached")
  assert.equal((await websiteAsset("photo.png", input, cacheDir)).data.toString(), "cached")
  rmSync(cacheDir, { recursive: true, force: true })
})

test("exported image names are lowercase to match Quartz output", async () => {
  const input = await sharp({ create: { width: 4, height: 4, channels: 3, background: "#fff" } }).png().toBuffer()
  assert.match((await websiteAsset("20CCB71.png", input)).name, /^20ccb71-[0-9a-f]{12}\.webp$/)
})

test("animated GIF exports as animated WebP and SVG remains vector", async () => {
  const pixels = Buffer.from([255,0,0,255, 0,255,0,255])
  const gif = await sharp(pixels, { raw: { width: 1, height: 2, channels: 4, pageHeight: 1 } }).gif({ delay: [80,120], loop: 2 }).toBuffer()
  const result = await websiteAsset("animation.gif", gif)
  const metadata = await sharp(result.data, { animated: true }).metadata()
  assert.equal(metadata.pages, 2)
  assert.deepEqual(metadata.delay, [80,120])
  assert.equal(metadata.loop, 2)
  const svg = Buffer.from('<svg xmlns="http://www.w3.org/2000/svg" width="10" height="10"/>')
  assert.deepEqual((await websiteAsset("icon.svg", svg)).data, svg)
})
