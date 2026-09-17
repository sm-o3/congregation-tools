import JSZip from 'jszip'
import { saveAs } from 'file-saver'

/**
 * Generate and download a populated S-13 (.docx) file based on public/S-13_E.docx
 * 
 * @param {string|number} serviceYear - The service year, e.g. 2026
 * @param {Array} populatedRows - Array of { number, name, lastCompleted, slot1, slot2, slot3, slot4 }
 */
export async function downloadPopulatedS13Docx(serviceYear, populatedRows) {
  try {
    const response = await fetch('/S-13_E.docx')
    if (!response.ok) {
      throw new Error(`Failed to fetch /S-13_E.docx: ${response.statusText}`)
    }
    const arrayBuffer = await response.arrayBuffer()
    const zip = await JSZip.loadAsync(arrayBuffer)
    const docXmlString = await zip.file('word/document.xml').async('string')

    const parser = new DOMParser()
    const xmlDoc = parser.parseFromString(docXmlString, 'application/xml')
    const W_NS = 'http://schemas.openxmlformats.org/wordprocessingml/2006/main'

    function setParagraphText(pElem, text) {
      if (!pElem) return
      // Remove existing <w:r> children if present
      const existingR = Array.from(pElem.getElementsByTagNameNS(W_NS, 'r'))
      existingR.forEach(r => pElem.removeChild(r))

      if (text === undefined || text === null || text === '') return

      const rElem = xmlDoc.createElementNS(W_NS, 'w:r')
      const rPrElem = xmlDoc.createElementNS(W_NS, 'w:rPr')
      const szElem = xmlDoc.createElementNS(W_NS, 'w:sz')
      szElem.setAttributeNS(W_NS, 'w:val', '18') // 9pt font
      rPrElem.appendChild(szElem)
      rElem.appendChild(rPrElem)

      const tElem = xmlDoc.createElementNS(W_NS, 'w:t')
      tElem.textContent = String(text)
      rElem.appendChild(tElem)
      pElem.appendChild(rElem)
    }

    const tables = xmlDoc.getElementsByTagNameNS(W_NS, 'tbl')

    // Table 0: Service Year
    if (tables.length > 0) {
      const t0 = tables[0]
      const t0Cells = t0.getElementsByTagNameNS(W_NS, 'tc')
      if (t0Cells.length > 1) {
        const p = t0Cells[1].getElementsByTagNameNS(W_NS, 'p')[0]
        setParagraphText(p, String(serviceYear || ''))
      }
    }

    // Table 1: Main S-13 Grid
    if (tables.length > 1) {
      const t1 = tables[1]
      let rows = Array.from(t1.getElementsByTagNameNS(W_NS, 'tr'))

      const templateRowTop = rows[2]
      const templateRowBottom = rows[3]
      const currentCapacity = Math.max(0, Math.floor((rows.length - 2) / 2))

      // If more rows needed than 20, duplicate template pairs
      if (populatedRows.length > currentCapacity && templateRowTop && templateRowBottom) {
        for (let i = currentCapacity; i < populatedRows.length; i++) {
          const cloneTop = templateRowTop.cloneNode(true)
          const cloneBottom = templateRowBottom.cloneNode(true)
          t1.appendChild(cloneTop)
          t1.appendChild(cloneBottom)
        }
      }

      // Re-fetch all rows
      rows = Array.from(t1.getElementsByTagNameNS(W_NS, 'tr'))

      populatedRows.forEach((item, index) => {
        const topIdx = 2 + index * 2
        const botIdx = 3 + index * 2
        if (topIdx >= rows.length || botIdx >= rows.length) return

        const topRow = rows[topIdx]
        const botRow = rows[botIdx]

        const topCells = Array.from(topRow.getElementsByTagNameNS(W_NS, 'tc'))
        const botCells = Array.from(botRow.getElementsByTagNameNS(W_NS, 'tc'))

        // Top Row: Terr.no (0), Last date completed (1), Slot1 Pub (2), Slot2 Pub (3), Slot3 Pub (4), Slot4 Pub (5)
        if (topCells[0]) setParagraphText(topCells[0].getElementsByTagNameNS(W_NS, 'p')[0], item.number || '')
        if (topCells[1]) setParagraphText(topCells[1].getElementsByTagNameNS(W_NS, 'p')[0], item.lastCompleted || '')
        if (topCells[2]) setParagraphText(topCells[2].getElementsByTagNameNS(W_NS, 'p')[0], item.slot1?.assignedTo || '')
        if (topCells[3]) setParagraphText(topCells[3].getElementsByTagNameNS(W_NS, 'p')[0], item.slot2?.assignedTo || '')
        if (topCells[4]) setParagraphText(topCells[4].getElementsByTagNameNS(W_NS, 'p')[0], item.slot3?.assignedTo || '')
        if (topCells[5]) setParagraphText(topCells[5].getElementsByTagNameNS(W_NS, 'p')[0], item.slot4?.assignedTo || '')

        // Bottom Row: Date assigned & Date completed for slots 1-4
        // botCells: [0, 1] are merged, [2, 3] = slot 1, [4, 5] = slot 2, [6, 7] = slot 3, [8, 9] = slot 4
        if (botCells[2]) setParagraphText(botCells[2].getElementsByTagNameNS(W_NS, 'p')[0], item.slot1?.dateAssigned || '')
        if (botCells[3]) setParagraphText(botCells[3].getElementsByTagNameNS(W_NS, 'p')[0], item.slot1?.dateCompleted || '')
        if (botCells[4]) setParagraphText(botCells[4].getElementsByTagNameNS(W_NS, 'p')[0], item.slot2?.dateAssigned || '')
        if (botCells[5]) setParagraphText(botCells[5].getElementsByTagNameNS(W_NS, 'p')[0], item.slot2?.dateCompleted || '')
        if (botCells[6]) setParagraphText(botCells[6].getElementsByTagNameNS(W_NS, 'p')[0], item.slot3?.dateAssigned || '')
        if (botCells[7]) setParagraphText(botCells[7].getElementsByTagNameNS(W_NS, 'p')[0], item.slot3?.dateCompleted || '')
        if (botCells[8]) setParagraphText(botCells[8].getElementsByTagNameNS(W_NS, 'p')[0], item.slot4?.dateAssigned || '')
        if (botCells[9]) setParagraphText(botCells[9].getElementsByTagNameNS(W_NS, 'p')[0], item.slot4?.dateCompleted || '')
      })
    }

    const serializer = new XMLSerializer()
    const newDocXml = serializer.serializeToString(xmlDoc)
    zip.file('word/document.xml', newDocXml)

    const blob = await zip.generateAsync({
      type: 'blob',
      mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    })

    saveAs(blob, `S-13_Territory_Record_${serviceYear}.docx`)
    return true
  } catch (err) {
    console.error('Error generating S-13 DOCX:', err)
    throw err
  }
}

/**
 * Parse an already-filled S-13 (.docx) file and extract service year, territories, and assignments.
 * 
 * @param {File|Blob|ArrayBuffer} fileInput
 * @returns {Promise<{ serviceYear: string, territories: Array<{ number: string, lastCompleted: string }>, assignments: Array<{ terrNo: string, seq: number, assignedTo: string, dateAssigned: string, dateCompleted: string, lastCompletedBefore: string, serviceYear: string }> }>}
 */
export async function parseFilledS13Docx(fileInput) {
  try {
    let arrayBuffer
    if (fileInput instanceof ArrayBuffer) {
      arrayBuffer = fileInput
    } else if (fileInput && typeof fileInput.arrayBuffer === 'function') {
      arrayBuffer = await fileInput.arrayBuffer()
    } else {
      throw new Error('Unsupported file input type')
    }

    const zip = await JSZip.loadAsync(arrayBuffer)
    const docXmlFile = zip.file('word/document.xml')
    if (!docXmlFile) {
      throw new Error('Invalid DOCX: word/document.xml not found')
    }

    const docXmlString = await docXmlFile.async('string')
    const parser = new DOMParser()
    const xmlDoc = parser.parseFromString(docXmlString, 'application/xml')
    const W_NS = 'http://schemas.openxmlformats.org/wordprocessingml/2006/main'

    function getCellText(tcElem) {
      if (!tcElem) return ''
      return tcElem.textContent ? tcElem.textContent.trim() : ''
    }

    const tables = xmlDoc.getElementsByTagNameNS(W_NS, 'tbl')
    if (tables.length === 0) {
      throw new Error('No tables found in document')
    }

    // 1. Service Year (from Table 0)
    let serviceYear = ''
    if (tables.length > 0) {
      const t0 = tables[0]
      const cells = Array.from(t0.getElementsByTagNameNS(W_NS, 'tc'))
      for (const cell of cells) {
        const txt = getCellText(cell)
        // First look for range format like "2026-2027" or "2026 - 2027"
        const matchRange = txt.match(/\b(20\d{2})\s*[-/]\s*(20\d{2})\b/)
        if (matchRange) {
          serviceYear = `${matchRange[1]}-${matchRange[2]}`
          break
        }
        // Fallback to 4-digit year
        const match = txt.match(/\b(20\d{2})\b/)
        if (match) {
          const y = parseInt(match[1], 10)
          serviceYear = `${y}-${y + 1}`
          break
        }
      }
    }

    if (!serviceYear) {
      const now = new Date()
      const y = now.getFullYear()
      const m = now.getMonth() + 1
      const startYear = m >= 9 ? y : y - 1
      serviceYear = `${startYear}-${startYear + 1}`
    }

    // 2. Table 1 (Territory Records)
    const t1 = tables.length > 1 ? tables[1] : tables[0]
    const rows = Array.from(t1.getElementsByTagNameNS(W_NS, 'tr'))

    const territories = []
    const assignments = []

    // Skip the 2 header rows
    for (let i = 2; i + 1 < rows.length; i += 2) {
      const topRow = rows[i]
      const botRow = rows[i + 1]

      const topCells = Array.from(topRow.getElementsByTagNameNS(W_NS, 'tc'))
      const botCells = Array.from(botRow.getElementsByTagNameNS(W_NS, 'tc'))

      if (topCells.length < 2) continue

      const rawTerrNo = getCellText(topCells[0])
      if (!rawTerrNo) continue

      const terrNo = rawTerrNo.replace(/^#/, '').trim()
      if (!terrNo) continue

      const lastCompleted = getCellText(topCells[1])

      territories.push({
        number: terrNo,
        lastCompleted: lastCompleted || ''
      })

      const slotConfigs = [
        { pubIdx: 2, assIdx: 2, compIdx: 3 },
        { pubIdx: 3, assIdx: 4, compIdx: 5 },
        { pubIdx: 4, assIdx: 6, compIdx: 7 },
        { pubIdx: 5, assIdx: 8, compIdx: 9 }
      ]

      slotConfigs.forEach((cfg, idx) => {
        const assignedTo = topCells[cfg.pubIdx] ? getCellText(topCells[cfg.pubIdx]) : ''
        const dateAssigned = botCells[cfg.assIdx] ? getCellText(botCells[cfg.assIdx]) : ''
        const dateCompleted = botCells[cfg.compIdx] ? getCellText(botCells[cfg.compIdx]) : ''

        if (assignedTo || dateAssigned || dateCompleted) {
          assignments.push({
            terrNo,
            seq: idx + 1,
            assignedTo: assignedTo || 'Unassigned',
            dateAssigned: dateAssigned || '',
            dateCompleted: dateCompleted || '',
            lastCompletedBefore: lastCompleted || '',
            serviceYear
          })
        }
      })
    }

    return {
      serviceYear,
      territories,
      assignments
    }
  } catch (err) {
    console.error('Error parsing S-13 DOCX:', err)
    throw err
  }
}

