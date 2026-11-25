import { companies } from "./companies.ts"
import { openings } from "./openings.ts"
import type { PageConfig } from "./types.ts"

export const pages: Record<PagePath, PageConfig> = { "/openings": openings, "/companies": companies }
export type PagePath = "/openings" | "/companies"

export const isPage = (path: string): path is PagePath => path === "/openings" || path === "/companies"
