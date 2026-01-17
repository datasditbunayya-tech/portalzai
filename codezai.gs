// =====================================================
// GOOGLE APPS SCRIPT - PORTAL PENDIDIKAN BUNAYYA
// =====================================================

const SPREADSHEET_ID = SpreadsheetApp.getActiveSpreadsheet().getId();

const SHEET_NAMES = {
  STUDENT_ATTENDANCE: 'Absensi_Siswa',
  JOURNAL: 'Jurnal_Mengajar',
  MASTER_SISWA: 'Master_Siswa',
  NILAI: 'Rekap_Nilai'
};

// Inisialisasi Sheet (Jalankan sekali saja dari Editor Script)
function initializeSheets() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  
  const headers = {
    [SHEET_NAMES.STUDENT_ATTENDANCE]: ['id', 'type', 'class_name', 'student_name', 'nis', 'date', 'status', 'created_at'],
    [SHEET_NAMES.JOURNAL]: ['id', 'type', 'teacher_name', 'date', 'class_name', 'subject', 'topic', 'activity', 'notes', 'created_at'],
    [SHEET_NAMES.MASTER_SISWA]: ['id', 'type', 'nis', 'nama', 'class_name', 'created_at'],
    [SHEET_NAMES.NILAI]: ['id', 'type', 'class_name', 'student_name', 'subject', 'nilai_type', 'score', 'date', 'notes', 'created_at']
  };
  
  for (const [sheetName, headerRow] of Object.entries(headers)) {
    let sheet = ss.getSheetByName(sheetName);
    if (!sheet) {
      sheet = ss.insertSheet(sheetName);
      sheet.getRange(1, 1, 1, headerRow.length).setValues([headerRow]);
      sheet.getRange(1, 1, 1, headerRow.length).setFontWeight('bold').setBackground('#4F46E5').setFontColor('#FFFFFF');
      sheet.setFrozenRows(1);
    }
  }
  
  return { success: true, message: 'Sheets initialized successfully' };
}

// Web App Entry Point
function doGet(e) {
  return handleRequest(e);
}

function doPost(e) {
  return handleRequest(e);
}

function handleRequest(e) {
  const action = e.parameter.action || 'getAll';
  let result;
  
  try {
    switch (action) {
      case 'getAll':
        result = getAllData();
        break;
      case 'create':
        const createData = JSON.parse(e.parameter.data);
        result = createRecord(createData);
        break;
      case 'getByType':
        const type = e.parameter.type;
        result = getDataByType(type);
        break;
      default:
        result = { success: false, error: 'Unknown action' };
    }
  } catch (error) {
    result = { success: false, error: error.toString() };
  }
  
  return ContentService.createTextOutput(JSON.stringify(result))
    .setMimeType(ContentService.MimeType.JSON);
}

function getSheetByType(type) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const typeToSheet = {
    'student_attendance': SHEET_NAMES.STUDENT_ATTENDANCE,
    'journal': SHEET_NAMES.JOURNAL,
    'master_siswa': SHEET_NAMES.MASTER_SISWA,
    'nilai': SHEET_NAMES.NILAI
  };
  const sheetName = typeToSheet[type];
  if (!sheetName) return null;
  return ss.getSheetByName(sheetName);
}

function getAllData() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let allData = [];
  for (const sheetName of Object.values(SHEET_NAMES)) {
    const sheet = ss.getSheetByName(sheetName);
    if (sheet) {
      const data = sheetToJson(sheet);
      allData = allData.concat(data);
    }
  }
  return { success: true, data: allData };
}

function getDataByType(type) {
  const sheet = getSheetByType(type);
  if (!sheet) return { success: false, error: 'Sheet not found' };
  const data = sheetToJson(sheet);
  return { success: true, data: data };
}

function sheetToJson(sheet) {
  const data = sheet.getDataRange().getValues();
  if (data.length <= 1) return [];
  const headers = data[0];
  const rows = data.slice(1);
  return rows.map(row => {
    const obj = {};
    headers.forEach((header, index) => {
      obj[header] = row[index];
    });
    return obj;
  }).filter(obj => obj.id);
}

function createRecord(record) {
  const sheet = getSheetByType(record.type);
  if (!sheet) return { success: false, error: 'Sheet not found' };
  
  const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  const newRow = headers.map(header => record[header] || '');
  sheet.appendRow(newRow);
  
  return { success: true, data: record };
}

// Menu untuk Run Manual di Apps Script
function onOpen() {
  const ui = SpreadsheetApp.getUi();
  ui.createMenu('🏫 Portal Bunayya')
    .addItem('📋 Inisialisasi Sheet', 'initializeSheets')
    .addToUi();
}