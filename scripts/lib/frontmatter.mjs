// 生成 YAML frontmatter；跳过 undefined / 空数组，字符串统一加引号避免 YAML 歧义。
export function stringifyFrontmatter(data) {
  const lines = ["---"]
  for (const [key, value] of Object.entries(data)) {
    if (value === undefined || value === null || (Array.isArray(value) && value.length === 0)) continue
    if (Array.isArray(value)) {
      lines.push(`${key}:`, ...value.map((v) => `  - ${quote(v)}`))
    } else {
      lines.push(`${key}: ${typeof value === "string" ? quote(value) : value}`)
    }
  }
  lines.push("---")
  return lines.join("\n")
}

function quote(v) {
  return typeof v === "string" ? JSON.stringify(v) : String(v)
}
