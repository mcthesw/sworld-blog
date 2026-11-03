// 保留旧文显式时区；思源时间戳和旧 createTime 沿用北京时间。
export function toIsoDate(value) {
  const text = String(value)
  if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?(?:Z|[+-]\d{2}:\d{2})$/.test(text)) return text

  const compact = text.match(/^(\d{4})(\d{2})(\d{2})(\d{2})(\d{2})(\d{2})$/)
  if (compact) {
    const [, year, month, day, hour, minute, second] = compact
    return `${year}-${month}-${day}T${hour}:${minute}:${second}+08:00`
  }

  const local = text.match(/^(\d{4})[/-](\d{1,2})[/-](\d{1,2})[ T](\d{2}:\d{2}:\d{2})$/)
  if (local)
    return `${local[1]}-${local[2].padStart(2, "0")}-${local[3].padStart(2, "0")}T${local[4]}+08:00`

  throw new Error(`无法解析发布日期：${text}`)
}
