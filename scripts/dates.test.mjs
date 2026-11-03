import assert from "node:assert/strict"
import test from "node:test"
import { toIsoDate } from "./lib/dates.mjs"

test("publication dates retain explicit timezones across SiYuan export", () => {
  assert.equal(toIsoDate("2024-09-26T00:12:30.000Z"), "2024-09-26T00:12:30.000Z")
  assert.equal(toIsoDate("2026-09-08T01:36:10+08:00"), "2026-09-08T01:36:10+08:00")
  assert.equal(toIsoDate("2026/09/08 01:36:10"), "2026-09-08T01:36:10+08:00")
  assert.equal(toIsoDate("20260908013610"), "2026-09-08T01:36:10+08:00")
})
