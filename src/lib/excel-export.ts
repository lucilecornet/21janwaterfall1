import * as XLSX from 'xlsx';
import {
  WaterfallResult,
  CompanySettings,
  CURRENCY_SYMBOLS,
} from '@/types';

/**
 * Format date for filename
 */
function formatDateForFilename(): string {
  const now = new Date();
  return now.toISOString().split('T')[0];
}

/**
 * Format currency symbol
 */
function getCurrencySymbol(settings: CompanySettings): string {
  return CURRENCY_SYMBOLS[settings.currency] || settings.currency;
}

/**
 * Export waterfall results to Excel
 */
export function exportToExcel(result: WaterfallResult): void {
  const { rows, settings, classes, shareholders } = result;
  const symbol = getCurrencySymbol(settings);

  // Create workbook
  const wb = XLSX.utils.book_new();

  // Sheet 1: Waterfall by Shareholder
  const waterfallData: (string | number)[][] = [];

  // Header row
  const shareholderHeaders = ['EV', 'Equity Value'];
  for (const sh of shareholders) {
    shareholderHeaders.push(sh.name);
  }
  shareholderHeaders.push('Total');
  waterfallData.push(shareholderHeaders);

  // Data rows
  for (const row of rows) {
    const dataRow: (string | number)[] = [row.ev, row.equityValue];
    let total = 0;

    for (const sh of shareholders) {
      const proceeds =
        row.shareholderProceeds.find((sp) => sp.shareholderId === sh.id)
          ?.proceeds || 0;
      dataRow.push(Math.round(proceeds * 100) / 100);
      total += proceeds;
    }

    dataRow.push(Math.round(total * 100) / 100);
    waterfallData.push(dataRow);
  }

  const ws1 = XLSX.utils.aoa_to_sheet(waterfallData);

  // Set column widths
  const colWidths = [{ wch: 15 }, { wch: 15 }];
  for (let i = 0; i < shareholders.length + 1; i++) {
    colWidths.push({ wch: 18 });
  }
  ws1['!cols'] = colWidths;

  XLSX.utils.book_append_sheet(wb, ws1, 'Waterfall by Shareholder');

  // Sheet 2: Class Summary with PPS
  const classData: (string | number)[][] = [];

  // Header row
  const classHeaders = ['EV', 'Equity Value'];
  for (const cls of classes) {
    classHeaders.push(`${cls.name} Total`);
    classHeaders.push(`${cls.name} PPS`);
  }
  classData.push(classHeaders);

  // Data rows
  for (const row of rows) {
    const dataRow: (string | number)[] = [row.ev, row.equityValue];

    for (const cls of classes) {
      const classProceeds = row.classProceeds.find(
        (cp) => cp.classId === cls.id
      );
      dataRow.push(
        Math.round((classProceeds?.totalProceeds || 0) * 100) / 100
      );
      dataRow.push(Math.round((classProceeds?.pps || 0) * 10000) / 10000);
    }

    classData.push(dataRow);
  }

  const ws2 = XLSX.utils.aoa_to_sheet(classData);

  // Set column widths
  const classColWidths = [{ wch: 15 }, { wch: 15 }];
  for (let i = 0; i < classes.length * 2; i++) {
    classColWidths.push({ wch: 18 });
  }
  ws2['!cols'] = classColWidths;

  XLSX.utils.book_append_sheet(wb, ws2, 'Class Summary');

  // Sheet 3: Inputs and Terms
  const inputsData: (string | number)[][] = [];

  // Company Settings
  inputsData.push(['Company Settings']);
  inputsData.push(['Company Name', settings.name || '(Not specified)']);
  inputsData.push(['Currency', settings.currency]);
  inputsData.push(['Cash', settings.cash]);
  inputsData.push(['Debt', settings.debt]);
  inputsData.push(['Transaction Fees', settings.fees]);
  inputsData.push(['EV Step Size', settings.evStepSize]);
  inputsData.push(['EV Maximum', settings.evMax]);
  inputsData.push([]);

  // Share Classes
  inputsData.push(['Share Class Terms']);
  inputsData.push([
    'Class Name',
    'Type',
    'Preference Type',
    'Preference Multiple',
    'Participation Cap',
    'Seniority Group',
  ]);

  for (const cls of classes) {
    inputsData.push([
      cls.name,
      cls.isCommon ? 'Common' : 'Preferred',
      cls.isCommon ? 'N/A' : cls.preferenceType,
      cls.isCommon ? 'N/A' : cls.preferenceMultiple,
      cls.participationCapMultiple !== undefined
        ? `${cls.participationCapMultiple}x`
        : 'None',
      cls.isCommon ? 'Last' : cls.seniorityGroup,
    ]);
  }
  inputsData.push([]);

  // Shareholders
  inputsData.push(['Shareholders']);
  inputsData.push([
    'Name',
    'Share Class',
    'Shares',
    `Amount Invested (${symbol})`,
  ]);

  for (const sh of shareholders) {
    const cls = classes.find((c) => c.id === sh.classId);
    inputsData.push([
      sh.name,
      cls?.name || 'Unknown',
      sh.shares,
      sh.amountInvested,
    ]);
  }

  const ws3 = XLSX.utils.aoa_to_sheet(inputsData);

  // Set column widths
  ws3['!cols'] = [
    { wch: 20 },
    { wch: 20 },
    { wch: 20 },
    { wch: 20 },
    { wch: 20 },
    { wch: 15 },
  ];

  XLSX.utils.book_append_sheet(wb, ws3, 'Inputs & Terms');

  // Generate filename
  const companyName = settings.name
    ? settings.name.replace(/[^a-zA-Z0-9]/g, '_')
    : 'Waterfall';
  const date = formatDateForFilename();
  const filename = `${companyName}_Waterfall_${date}.xlsx`;

  // Download file
  XLSX.writeFile(wb, filename);
}
