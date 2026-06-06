// ============================================================
// RECOMP ME — Google Apps Script Backend
// Deploy as Web App: Execute as Me, Anyone can access
// ============================================================

const SHEET_NAME_MEALS     = 'Meals';
const SHEET_NAME_WORKOUTS  = 'Workouts';
const SHEET_NAME_CHECKINS  = 'Checkins';
const SHEET_NAME_GOALS     = 'Goals';
const SHEET_NAME_CHAT      = 'Chat';

function doGet(e) {
  return handleRequest(e);
}

function doPost(e) {
  return handleRequest(e);
}

function handleRequest(e) {
  try {
    const params = e.parameter;
    const action = params.action;
    const body = e.postData ? JSON.parse(e.postData.contents) : {};

    let result;

    switch(action) {
      case 'sync':       result = syncAll(body); break;
      case 'load':       result = loadAll(); break;
      case 'saveMeal':   result = saveRow(SHEET_NAME_MEALS, body); break;
      case 'delMeal':    result = deleteRow(SHEET_NAME_MEALS, body.id); break;
      case 'saveWorkout':result = saveRow(SHEET_NAME_WORKOUTS, body); break;
      case 'delWorkout': result = deleteRow(SHEET_NAME_WORKOUTS, body.id); break;
      case 'saveCheckin':result = saveRow(SHEET_NAME_CHECKINS, body); break;
      case 'saveGoals':  result = saveGoals(body); break;
      case 'saveChat':   result = saveChat(body); break;
      default: result = {error: 'Unknown action'};
    }

    return ContentService
      .createTextOutput(JSON.stringify({ok: true, data: result}))
      .setMimeType(ContentService.MimeType.JSON);

  } catch(err) {
    return ContentService
      .createTextOutput(JSON.stringify({ok: false, error: err.toString()}))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

// ── LOAD ALL ──────────────────────────────────────────────
function loadAll() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  return {
    meals:    sheetToObjects(ss, SHEET_NAME_MEALS),
    workouts: sheetToObjects(ss, SHEET_NAME_WORKOUTS),
    checkins: sheetToObjects(ss, SHEET_NAME_CHECKINS),
    goals:    loadGoals(ss),
    chat:     loadChat(ss)
  };
}

// ── SYNC ALL (full overwrite from app) ───────────────────
function syncAll(body) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  if (body.meals)    overwriteSheet(ss, SHEET_NAME_MEALS,    body.meals,    ['id','date','name','cal','pro','carb','fat','desc','time']);
  if (body.workouts) overwriteSheet(ss, SHEET_NAME_WORKOUTS, body.workouts, ['id','date','name','type','calories','duration','summary','quality','time']);
  if (body.checkins) overwriteSheet(ss, SHEET_NAME_CHECKINS, body.checkins, ['date','weight','bf','notes']);
  if (body.goals)    saveGoals(body.goals);
  if (body.chat)     saveChat(body.chat);
  return {synced: true};
}

// ── MEALS / WORKOUTS / CHECKINS ───────────────────────────
function saveRow(sheetName, row) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName(sheetName);
  if (!sheet) sheet = createSheet(ss, sheetName);
  const headers = getHeaders(sheet);
  const values = headers.map(h => row[h] !== undefined ? row[h] : '');
  // Update if exists, else append
  const id = row.id || row.date;
  const idCol = headers.indexOf('id') >= 0 ? headers.indexOf('id') : headers.indexOf('date');
  if (idCol >= 0) {
    const data = sheet.getDataRange().getValues();
    for (let i = 1; i < data.length; i++) {
      if (String(data[i][idCol]) === String(id)) {
        sheet.getRange(i+1, 1, 1, values.length).setValues([values]);
        return {updated: true};
      }
    }
  }
  sheet.appendRow(values);
  return {inserted: true};
}

function deleteRow(sheetName, id) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(sheetName);
  if (!sheet) return {deleted: false};
  const data = sheet.getDataRange().getValues();
  const headers = data[0];
  const idCol = headers.indexOf('id');
  if (idCol < 0) return {deleted: false};
  for (let i = data.length - 1; i >= 1; i--) {
    if (String(data[i][idCol]) === String(id)) {
      sheet.deleteRow(i + 1);
      return {deleted: true};
    }
  }
  return {deleted: false};
}

// ── GOALS ─────────────────────────────────────────────────
function saveGoals(goals) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName(SHEET_NAME_GOALS);
  if (!sheet) { sheet = ss.insertSheet(SHEET_NAME_GOALS); sheet.appendRow(['key','value']); }
  sheet.clearContents();
  sheet.appendRow(['key','value']);
  Object.entries(goals).forEach(([k,v]) => sheet.appendRow([k, v]));
  return {saved: true};
}

function loadGoals(ss) {
  const sheet = ss.getSheetByName(SHEET_NAME_GOALS);
  if (!sheet) return null;
  const data = sheet.getDataRange().getValues();
  const goals = {};
  for (let i = 1; i < data.length; i++) {
    if (data[i][0]) goals[data[i][0]] = isNaN(data[i][1]) ? data[i][1] : Number(data[i][1]);
  }
  return Object.keys(goals).length ? goals : null;
}

// ── CHAT ──────────────────────────────────────────────────
function saveChat(chatArr) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName(SHEET_NAME_CHAT);
  if (!sheet) { sheet = ss.insertSheet(SHEET_NAME_CHAT); }
  sheet.clearContents();
  sheet.appendRow(['role','content','timestamp']);
  (chatArr||[]).slice(-60).forEach(m => sheet.appendRow([m.role, m.content, m.timestamp||'']));
  return {saved: true};
}

function loadChat(ss) {
  const sheet = ss.getSheetByName(SHEET_NAME_CHAT);
  if (!sheet) return [];
  const data = sheet.getDataRange().getValues();
  if (data.length <= 1) return [];
  return data.slice(1).map(r => ({role:r[0], content:r[1], timestamp:r[2]})).filter(m=>m.role&&m.content);
}

// ── HELPERS ───────────────────────────────────────────────
function sheetToObjects(ss, name) {
  const sheet = ss.getSheetByName(name);
  if (!sheet || sheet.getLastRow() < 2) return {};
  const data = sheet.getDataRange().getValues();
  const headers = data[0];
  // Group by date for meals/workouts
  const result = {};
  for (let i = 1; i < data.length; i++) {
    const obj = {};
    headers.forEach((h, j) => { obj[h] = data[i][j]; });
    const date = obj.date;
    if (date) {
      if (!result[date]) result[date] = [];
      result[date].push(obj);
    }
  }
  return result;
}

function overwriteSheet(ss, name, dataObj, headers) {
  let sheet = ss.getSheetByName(name);
  if (!sheet) sheet = ss.insertSheet(name);
  sheet.clearContents();
  sheet.appendRow(headers);
  Object.values(dataObj).forEach(rows => {
    (Array.isArray(rows) ? rows : [rows]).forEach(row => {
      sheet.appendRow(headers.map(h => row[h] !== undefined ? row[h] : ''));
    });
  });
}

function getHeaders(sheet) {
  if (sheet.getLastRow() === 0) return [];
  return sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
}

function createSheet(ss, name) {
  const sheet = ss.insertSheet(name);
  const headerMap = {
    [SHEET_NAME_MEALS]:    ['id','date','name','cal','pro','carb','fat','desc','time'],
    [SHEET_NAME_WORKOUTS]: ['id','date','name','type','calories','duration','summary','quality','time'],
    [SHEET_NAME_CHECKINS]: ['date','weight','bf','notes'],
  };
  if (headerMap[name]) sheet.appendRow(headerMap[name]);
  return sheet;
}
