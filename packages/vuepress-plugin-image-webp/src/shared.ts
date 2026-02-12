export const IMAGE_EXT_RE = /\.(png|jpe?g)$/i
export const TEXT_EXT_RE = /\.(?:html|js|css|json|xml|txt|webmanifest|map)$/i

export function toPosix(input: string): string {
  return input.replace(/\\/g, "/")
}

export function escapeSlashes(input: string): string {
  return input.replace(/\//g, "\\/")
}

export function splitResourceQuery(input: string): { pathname: string, suffix: string } {
  const index = input.search(/[?#]/)
  if (index < 0) {
    return { pathname: input, suffix: "" }
  }
  return {
    pathname: input.slice(0, index),
    suffix: input.slice(index),
  }
}

export function replaceExtWithWebp(input: string): string {
  const { pathname, suffix } = splitResourceQuery(input)
  return pathname.replace(IMAGE_EXT_RE, ".webp") + suffix
}

export function isAbsoluteOrExternalUrl(input: string): boolean {
  return (
    /^(?:[a-z]+:)?\/\//i.test(input) ||
    input.startsWith("/") ||
    input.startsWith("data:")
  )
}

function escapeRegex(input: string): string {
  return input.replace(/[.+^${}()|[\]\\]/g, "\\$&")
}

function expandBraces(pattern: string): string[] {
  const match = pattern.match(/\{([^{}]+)\}/)
  if (!match) return [pattern]

  const values = match[1].split(",").map((item) => item.trim()).filter(Boolean)
  if (!values.length) return [pattern]

  const prefix = pattern.slice(0, match.index)
  const suffix = pattern.slice((match.index ?? 0) + match[0].length)
  return values.map((value) => `${prefix}${value}${suffix}`)
}

export function globToRegExp(pattern: string): RegExp {
  const normalized = toPosix(pattern)
  let source = ""
  for (let i = 0; i < normalized.length; i += 1) {
    const char = normalized[i]
    const next = normalized[i + 1]

    if (char === "*" && next === "*") {
      source += ".*"
      i += 1
      continue
    }
    if (char === "*") {
      source += "[^/]*"
      continue
    }
    source += escapeRegex(char)
  }
  return new RegExp(`^${source}$`, "i")
}

export function compileGlobPatterns(patterns: string[]): RegExp[] {
  const expanded = patterns.flatMap((pattern) => expandBraces(pattern))
  return expanded.map((pattern) => globToRegExp(pattern))
}

export function matchesPatterns(input: string, patterns: RegExp[]): boolean {
  if (!patterns.length) return true
  return patterns.some((pattern) => pattern.test(input))
}

export function shouldHandleByPatterns(
  input: string,
  includePatterns: RegExp[],
  excludePatterns: RegExp[],
): boolean {
  const normalized = toPosix(input)
  if (!matchesPatterns(normalized, includePatterns)) return false
  if (excludePatterns.some((pattern) => pattern.test(normalized))) return false
  return true
}
