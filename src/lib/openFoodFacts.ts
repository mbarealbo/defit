export interface OFFProduct {
  name: string;
  kcal: number;
  carbs: number;
  protein: number;
  fat: number;
  brand?: string;
  quantity?: string;
}

interface OFFRawProduct {
  product_name?: string;
  brands?: string;
  quantity?: string;
  nutriments?: {
    'energy-kcal_100g'?: number;
    carbohydrates_100g?: number;
    proteins_100g?: number;
    fat_100g?: number;
  };
}

const cache = new Map<string, OFFProduct[]>();

export async function searchFoods(
  query: string,
  signal?: AbortSignal,
): Promise<OFFProduct[]> {
  if (!query || query.length < 3) return [];

  const key = query.toLowerCase().trim();
  if (cache.has(key)) return cache.get(key)!;

  const params = new URLSearchParams({
    search_terms: query,
    json: '1',
    page_size: '8',
    fields: 'product_name,brands,quantity,nutriments',
    countries_tags_en: 'italy',
  });

  const res = await fetch(
    `https://it.openfoodfacts.org/cgi/search.pl?${params}`,
    { signal },
  );

  if (!res.ok) return [];

  const data = await res.json();
  const products: OFFRawProduct[] = data.products ?? [];

  const results = products
    .filter((p) => p.product_name && p.nutriments?.['energy-kcal_100g'])
    .map((p) => ({
      name: p.product_name!,
      kcal: Math.round(p.nutriments!['energy-kcal_100g']!),
      carbs: Math.round(p.nutriments!.carbohydrates_100g ?? 0),
      protein: Math.round(p.nutriments!.proteins_100g ?? 0),
      fat: Math.round(p.nutriments!.fat_100g ?? 0),
      brand: p.brands || undefined,
      quantity: p.quantity || undefined,
    }));

  cache.set(key, results);
  return results;
}

interface NutritionItem {
  name: string;
  kcal: number;
  carbs: number;
  protein: number;
  fat: number;
}

export async function enrichItems(items: NutritionItem[]): Promise<NutritionItem[]> {
  const enriched = await Promise.all(
    items.map(async (item) => {
      try {
        const results = await searchFoods(item.name);
        if (results.length === 0) return item;
        const match = results[0];
        return { ...item, kcal: match.kcal, carbs: match.carbs, protein: match.protein, fat: match.fat };
      } catch {
        return item;
      }
    }),
  );
  return enriched;
}
