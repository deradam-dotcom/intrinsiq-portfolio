import { upstreamCompaniesSchema, upstreamFundsSchema, upstreamKpisSchema } from '#schemas'
import companiesJson from './fixtures/companies.json'
import fundsJson from './fixtures/funds.json'
import kpisJson from './fixtures/kpis.json'

export const funds = upstreamFundsSchema.parse(fundsJson)

export const companies = upstreamCompaniesSchema.parse(companiesJson)

export const kpis = upstreamKpisSchema.parse(kpisJson)

export const companyIds = new Set(companies.map((company) => company.id))
