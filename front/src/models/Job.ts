import { deleteCookie, getCookie, setCookie } from '@/utils/utils'

export class Job {
  data!: Map<string, string>
  filteredOutBy = new Set<string>()
  constructor(data: Map<string, string>) {
    this.data = data
  }
  toggleFavorite() {
    const favorite = getCookie('favorite')?.split(',') || []
    if (favorite.includes(this.data.get('공고번호')!)) {
      favorite.splice(favorite.indexOf(this.data.get('공고번호')!), 1)
      deleteCookie('favorite')
      setCookie('favorite', favorite.join(','), 365)
    } else {
      favorite.push(this.data.get('공고번호')!)
      deleteCookie('favorite')
      setCookie('favorite', favorite.join(','), 365)
    }
  }
  linkToExternal() {
    if (this.data.get('홈페이지')!.startsWith('http')) {
      return this.data.get('홈페이지')!
    } else {
      return 'http://' + this.data.get('홈페이지')!
    }
  }
}

export class Addr {
  시도!: string
  시군구!: string
  constructor(시도: string, 시군구: string) {
    this.시도 = 시도
    this.시군구 = 시군구
  }
}
