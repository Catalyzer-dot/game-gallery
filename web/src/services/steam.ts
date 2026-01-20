export interface SteamGame {
  id: number;
  name: string;
  steamUrl: string;
  coverImage: string;
  tags: string[];
  positivePercentage: number | null;
  averagePlaytime: number | null;
}

// 使用公共 CORS 代理来绕过 Steam API 的跨域限制
const CORS_PROXY = 'https://api.allorigins.win/raw?url=';

// Steam store search API
const STEAM_SEARCH_API = 'https://store.steampowered.com/api/storesearch/';

export class SteamService {
  async search(query: string): Promise<SteamGame[]> {
    if (!query.trim()) {
      return [];
    }

    try {
      const searchUrl = `${STEAM_SEARCH_API}?term=${encodeURIComponent(query)}&l=schinese&cc=CN`;
      const proxyUrl = `${CORS_PROXY}${encodeURIComponent(searchUrl)}`;

      const response = await fetch(proxyUrl);

      if (!response.ok) {
        throw new Error(`Steam search failed: ${response.status}`);
      }

      const data = await response.json();

      if (!data.items || data.items.length === 0) {
        return [];
      }

      // 转换 Steam API 数据到我们的格式
      const games: SteamGame[] = data.items
        .filter((item: any) => item.type === 'app') // 只要游戏，不要 DLC 等
        .slice(0, 10) // 限制返回 10 个结果
        .map((item: any) => ({
          id: item.id,
          name: item.name,
          steamUrl: `https://store.steampowered.com/app/${item.id}`,
          coverImage: item.tiny_image || `https://cdn.cloudflare.steamstatic.com/steam/apps/${item.id}/capsule_sm_120.jpg`,
          tags: [], // Steam search API 不返回标签
          positivePercentage: null, // 需要额外的 API 调用来获取评价
          averagePlaytime: null, // 需要额外的 API 调用来获取游戏时长
        }));

      return games;
    } catch (error) {
      console.error('Steam search error:', error);
      throw new Error('Failed to search Steam. Please try again.');
    }
  }

  // 可选：获取游戏详情（如果需要更多信息）
  async getGameDetails(appId: number): Promise<any> {
    try {
      const detailsUrl = `https://store.steampowered.com/api/appdetails?appids=${appId}&l=schinese&cc=CN`;
      const proxyUrl = `${CORS_PROXY}${encodeURIComponent(detailsUrl)}`;

      const response = await fetch(proxyUrl);

      if (!response.ok) {
        throw new Error(`Failed to fetch game details: ${response.status}`);
      }

      const data = await response.json();

      if (!data[appId]?.success) {
        throw new Error('Game details not found');
      }

      return data[appId].data;
    } catch (error) {
      console.error('Failed to fetch game details:', error);
      return null;
    }
  }
}

export const steamService = new SteamService();
