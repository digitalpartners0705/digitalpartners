/**
 * Exports data as an Excel-compatible CSV with UTF-8 BOM (\uFEFF).
 * Microsoft Excel, Google Sheets, and Numbers automatically open and format
 * this file with full character support and proper columns.
 */
export function exportToExcel(filename, headers, rows) {
  const escapeCell = (value) => {
    if (value === null || value === undefined) return '""'
    const str = String(value)
    return `"${str.replace(/"/g, '""')}"`
  }

  const headerLine = headers.map((h) => escapeCell(h.label)).join(',')
  const dataLines = rows.map((row) =>
    headers
      .map((h) => {
        const val = typeof h.getter === 'function' ? h.getter(row) : row[h.key]
        return escapeCell(val)
      })
      .join(',')
  )

  const csv = [headerLine, ...dataLines].join('\r\n')

  // \uFEFF is the UTF-8 BOM for Microsoft Excel recognition
  const blob = new Blob(['\uFEFF' + csv], {
    type: 'text/csv;charset=utf-8;',
  })

  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename.endsWith('.csv') ? filename : `${filename}.csv`
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}
