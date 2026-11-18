import { resolvePlaceImage } from '../data/mockPlaces';
import type { PlaceWithReports } from '../types/database';

export interface OfflineDistrictConfig {
  id: string;
  title: string;
  subtitle: string;
  matchedDistricts: string[];
  estimatedSizeMb: number;
}

export const OFFLINE_DISTRICTS: OfflineDistrictConfig[] = [
  {
    id: 'russky-suburbs',
    title: 'о. Русский и пригород',
    subtitle: 'Мыс Тобизина, Мыс Вятлина, Бухта Стеклянная, Остров Шкота, Ворошиловская батарея',
    matchedDistricts: ['о. Русский', 'Владивосток'],
    estimatedSizeMb: 4.2,
  },
  {
    id: 'khasan',
    title: 'Хасанский район',
    subtitle: 'Кравцовские водопады, Полуостров Гамова, Бухта Теляковского, Бухта Астафьева',
    matchedDistricts: ['Хасанский район'],
    estimatedSizeMb: 3.6,
  },
  {
    id: 'shkotovo',
    title: 'Шкотовский район',
    subtitle: 'Гора Пидан (Ливадийская), Водопад Неожиданный (Горбатый)',
    matchedDistricts: ['Шкотовский район'],
    estimatedSizeMb: 2.8,
  },
  {
    id: 'nakhodka-livadia',
    title: 'Находка и Ливадия',
    subtitle: 'Бухта Триозёрье и восточное побережье до Мыса Четырёх Скал',
    matchedDistricts: ['Находкинский городской округ', 'Ольгинский район'],
    estimatedSizeMb: 3.4,
  },
];

export interface SavedOfflinePackage {
  districtId: string;
  title: string;
  downloadedAt: string;
  sizeMb: number;
  places: PlaceWithReports[];
}

const PACKAGES_STORAGE_KEY = 'primtrop_offline_packages_v1';
const SNAPSHOT_STORAGE_KEY = 'primtrop_cached_places_snapshot_v1';

export function getPlacesForDistrict(
  allPlaces: PlaceWithReports[],
  district: OfflineDistrictConfig
): PlaceWithReports[] {
  return allPlaces.filter((place) => district.matchedDistricts.includes(place.district));
}

export function loadSavedOfflinePackages(): Record<string, SavedOfflinePackage> {
  try {
    const raw = localStorage.getItem(PACKAGES_STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === 'object' ? (parsed as Record<string, SavedOfflinePackage>) : {};
  } catch {
    return {};
  }
}

export function saveOfflineDistrictPackage(
  district: OfflineDistrictConfig,
  allPlaces: PlaceWithReports[]
): SavedOfflinePackage {
  const districtPlaces = getPlacesForDistrict(allPlaces, district);
  const pkg: SavedOfflinePackage = {
    districtId: district.id,
    title: district.title,
    downloadedAt: new Date().toISOString(),
    sizeMb: district.estimatedSizeMb,
    places: districtPlaces,
  };

  const existing = loadSavedOfflinePackages();
  existing[district.id] = pkg;

  try {
    localStorage.setItem(PACKAGES_STORAGE_KEY, JSON.stringify(existing));
  } catch {
    // Ignore quota errors in restricted storage
  }

  // Также пробуем закешировать изображения карточек через Cache API для работы без сети
  if (typeof caches !== 'undefined') {
    caches
      .open('primtrop-offline-images-v1')
      .then((cache) => {
        const urls = Array.from(new Set(districtPlaces.map((p) => resolvePlaceImage(p))));
        return Promise.allSettled(urls.map((url) => cache.add(url)));
      })
      .catch(() => {
        // Cache API optional
      });
  }

  return pkg;
}

export function removeOfflineDistrictPackage(districtId: string): Record<string, SavedOfflinePackage> {
  const existing = loadSavedOfflinePackages();
  delete existing[districtId];
  try {
    localStorage.setItem(PACKAGES_STORAGE_KEY, JSON.stringify(existing));
  } catch {
    // Ignore storage errors
  }
  return existing;
}

export function savePlacesSnapshot(places: PlaceWithReports[]): void {
  try {
    localStorage.setItem(SNAPSHOT_STORAGE_KEY, JSON.stringify(places));
  } catch {
    // Ignore quota errors
  }
}

export function loadCachedPlacesForOffline(): PlaceWithReports[] | null {
  const packages = Object.values(loadSavedOfflinePackages());
  const byId = new Map<string, PlaceWithReports>();

  // 1. Сначала берём последний общий кэш приложения, если он есть
  try {
    const rawSnapshot = localStorage.getItem(SNAPSHOT_STORAGE_KEY);
    if (rawSnapshot) {
      const parsed = JSON.parse(rawSnapshot);
      if (Array.isArray(parsed)) {
        for (const p of parsed as PlaceWithReports[]) {
          byId.set(p.id, p);
        }
      }
    }
  } catch {
    // Ignore malformed snapshot
  }

  // 2. Поверх накладываем явно скачанные офлайн-пакеты районов (у них приоритет)
  for (const pkg of packages) {
    for (const p of pkg.places) {
      byId.set(p.id, p);
    }
  }

  if (byId.size === 0) return null;
  return Array.from(byId.values());
}
