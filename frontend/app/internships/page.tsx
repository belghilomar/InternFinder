import { InternshipsClient } from './internships-client'

type PageSearchParams = Promise<{
  keyword?: string | string[]
  location?: string | string[]
  type?: string | string[]
  domain?: string | string[]
}>

function toList(value?: string | string[]) {
  if (Array.isArray(value)) {
    return value.filter(Boolean)
  }

  return value ? [value] : []
}

function toValue(value?: string | string[]) {
  return Array.isArray(value) ? value[0] ?? '' : value ?? ''
}

export default async function InternshipsPage({
  searchParams,
}: {
  searchParams: PageSearchParams
}) {
  const resolvedSearchParams = await searchParams

  return (
    <InternshipsClient
      initialKeyword={toValue(resolvedSearchParams.keyword)}
      initialTypes={toList(resolvedSearchParams.type)}
      initialDomains={toList(resolvedSearchParams.domain)}
      initialLocations={toList(resolvedSearchParams.location)}
    />
  )
}
