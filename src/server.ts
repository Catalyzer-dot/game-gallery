import express from 'express';
import cors from 'cors';
import { Store} from './store.js';

const app = express();
const port = 3000;
const store = new Store();

app.use(cors());
app.use(express.json());

// Get all games
app.get('/api/games', (req, res) => {
  res.json({ games: store.getGames() });
});

// Add a new game
app.post('/api/games', async (req, res) => {
  const { name, status, notes, steamUrl, coverImage, tags } = req.body;
  if (!name) {
    return res.status(400).json({ error: 'Name is required' });
  }

  const game = store.addGame({
    name,
    status: status || 'to-play',
    notes,
    tags: tags || [],
    steamUrl,
    coverImage
  });

  await store.save(`Add game via web: ${name}`);
  res.status(201).json(game);
});

// Update a game
app.put('/api/games/:id', async (req, res) => {
  const { id } = req.params;
  const updates = req.body;

  const updated = store.updateGame(id as string, updates);
  if (updated) {
    await store.save(`Update game via web: ${updated.name}`);
    res.json(updated);
  } else {
    res.status(404).json({ error: 'Game not found' });
  }
});

// Remove a game
app.delete('/api/games/:id', async (req, res) => {
  const { id } = req.params;
  const removed = store.removeGame(id as string);
  if (removed) {
    await store.save(`Remove game via web: ${removed.name}`);
    res.json(removed);
  } else {
    res.status(404).json({ error: 'Game not found' });
  }
});

// Sync with Git
app.post('/api/git/sync', async (req, res) => {
  try {
    const result = await store.sync();
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: 'Git sync failed', details: (err as Error).message });
  }
});

// Search Steam games
app.get('/api/steam/search', async (req, res) => {
  const { query } = req.query;

  if (!query || typeof query !== 'string') {
    return res.status(400).json({ error: 'Query parameter is required' });
  }

  try {
    const response = await fetch(
      `https://store.steampowered.com/api/storesearch/?term=${encodeURIComponent(query)}&l=schinese&cc=CN`
    );

    if (!response.ok) {
      throw new Error('Steam API request failed');
    }

    const data = await response.json();

    const gameItems = data.items?.slice(0, 10) || [];

    // 获取每个游戏的详细信息（包括好评率）
    const gamesWithDetails = await Promise.all(
      gameItems.map(async (item: any) => {
        let positivePercentage = null;

        try {
          // 使用 Steam 评论 API 获取准确的好评率
          const reviewResponse = await fetch(
            `https://store.steampowered.com/appreviews/${item.id}?json=1&language=schinese&purchase_type=all`
          );

          if (reviewResponse.ok) {
            const reviewData = await reviewResponse.json();
            const summary = reviewData.query_summary;

            if (summary && summary.total_reviews > 0) {
              positivePercentage = Math.round((summary.total_positive / summary.total_reviews) * 100);
            }
          }
        } catch (err) {
          console.error(`Failed to fetch reviews for ${item.id}:`, err);
        }

        return {
          id: item.id,
          name: item.name,
          steamUrl: `https://store.steampowered.com/app/${item.id}/`,
          coverImage: item.tiny_image || `https://cdn.cloudflare.steamstatic.com/steam/apps/${item.id}/header.jpg`,
          tags: item.controller_support ? ['Controller Support'] : [],
          positivePercentage: positivePercentage,
          averagePlaytime: null // Steam API 不直接提供平均游玩时长
        };
      })
    );

    res.json({ games: gamesWithDetails });
  } catch (err) {
    console.error('Steam search error:', err);
    res.status(500).json({ error: 'Failed to search Steam', details: (err as Error).message });
  }
});

app.listen(port, () => {
  console.log(`Backend server running at http://localhost:${port}`);
});
