import type {
  CarTypeEnum,
  PlaceCategoryEnum,
  PlaceWithReports,
  RoadStatusEnum,
} from '../types/database';

export interface StartLocation {
  id: string;
  label: string;
  genitiveLabel: string;
  lat: number;
  lng: number;
}

export const START_LOCATIONS: StartLocation[] = [
  {
    id: 'vladivostok',
    label: 'Владивосток центр',
    genitiveLabel: 'Владивостока',
    lat: 43.1155,
    lng: 131.8855,
  },
  {
    id: 'russky',
    label: 'о. Русский',
    genitiveLabel: 'о. Русский',
    lat: 43.025,
    lng: 131.894,
  },
  {
    id: 'artem',
    label: 'Артём',
    genitiveLabel: 'Артёма',
    lat: 43.3536,
    lng: 132.1897,
  },
  {
    id: 'ussuriysk',
    label: 'Уссурийск',
    genitiveLabel: 'Уссурийска',
    lat: 43.7972,
    lng: 131.9519,
  },
  {
    id: 'nakhodka',
    label: 'Находка',
    genitiveLabel: 'Находки',
    lat: 42.8241,
    lng: 132.8928,
  },
];

export interface RouteGeneratorParams {
  startLocationId: string;
  carType: CarTypeEnum;
  durationHours: 6 | 9 | 12;
  interests: PlaceCategoryEnum[];
  departureMinutesFromMidnight?: number; // default 09:00 = 540
}

export interface RouteStop {
  order: number;
  place: PlaceWithReports;
  legDistanceKm: number;
  legDriveMin: number;
  arrivalTime: string;
  departureTime: string;
  roadStatus: RoadStatusEnum | 'none';
}

export interface TimelineEntry {
  id: string;
  kind: 'start' | 'stop' | 'return';
  time: string;
  title: string;
  subtitle: string;
  place?: PlaceWithReports;
  roadStatus?: RoadStatusEnum | 'none';
  visitDurationMin?: number;
  legDistanceKm?: number;
  legDriveMin?: number;
}

export interface GeneratedRoute {
  start: StartLocation;
  carType: CarTypeEnum;
  durationHours: 6 | 9 | 12;
  stops: RouteStop[];
  timeline: TimelineEntry[];
  backupPlace: PlaceWithReports | null;
  backupDistanceKm: number | null;
  totalDistanceKm: number;
  totalDriveMin: number;
  totalVisitMin: number;
  totalTripMin: number;
  passabilitySummary: string;
  coordinatesPath: [number, number][];
}

const CAR_RANK: Record<CarTypeEnum, number> = {
  sedan: 1,
  crossover: 2,
  suv_4x4: 3,
};

const AVERAGE_SPEED_KMH = 45;

export function haversineKm(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number {
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const R = 6371;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) *
      Math.cos(toRad(lat2)) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

export function driveMinutes(distanceKm: number): number {
  return Math.max(5, Math.round((distanceKm / AVERAGE_SPEED_KMH) * 60));
}

export function formatTimeHHMM(totalMinutes: number): string {
  const normalized = ((Math.round(totalMinutes) % 1440) + 1440) % 1440;
  const hh = Math.floor(normalized / 60);
  const mm = normalized % 60;
  return `${String(hh).padStart(2, '0')}:${String(mm).padStart(2, '0')}`;
}

function getLatestRoadStatus(place: PlaceWithReports): RoadStatusEnum | 'none' {
  const latest = place.road_reports[0];
  return latest ? latest.status : 'none';
}

export function generateDayRoute(
  allPlaces: PlaceWithReports[],
  params: RouteGeneratorParams
): GeneratedRoute {
  const start =
    START_LOCATIONS.find((s) => s.id === params.startLocationId) ?? START_LOCATIONS[0];
  const departureStartMin = params.departureMinutesFromMidnight ?? 9 * 60;
  const maxTripMinutes = params.durationHours * 60;

  // 1. Отфильтровать места по авто, статусу != blocked и интересам
  const eligiblePlaces = allPlaces.filter((place) => {
    if (CAR_RANK[place.min_car_type] > CAR_RANK[params.carType]) {
      return false;
    }
    if (getLatestRoadStatus(place) === 'blocked') {
      return false;
    }
    if (params.interests.length > 0 && !params.interests.includes(place.category)) {
      return false;
    }
    return true;
  });

  // 2. Жадным алгоритмом подобрать 2–4 оптимальные точки в лимит времени
  const selectedPlaces: PlaceWithReports[] = [];
  const usedIds = new Set<string>();

  let currentLat = start.lat;
  let currentLng = start.lng;
  let elapsedMin = 0;

  const MAX_STOPS = 4;

  while (selectedPlaces.length < MAX_STOPS) {
    let bestCandidate: PlaceWithReports | null = null;
    let bestScore = Infinity;

    for (const candidate of eligiblePlaces) {
      if (usedIds.has(candidate.id)) continue;

      const distFromCurrent = haversineKm(currentLat, currentLng, candidate.lat, candidate.lng);
      const driveToCandidate = driveMinutes(distFromCurrent);
      const distReturn = haversineKm(candidate.lat, candidate.lng, start.lat, start.lng);
      const driveReturn = driveMinutes(distReturn);

      const projectedTotal =
        elapsedMin + driveToCandidate + candidate.visit_duration_min + driveReturn;

      if (projectedTotal > maxTripMinutes) {
        continue;
      }

      // Жадная оценка: минимизируем добавленное время в пути и крюк от базы, учитывая рейтинг
      const currentReturnDist = haversineKm(currentLat, currentLng, start.lat, start.lng);
      const detourKm = distFromCurrent + distReturn - currentReturnDist;
      const ratingBonus = (candidate.rating - 4.5) * 6;
      const score = distFromCurrent + detourKm * 0.45 - ratingBonus;

      if (score < bestScore) {
        bestScore = score;
        bestCandidate = candidate;
      }
    }

    if (!bestCandidate) {
      break;
    }

    const legDist = haversineKm(currentLat, currentLng, bestCandidate.lat, bestCandidate.lng);
    elapsedMin += driveMinutes(legDist) + bestCandidate.visit_duration_min;
    selectedPlaces.push(bestCandidate);
    usedIds.add(bestCandidate.id);
    currentLat = bestCandidate.lat;
    currentLng = bestCandidate.lng;
  }

  // 3. Построить тайм-лайн дня и рассчитать показатели
  const stops: RouteStop[] = [];
  const timeline: TimelineEntry[] = [
    {
      id: 'start',
      kind: 'start',
      time: formatTimeHHMM(departureStartMin),
      title: `Выезд из ${start.genitiveLabel}`,
      subtitle: `Средняя расчётная скорость по Приморью — ${AVERAGE_SPEED_KMH} км/ч`,
    },
  ];

  let cursorLat = start.lat;
  let cursorLng = start.lng;
  let clockMin = departureStartMin;
  let totalDistanceKm = 0;
  let totalDriveMin = 0;
  let totalVisitMin = 0;

  const coordinatesPath: [number, number][] = [[start.lng, start.lat]];

  selectedPlaces.forEach((place, index) => {
    const legKm = haversineKm(cursorLat, cursorLng, place.lat, place.lng);
    const legMin = driveMinutes(legKm);
    const arrivalMin = clockMin + legMin;
    const departureMin = arrivalMin + place.visit_duration_min;
    const status = getLatestRoadStatus(place);

    totalDistanceKm += legKm;
    totalDriveMin += legMin;
    totalVisitMin += place.visit_duration_min;

    const arrivalTime = formatTimeHHMM(arrivalMin);
    const departureTime = formatTimeHHMM(departureMin);

    stops.push({
      order: index + 1,
      place,
      legDistanceKm: legKm,
      legDriveMin: legMin,
      arrivalTime,
      departureTime,
      roadStatus: status,
    });

    timeline.push({
      id: place.id,
      kind: 'stop',
      time: arrivalTime,
      title: place.title,
      subtitle: `${place.district} · переезд ${legKm.toFixed(1)} км (${legMin} мин)`,
      place,
      roadStatus: status,
      visitDurationMin: place.visit_duration_min,
      legDistanceKm: legKm,
      legDriveMin: legMin,
    });

    coordinatesPath.push([place.lng, place.lat]);
    cursorLat = place.lat;
    cursorLng = place.lng;
    clockMin = departureMin;
  });

  if (selectedPlaces.length > 0) {
    const returnKm = haversineKm(cursorLat, cursorLng, start.lat, start.lng);
    const returnMin = driveMinutes(returnKm);
    totalDistanceKm += returnKm;
    totalDriveMin += returnMin;
    clockMin += returnMin;
    coordinatesPath.push([start.lng, start.lat]);

    timeline.push({
      id: 'return',
      kind: 'return',
      time: formatTimeHHMM(clockMin),
      title: `Возвращение в ${start.label}`,
      subtitle: `Обратный путь ${returnKm.toFixed(1)} км (${returnMin} мин)`,
      legDistanceKm: returnKm,
      legDriveMin: returnMin,
    });
  }

  // 4. Запасная точка на случай дождя (sedan + статус passable, не входящая в основной маршрут)
  const asphaltPassableCandidates = allPlaces
    .filter(
      (p) =>
        !usedIds.has(p.id) &&
        p.min_car_type === 'sedan' &&
        getLatestRoadStatus(p) === 'passable'
    )
    .sort(
      (a, b) =>
        haversineKm(start.lat, start.lng, a.lat, a.lng) -
        haversineKm(start.lat, start.lng, b.lat, b.lng)
    );

  const fallbackSedanCandidates = allPlaces
    .filter(
      (p) =>
        !usedIds.has(p.id) &&
        p.min_car_type === 'sedan' &&
        getLatestRoadStatus(p) !== 'blocked' &&
        getLatestRoadStatus(p) !== 'hard'
    )
    .sort(
      (a, b) =>
        haversineKm(start.lat, start.lng, a.lat, a.lng) -
        haversineKm(start.lat, start.lng, b.lat, b.lng)
    );

  const backupPlace = asphaltPassableCandidates[0] ?? fallbackSedanCandidates[0] ?? null;
  const backupDistanceKm = backupPlace
    ? haversineKm(start.lat, start.lng, backupPlace.lat, backupPlace.lng)
    : null;

  const hasHardSegment = stops.some((s) => s.roadStatus === 'hard');
  const hasUnknownSegment = stops.some((s) => s.roadStatus === 'none');
  const passabilitySummary =
    stops.length === 0
      ? 'Нет подходящих точек'
      : hasHardSegment
        ? 'Местами сложный подъезд (ямы/колея)'
        : hasUnknownSegment
          ? 'Часть точек без свежих отчётов'
          : 'Все подъезды проезжаемы';

  return {
    start,
    carType: params.carType,
    durationHours: params.durationHours,
    stops,
    timeline,
    backupPlace,
    backupDistanceKm,
    totalDistanceKm,
    totalDriveMin,
    totalVisitMin,
    totalTripMin: totalDriveMin + totalVisitMin,
    passabilitySummary,
    coordinatesPath,
  };
}
