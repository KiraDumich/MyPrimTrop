import heroPrimoryeCoast from '../assets/images/hero_primorye_coast_1794981297427.jpg';
import lighthouseTokarevsky from '../assets/images/lighthouse_tokarevsky_1794981297325.jpg';
import pidanMountainTaiga from '../assets/images/pidan_mountain_taiga_1794981297587.jpg';
import gamovCapePines from '../assets/images/gamov_cape_pines_1794981299003.jpg';
import type {
  CarTypeEnum,
  PlaceCategoryEnum,
  PlaceRow,
  PlaceWithReports,
  RoadReportRow,
  RoadStatusEnum,
} from '../types/database';

export const HERO_IMAGE = heroPrimoryeCoast;

export const CATEGORY_LABELS: Record<PlaceCategoryEnum, string> = {
  beach: 'Пляж / бухта',
  waterfall: 'Водопад',
  viewpoint: 'Видовая площадка',
  history: 'Форты / история',
};

export const CAR_TYPE_LABELS: Record<CarTypeEnum, string> = {
  sedan: 'Седан',
  crossover: 'Кроссовер',
  suv_4x4: 'Внедорожник 4x4',
};

export const ROAD_STATUS_LABELS: Record<RoadStatusEnum, string> = {
  passable: 'Проезжаемо',
  hard: 'Сложно / ямы / лужи',
  blocked: 'Размыто / проезда нет',
};

const now = Date.now();
const hoursAgo = (h: number) => new Date(now - h * 3600_000).toISOString();
const hoursAhead = (h: number) => new Date(now + h * 3600_000).toISOString();

const FALLBACK_IMAGES_BY_TITLE: Record<string, string> = {
  'Мыс Тобизина': heroPrimoryeCoast,
  'Мыс Вятлина': heroPrimoryeCoast,
  'Бухта Стеклянная': gamovCapePines,
  'Кравцовские водопады': pidanMountainTaiga,
  'Триозёрье': gamovCapePines,
  'Полуостров Гамова / Бухта Теляковского': gamovCapePines,
  'Гора Пидан (Ливадийская)': pidanMountainTaiga,
  'Водопад Неожиданный (Горбатый)': pidanMountainTaiga,
  'Мыс Четырёх Скал': heroPrimoryeCoast,
  'Остров Шкота': lighthouseTokarevsky,
  'Бухта Астафьева': gamovCapePines,
  'Ворошиловская батарея': lighthouseTokarevsky,
};

export function resolvePlaceImage(place: Pick<PlaceRow, 'title' | 'image_url' | 'category'>): string {
  const url = place.image_url?.trim();
  if (url && (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('data:'))) {
    return url;
  }
  if (FALLBACK_IMAGES_BY_TITLE[place.title]) {
    return FALLBACK_IMAGES_BY_TITLE[place.title];
  }
  if (place.category === 'waterfall') return pidanMountainTaiga;
  if (place.category === 'beach') return gamovCapePines;
  if (place.category === 'history') return lighthouseTokarevsky;
  return heroPrimoryeCoast;
}

export const MOCK_PLACES: PlaceRow[] = [
  {
    id: '11111111-1111-4111-8111-111111111101',
    title: 'Мыс Тобизина',
    description:
      'Южная оконечность острова Русский со слоистыми базальтовыми уступами, открытым накатом Японского моря и видовой тропой вдоль западного берега.',
    district: 'о. Русский',
    lat: 42.9489,
    lng: 131.8726,
    location: { type: 'Point', coordinates: [131.8726, 42.9489] },
    category: 'viewpoint',
    min_car_type: 'sedan',
    seasonality: 'Круглый год',
    is_border_zone: false,
    image_url: heroPrimoryeCoast,
    rating: 4.9,
    visit_duration_min: 150,
  },
  {
    id: '11111111-1111-4111-8111-111111111102',
    title: 'Мыс Вятлина',
    description:
      'Живописный скалистый мыс на восточном побережье Русского острова с высокой смотровой тропой, ветреными обрывами и спусками к каменистым бухтам.',
    district: 'о. Русский',
    lat: 42.9614,
    lng: 131.9038,
    location: { type: 'Point', coordinates: [131.9038, 42.9614] },
    category: 'viewpoint',
    min_car_type: 'sedan',
    seasonality: 'Круглый год',
    is_border_zone: false,
    image_url: heroPrimoryeCoast,
    rating: 4.8,
    visit_duration_min: 90,
  },
  {
    id: '11111111-1111-4111-8111-111111111103',
    title: 'Бухта Стеклянная',
    description:
      'Знаменитый пляж на берегу Уссурийского залива, где морской прибой отшлифовал разноцветное стекло и фарфор вперемешку с тёмной базальтовой галькой.',
    district: 'Владивосток',
    lat: 43.1333,
    lng: 132.0672,
    location: { type: 'Point', coordinates: [132.0672, 43.1333] },
    category: 'beach',
    min_car_type: 'sedan',
    seasonality: 'Круглый год',
    is_border_zone: false,
    image_url: gamovCapePines,
    rating: 4.5,
    visit_duration_min: 60,
  },
  {
    id: '11111111-1111-4111-8111-111111111104',
    title: 'Кравцовские водопады',
    description:
      'Каскад из пяти лесных водопадов на ручье Кравцовский (Сказка, Каменная чаша, Дикий, Ступенчатый, Хрустальный) с оборудованными деревянными настилами.',
    district: 'Хасанский район',
    lat: 43.3647,
    lng: 131.6494,
    location: { type: 'Point', coordinates: [131.6494, 43.3647] },
    category: 'waterfall',
    min_car_type: 'sedan',
    seasonality: 'Апрель – Ноябрь',
    is_border_zone: false,
    image_url: pidanMountainTaiga,
    rating: 4.7,
    visit_duration_min: 90,
  },
  {
    id: '11111111-1111-4111-8111-111111111105',
    title: 'Триозёрье',
    description:
      'Просторная бухта с белым кварцевым песком, прозрачной бирюзовой водой и тремя пресными озёрами в прибрежной долине за сопками.',
    district: 'Находкинский городской округ',
    lat: 42.7358,
    lng: 133.2436,
    location: { type: 'Point', coordinates: [133.2436, 42.7358] },
    category: 'beach',
    min_car_type: 'crossover',
    seasonality: 'Июнь – Сентябрь',
    is_border_zone: false,
    image_url: gamovCapePines,
    rating: 4.9,
    visit_duration_min: 240,
  },
  {
    id: '11111111-1111-4111-8111-111111111106',
    title: 'Полуостров Гамова / Бухта Теляковского',
    description:
      'Гранитные утёсы с краснокнижными могильными соснами на границе морского заповедника, чистейшая бухта Теляковского и остров Томящегося Сердца.',
    district: 'Хасанский район',
    lat: 42.5789,
    lng: 131.2131,
    location: { type: 'Point', coordinates: [131.2131, 42.5789] },
    category: 'beach',
    min_car_type: 'suv_4x4',
    seasonality: 'Май – Октябрь',
    is_border_zone: false,
    image_url: gamovCapePines,
    rating: 5.0,
    visit_duration_min: 300,
  },
  {
    id: '11111111-1111-4111-8111-111111111107',
    title: 'Гора Пидан (Ливадийская)',
    description:
      'Легендарная вершина высотой 1332 м в массиве Сихотэ-Алиня с кедровой тайгой, каменными курумниками и мегалитическими останцами на гребне.',
    district: 'Шкотовский район',
    lat: 43.0747,
    lng: 132.6889,
    location: { type: 'Point', coordinates: [132.6889, 43.0747] },
    category: 'viewpoint',
    min_car_type: 'crossover',
    seasonality: 'Май – Октябрь',
    is_border_zone: false,
    image_url: pidanMountainTaiga,
    rating: 4.9,
    visit_duration_min: 420,
  },
  {
    id: '11111111-1111-4111-8111-111111111108',
    title: 'Водопад Неожиданный (Горбатый)',
    description:
      'Мощный 9-метровый водопад на ключе Левый Горбатов с базальтовыми шестигранными столбами, скрытый в глубине таёжного Шкотовского плато.',
    district: 'Шкотовский район',
    lat: 43.2486,
    lng: 132.6714,
    location: { type: 'Point', coordinates: [132.6714, 43.2486] },
    category: 'waterfall',
    min_car_type: 'suv_4x4',
    seasonality: 'Май – Октябрь',
    is_border_zone: false,
    image_url: pidanMountainTaiga,
    rating: 4.8,
    visit_duration_min: 180,
  },
  {
    id: '11111111-1111-4111-8111-111111111109',
    title: 'Мыс Четырёх Скал',
    description:
      'Четыре монолитных скальных массива вдоль восточного побережья Приморья, соединённых перешейками над бушующим открытым Японским морем.',
    district: 'Ольгинский район',
    lat: 43.7764,
    lng: 135.3358,
    location: { type: 'Point', coordinates: [135.3358, 43.7764] },
    category: 'viewpoint',
    min_car_type: 'crossover',
    seasonality: 'Май – Октябрь',
    is_border_zone: false,
    image_url: heroPrimoryeCoast,
    rating: 4.9,
    visit_duration_min: 180,
  },
  {
    id: '11111111-1111-4111-8111-111111111110',
    title: 'Остров Шкота',
    description:
      'Необитаемый остров, соединённый с островом Русский узкой галечной косой; славится маяком, красными отвесными клифами и морскими гротами.',
    district: 'о. Русский',
    lat: 42.9369,
    lng: 131.8342,
    location: { type: 'Point', coordinates: [131.8342, 42.9369] },
    category: 'beach',
    min_car_type: 'crossover',
    seasonality: 'Май – Октябрь',
    is_border_zone: false,
    image_url: lighthouseTokarevsky,
    rating: 4.8,
    visit_duration_min: 210,
  },
  {
    id: '11111111-1111-4111-8111-111111111111',
    title: 'Бухта Астафьева',
    description:
      'Заповедная песчаная бухта с мельчайшим светлым песком и изумрудной водой на полуострове Гамова, окружённая гранитными мысами.',
    district: 'Хасанский район',
    lat: 42.6075,
    lng: 131.1967,
    location: { type: 'Point', coordinates: [131.1967, 42.6075] },
    category: 'beach',
    min_car_type: 'crossover',
    seasonality: 'Июнь – Октябрь',
    is_border_zone: false,
    image_url: gamovCapePines,
    rating: 4.9,
    visit_duration_min: 240,
  },
  {
    id: '11111111-1111-4111-8111-111111111112',
    title: 'Ворошиловская батарея',
    description:
      'Уникальный подземный фортификационный комплекс 1930-х годов с двумя трёхорудийными башнями калибра 305 мм в глубине острова Русский.',
    district: 'о. Русский',
    lat: 42.9814,
    lng: 131.8781,
    location: { type: 'Point', coordinates: [131.8781, 42.9814] },
    category: 'history',
    min_car_type: 'sedan',
    seasonality: 'Круглый год',
    is_border_zone: false,
    image_url: lighthouseTokarevsky,
    rating: 4.8,
    visit_duration_min: 120,
  },
];

export const MOCK_ROAD_REPORTS: RoadReportRow[] = [
  {
    id: '22222222-2222-4222-8222-222222222201',
    place_id: '11111111-1111-4111-8111-111111111101',
    status: 'passable',
    car_used: 'sedan',
    comment:
      'Асфальт до поворота на бухту Карпинского чистый, на грунтовке к старту тропы сухо, седан проходит без касаний.',
    photo_url: null,
    upvotes: 7,
    expires_at: hoursAhead(66),
    created_at: hoursAgo(6),
  },
  {
    id: '22222222-2222-4222-8222-222222222202',
    place_id: '11111111-1111-4111-8111-111111111105',
    status: 'hard',
    car_used: 'crossover',
    comment:
      'После перевала перед спуском в бухту глубокая гребёнка и промоина по центру — на седане лучше не спускаться, кроссовер идёт уверенно.',
    photo_url: null,
    upvotes: 11,
    expires_at: hoursAhead(58),
    created_at: hoursAgo(14),
  },
  {
    id: '22222222-2222-4222-8222-222222222203',
    place_id: '11111111-1111-4111-8111-111111111106',
    status: 'hard',
    car_used: 'suv_4x4',
    comment:
      'От Андреевки до Витязя ямы подсохли, но на подъёме от Витязя к бухте Теляковского торчат острые камни и колея — нужен высокий клиренс и полный привод.',
    photo_url: null,
    upvotes: 14,
    expires_at: hoursAhead(52),
    created_at: hoursAgo(20),
  },
  {
    id: '22222222-2222-4222-8222-222222222204',
    place_id: '11111111-1111-4111-8111-111111111108',
    status: 'blocked',
    car_used: 'suv_4x4',
    comment:
      'Лесовозная колея после недавнего циклона залита глиной, в низине у ручья глубокая лужа без объезда. Даже на 4x4 высокий риск сесть на мосты.',
    photo_url: null,
    upvotes: 19,
    expires_at: hoursAhead(44),
    created_at: hoursAgo(28),
  },
  {
    id: '22222222-2222-4222-8222-222222222205',
    place_id: '11111111-1111-4111-8111-111111111110',
    status: 'hard',
    car_used: 'crossover',
    comment:
      'Дорога через перешеек в бухте Пограничная с глубокими песчаными ямами, перед косой лучше оставлять машину на высокой площадке и идти пешком.',
    photo_url: null,
    upvotes: 5,
    expires_at: hoursAhead(62),
    created_at: hoursAgo(10),
  },
  {
    id: '22222222-2222-4222-8222-222222222206',
    place_id: '11111111-1111-4111-8111-111111111112',
    status: 'passable',
    car_used: 'sedan',
    comment:
      'Полностью асфальтированный подъезд от Университетского проспекта, парковка перед КПП музея свободная.',
    photo_url: null,
    upvotes: 4,
    expires_at: hoursAhead(70),
    created_at: hoursAgo(2),
  },
];

export function getMockPlacesWithReports(): PlaceWithReports[] {
  return MOCK_PLACES.map((place) => ({
    ...place,
    road_reports: MOCK_ROAD_REPORTS.filter((r) => r.place_id === place.id).sort(
      (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    ),
  }));
}
