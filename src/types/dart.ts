export interface DartFinancialYear {
  year: string
  revenue: number
  operatingProfit: number
  netProfit: number
  cashFlow: number
}

export interface DartFinancial {
  code: string
  years: DartFinancialYear[]
}

export interface DartDisclosure {
  rcpNo: string
  rceptDt: string
  reportNm: string
  url: string
}
