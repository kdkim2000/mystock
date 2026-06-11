import 'server-only'
import { google } from 'googleapis'
import { env } from './env'

function getAuth() {
  if (env.GOOGLE_SERVICE_ACCOUNT_JSON) {
    return new google.auth.GoogleAuth({
      credentials: JSON.parse(env.GOOGLE_SERVICE_ACCOUNT_JSON),
      scopes: ['https://www.googleapis.com/auth/spreadsheets'],
    })
  }
  return new google.auth.GoogleAuth({
    keyFile: env.GOOGLE_APPLICATION_CREDENTIALS,
    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
  })
}

async function getSheets() {
  const auth = getAuth()
  const client = await auth.getClient()
  return google.sheets({ version: 'v4', auth: client as never })
}

export async function readSheet(range: string): Promise<string[][]> {
  const sheets = await getSheets()
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: env.GOOGLE_SPREADSHEET_ID,
    range,
    // UNFORMATTED_VALUE: 숫자를 "35,400"이 아닌 35400으로 반환 (천 단위 구분자 제거)
    // FORMATTED_STRING: 날짜 셀은 서식 문자열로 반환 (시리얼 번호 방지)
    valueRenderOption: 'UNFORMATTED_VALUE',
    dateTimeRenderOption: 'FORMATTED_STRING',
  })
  const values = res.data.values ?? []
  return values.map(row =>
    row.map(cell => (cell === null || cell === undefined ? '' : String(cell)))
  )
}

export async function writeSheet(range: string, values: string[][]): Promise<void> {
  const sheets = await getSheets()
  await sheets.spreadsheets.values.update({
    spreadsheetId: env.GOOGLE_SPREADSHEET_ID,
    range,
    valueInputOption: 'RAW',
    requestBody: { values },
  })
}

export async function appendToSheet(range: string, values: string[][]): Promise<void> {
  const sheets = await getSheets()
  await sheets.spreadsheets.values.append({
    spreadsheetId: env.GOOGLE_SPREADSHEET_ID,
    range,
    valueInputOption: 'RAW',
    insertDataOption: 'INSERT_ROWS',
    requestBody: { values },
  })
}
