import * as XLSX from 'xlsx'

/**
 * Helper utility to export data to an Excel file.
 * @param {Array<Object>} data - The array of objects to export.
 * @param {Array<Object>} columns - Array of column definitions: { title: string, key: string } 
 * @param {string} filename - The name of the file to download (without .xlsx extension).
 */
export const exportToExcel = (data, columns, filename) => {
    // 1. Format data to match columns
    const formattedData = data.map(item => {
        const row = {}
        columns.forEach(col => {
            row[col.title] = item[col.key] !== undefined && item[col.key] !== null ? item[col.key] : '' // Handle missing values gracefully
        })
        return row
    })

    // 2. Create workbook and worksheet
    const worksheet = XLSX.utils.json_to_sheet(formattedData)
    const workbook = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Data')

    // 3. Trigger download
    XLSX.writeFile(workbook, `${filename}.xlsx`)
}

/**
 * Helper utility to read an Excel file.
 * @param {File} file - The file object from the file input.
 * @param {Array<Object>} columns - Array of column definitions: { title: string, key: string }
 * @returns {Promise<Array<Object>>} - Resolves with an array of parsed objects mapping titles back to keys.
 */
export const importFromExcel = (file, columns) => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader()
        reader.onload = (e) => {
            try {
                const data = new Uint8Array(e.target.result)
                const workbook = XLSX.read(data, { type: 'array', cellDates: true })

                const firstSheetName = workbook.SheetNames[0]
                const worksheet = workbook.Sheets[firstSheetName]

                // Convert to JSON
                const rawJson = XLSX.utils.sheet_to_json(worksheet, { defval: '' })

                // Map titles back to original keys
                const parsedData = rawJson.map(row => {
                    const parsedRow = {}
                    columns.forEach(col => {
                        const cellValue = row[col.title]
                        parsedRow[col.key] = cellValue !== undefined ? cellValue : ''
                    })
                    return parsedRow
                })

                resolve(parsedData)
            } catch (err) {
                reject(new Error('Failed to parse Excel file: ' + err.message))
            }
        }
        reader.onerror = (err) => reject(new Error('File reading error: ' + err.message))
        reader.readAsArrayBuffer(file)
    })
}

/**
 * Converts an Excel serial date to a JS Date.
 * Excel origin is nominally Dec 30, 1899.
 * @param {number} serial 
 * @returns {Date}
 */
export const excelDateToJSDate = (serial) => {
    if (typeof serial !== 'number') return null
    const utc_days = Math.floor(serial - 25569)
    const utc_value = utc_days * 86400
    const date_info = new Date(utc_value * 1000)

    // Need to adjust for local timezone offset
    const minOffset = date_info.getTimezoneOffset()
    date_info.setMinutes(date_info.getMinutes() + minOffset)
    return date_info
}

/**
 * Robustly parses various date input formats (Excel serial number, JS Date, Date string) into a JS Date object.
 * @param {any} val
 * @returns {Date|null}
 */
export const parseExcelDate = (val) => {
    if (val === undefined || val === null || val === '') return null
    if (val instanceof Date && !isNaN(val.getTime())) {
        return val
    }
    if (typeof val === 'number') {
        return excelDateToJSDate(val)
    }
    if (typeof val === 'object' && typeof val.toDate === 'function') {
        return val.toDate()
    }
    if (typeof val === 'string') {
        const trimmed = val.trim()
        if (!trimmed) return null

        if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
            const [y, m, d] = trimmed.split('-').map(Number)
            return new Date(y, m - 1, d, 12, 0, 0)
        }

        if (/^\d{1,2}[\/\.-]\d{1,2}[\/\.-]\d{4}$/.test(trimmed)) {
            const parts = trimmed.split(/[\/\.-]/).map(Number)
            let day, month, year
            if (parts[0] > 12) {
                day = parts[0]
                month = parts[1] - 1
                year = parts[2]
            } else if (parts[1] > 12) {
                month = parts[0] - 1
                day = parts[1]
                year = parts[2]
            } else {
                day = parts[0]
                month = parts[1] - 1
                year = parts[2]
            }
            const dateObj = new Date(year, month, day, 12, 0, 0)
            if (!isNaN(dateObj.getTime())) return dateObj
        }

        const dateObj = new Date(trimmed)
        if (!isNaN(dateObj.getTime())) return dateObj
    }
    return null
}
