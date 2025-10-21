import * as XLSX from 'xlsx'

export interface ExcelTemplate {
  sheets: SheetTemplate[]
  workbookProperties: any
  styles: any
}

export interface SheetTemplate {
  name: string
  data: any[][]
  merges?: XLSX.Range[]
  colWidths?: number[]
  rowHeights?: number[]
  styles?: any
}

export class ExcelTemplateAnalyzer {
  static async analyzeTemplate(filePath: string): Promise<ExcelTemplate> {
    try {
      // Read the template file
      const workbook = XLSX.readFile(filePath)
      
      const template: ExcelTemplate = {
        sheets: [],
        workbookProperties: workbook.Props,
        styles: workbook.Styles
      }

      // Analyze each sheet
      workbook.SheetNames.forEach(sheetName => {
        const worksheet = workbook.Sheets[sheetName]
        
        const sheetTemplate: SheetTemplate = {
          name: sheetName,
          data: XLSX.utils.sheet_to_json(worksheet, { header: 1, raw: false }),
          merges: worksheet['!merges'],
          colWidths: worksheet['!cols']?.map(col => col.width || 10),
          rowHeights: worksheet['!rows']?.map(row => row.height || 15)
        }
        
        template.sheets.push(sheetTemplate)
      })

      return template
    } catch (error) {
      console.error('Error analyzing Excel template:', error)
      throw error
    }
  }

  static logTemplateStructure(template: ExcelTemplate) {
    console.log('📊 Excel Template Analysis:')
    console.log('==========================')
    
    template.sheets.forEach((sheet, index) => {
      console.log(`\n📋 Sheet ${index + 1}: "${sheet.name}"`)
      console.log(`   Rows: ${sheet.data.length}`)
      console.log(`   Columns: ${sheet.data[0]?.length || 0}`)
      
      if (sheet.merges && sheet.merges.length > 0) {
        console.log(`   Merged cells: ${sheet.merges.length}`)
      }
      
      // Show first few rows for structure understanding
      console.log('   Sample data:')
      sheet.data.slice(0, 5).forEach((row, rowIndex) => {
        console.log(`     Row ${rowIndex + 1}:`, row.slice(0, 5))
      })
    })
  }
}