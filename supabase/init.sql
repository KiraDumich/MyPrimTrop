-- ============================================================================
-- ПримТроп (PrimTrop) — Инициализация базы данных в Supabase (PostgreSQL + PostGIS)
-- ============================================================================

-- 1. Включение расширения PostGIS для геопространственных запросов
CREATE EXTENSION IF NOT EXISTS postgis;
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- 2. Enum-типы
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'car_type_enum') THEN
    CREATE TYPE public.car_type_enum AS ENUM ('sedan', 'crossover', 'suv_4x4');
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'road_status_enum') THEN
    CREATE TYPE public.road_status_enum AS ENUM ('passable', 'hard', 'blocked');
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'place_category_enum') THEN
    CREATE TYPE public.place_category_enum AS ENUM ('beach', 'waterfall', 'viewpoint', 'history');
  END IF;
END
$$;

-- 3. Таблица локаций Приморского края
CREATE TABLE IF NOT EXISTS public.places (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text NOT NULL,
  district text NOT NULL,
  lat double precision NOT NULL,
  lng double precision NOT NULL,
  location geography(Point, 4326),
  category public.place_category_enum NOT NULL,
  min_car_type public.car_type_enum NOT NULL,
  seasonality text NOT NULL,
  is_border_zone boolean NOT NULL DEFAULT false,
  image_url text NOT NULL DEFAULT '',
  rating numeric(3, 1) NOT NULL DEFAULT 4.5 CHECK (rating >= 0 AND rating <= 5),
  visit_duration_min int NOT NULL CHECK (visit_duration_min > 0)
);

-- Пространственный индекс для поиска ближайших точек через PostGIS (ST_DWithin / <->)
CREATE INDEX IF NOT EXISTS places_location_gix
  ON public.places
  USING GIST (location);

CREATE INDEX IF NOT EXISTS places_category_idx
  ON public.places (category);

-- Триггер автоматического заполнения geography(Point, 4326) из lat и lng
CREATE OR REPLACE FUNCTION public.sync_place_location()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.location := ST_SetSRID(ST_MakePoint(NEW.lng, NEW.lat), 4326)::geography;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_sync_place_location ON public.places;
CREATE TRIGGER trg_sync_place_location
  BEFORE INSERT OR UPDATE OF lat, lng
  ON public.places
  FOR EACH ROW
  EXECUTE FUNCTION public.sync_place_location();

-- 4. Таблица оперативных дорожных отметок от путешественников
CREATE TABLE IF NOT EXISTS public.road_reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  place_id uuid NOT NULL REFERENCES public.places(id) ON DELETE CASCADE,
  status public.road_status_enum NOT NULL,
  car_used public.car_type_enum NOT NULL,
  comment text NOT NULL,
  photo_url text,
  upvotes int NOT NULL DEFAULT 1 CHECK (upvotes >= 0),
  expires_at timestamptz NOT NULL DEFAULT (now() + interval '72 hours'),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS road_reports_place_expires_idx
  ON public.road_reports (place_id, expires_at DESC);

-- 5. Row Level Security (RLS) для MVP без обязательной регистрации
ALTER TABLE public.places ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.road_reports ENABLE ROW LEVEL SECURITY;

-- Публичное чтение локаций
DROP POLICY IF EXISTS "places_public_select" ON public.places;
CREATE POLICY "places_public_select"
  ON public.places
  FOR SELECT
  TO anon, authenticated
  USING (true);

-- Публичное чтение дорожных отчётов
DROP POLICY IF EXISTS "road_reports_public_select" ON public.road_reports;
CREATE POLICY "road_reports_public_select"
  ON public.road_reports
  FOR SELECT
  TO anon, authenticated
  USING (true);

-- Публичная вставка новых дорожных отметок (для быстрого MVP)
DROP POLICY IF EXISTS "road_reports_public_insert" ON public.road_reports;
CREATE POLICY "road_reports_public_insert"
  ON public.road_reports
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (
    char_length(trim(comment)) >= 3
    AND upvotes = 1
  );

-- Публичное обновление upvotes для подтверждения актуальности отчёта
DROP POLICY IF EXISTS "road_reports_public_update_upvotes" ON public.road_reports;
CREATE POLICY "road_reports_public_update_upvotes"
  ON public.road_reports
  FOR UPDATE
  TO anon, authenticated
  USING (true)
  WITH CHECK (upvotes >= 1);

-- Защита от изменения чужих полей при UPDATE (разрешаем менять только upvotes)
CREATE OR REPLACE FUNCTION public.guard_road_report_upvote_only()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.place_id IS DISTINCT FROM OLD.place_id
     OR NEW.status IS DISTINCT FROM OLD.status
     OR NEW.car_used IS DISTINCT FROM OLD.car_used
     OR NEW.comment IS DISTINCT FROM OLD.comment
     OR NEW.photo_url IS DISTINCT FROM OLD.photo_url
     OR NEW.created_at IS DISTINCT FROM OLD.created_at
     OR NEW.expires_at IS DISTINCT FROM OLD.expires_at THEN
    RAISE EXCEPTION 'Допускается изменение только счётчика upvotes';
  END IF;

  IF NEW.upvotes < OLD.upvotes OR NEW.upvotes > OLD.upvotes + 1 THEN
    RAISE EXCEPTION 'Можно увеличить upvotes только на +1';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_guard_road_report_upvote_only ON public.road_reports;
CREATE TRIGGER trg_guard_road_report_upvote_only
  BEFORE UPDATE
  ON public.road_reports
  FOR EACH ROW
  EXECUTE FUNCTION public.guard_road_report_upvote_only();

-- 6. Начальное наполнение: 12 реальных локаций Приморского края
INSERT INTO public.places (
  title,
  description,
  district,
  lat,
  lng,
  category,
  min_car_type,
  seasonality,
  is_border_zone,
  image_url,
  rating,
  visit_duration_min
)
SELECT * FROM (
  VALUES
    (
      'Мыс Тобизина',
      'Южная оконечность острова Русский со слоистыми базальтовыми уступами, открытым накатом Японского моря и видовой тропой вдоль западного берега.',
      'о. Русский',
      42.9489::double precision,
      131.8726::double precision,
      'viewpoint'::public.place_category_enum,
      'sedan'::public.car_type_enum,
      'Круглый год',
      false,
      '/images/tobizina.jpg',
      4.9::numeric(3,1),
      150
    ),
    (
      'Мыс Вятлина',
      'Живописный скалистый мыс на восточном побережье Русского острова с высокой смотровой тропой, ветреными обрывами и спусками к каменистым бухтам.',
      'о. Русский',
      42.9614::double precision,
      131.9038::double precision,
      'viewpoint'::public.place_category_enum,
      'sedan'::public.car_type_enum,
      'Круглый год',
      false,
      '/images/vyatlina.jpg',
      4.8::numeric(3,1),
      90
    ),
    (
      'Бухта Стеклянная',
      'Знаменитый пляж на берегу Уссурийского залива, где морской прибой отшлифовал разноцветное стекло и фарфор вперемешку с тёмной базальтовой галькой.',
      'Владивосток',
      43.1333::double precision,
      132.0672::double precision,
      'beach'::public.place_category_enum,
      'sedan'::public.car_type_enum,
      'Круглый год',
      false,
      '/images/steklyannaya.jpg',
      4.5::numeric(3,1),
      60
    ),
    (
      'Кравцовские водопады',
      'Каскад из пяти лесных водопадов на ручье Кравцовский (Сказка, Каменная чаша, Дикий, Ступенчатый, Хрустальный) с оборудованными деревянными настилами.',
      'Хасанский район',
      43.3647::double precision,
      131.6494::double precision,
      'waterfall'::public.place_category_enum,
      'sedan'::public.car_type_enum,
      'Апрель – Ноябрь',
      false,
      '/images/kravtsovskie.jpg',
      4.7::numeric(3,1),
      90
    ),
    (
      'Триозёрье',
      'Просторная бухта с белым кварцевым песком, прозрачной бирюзовой водой и тремя пресными озёрами в прибрежной долине за сопками.',
      'Находкинский городской округ',
      42.7358::double precision,
      133.2436::double precision,
      'beach'::public.place_category_enum,
      'crossover'::public.car_type_enum,
      'Июнь – Сентябрь',
      false,
      '/images/triozerye.jpg',
      4.9::numeric(3,1),
      240
    ),
    (
      'Полуостров Гамова / Бухта Теляковского',
      'Гранитные утёсы с краснокнижными могильными соснами на границе морского заповедника, чистейшая бухта Теляковского и остров Томящегося Сердца.',
      'Хасанский район',
      42.5789::double precision,
      131.2131::double precision,
      'beach'::public.place_category_enum,
      'suv_4x4'::public.car_type_enum,
      'Май – Октябрь',
      false,
      '/images/gamov.jpg',
      5.0::numeric(3,1),
      300
    ),
    (
      'Гора Пидан (Ливадийская)',
      'Легендарная вершина высотой 1332 м в массиве Сихотэ-Алиня с кедровой тайгой, каменными курумниками и мегалитическими останцами на гребне.',
      'Шкотовский район',
      43.0747::double precision,
      132.6889::double precision,
      'viewpoint'::public.place_category_enum,
      'crossover'::public.car_type_enum,
      'Май – Октябрь',
      false,
      '/images/pidan.jpg',
      4.9::numeric(3,1),
      420
    ),
    (
      'Водопад Неожиданный (Горбатый)',
      'Мощный 9-метровый водопад на ключе Левый Горбатов с базальтовыми шестигранными столбами, скрытый в глубине таёжного Шкотовского плато.',
      'Шкотовский район',
      43.2486::double precision,
      132.6714::double precision,
      'waterfall'::public.place_category_enum,
      'suv_4x4'::public.car_type_enum,
      'Май – Октябрь',
      false,
      '/images/neozhidanny.jpg',
      4.8::numeric(3,1),
      180
    ),
    (
      'Мыс Четырёх Скал',
      'Четыре монолитных скальных массива вдоль восточного побережья Приморья, соединённых перешейками над бушующим открытым Японским морем.',
      'Ольгинский район',
      43.7764::double precision,
      135.3358::double precision,
      'viewpoint'::public.place_category_enum,
      'crossover'::public.car_type_enum,
      'Май – Октябрь',
      false,
      '/images/chetyreh_skal.jpg',
      4.9::numeric(3,1),
      180
    ),
    (
      'Остров Шкота',
      'Необитаемый остров, соединённый с островом Русский узкой галечной косой; славится маяком, красными отвесными клифами и морскими гротами.',
      'о. Русский',
      42.9369::double precision,
      131.8342::double precision,
      'beach'::public.place_category_enum,
      'crossover'::public.car_type_enum,
      'Май – Октябрь',
      false,
      '/images/shkota.jpg',
      4.8::numeric(3,1),
      210
    ),
    (
      'Бухта Астафьева',
      'Заповедная песчаная бухта с мельчайшим светлым песком и изумрудной водой на полуострове Гамова, окружённая гранитными мысами.',
      'Хасанский район',
      42.6075::double precision,
      131.1967::double precision,
      'beach'::public.place_category_enum,
      'crossover'::public.car_type_enum,
      'Июнь – Октябрь',
      false,
      '/images/astafyeva.jpg',
      4.9::numeric(3,1),
      240
    ),
    (
      'Ворошиловская батарея',
      'Уникальный подземный фортификационный комплекс 1930-х годов с двумя трёхорудийными башнями калибра 305 мм в глубине острова Русский.',
      'о. Русский',
      42.9814::double precision,
      131.8781::double precision,
      'history'::public.place_category_enum,
      'sedan'::public.car_type_enum,
      'Круглый год',
      false,
      '/images/voroshilovskaya.jpg',
      4.8::numeric(3,1),
      120
    )
) AS seed(
  title,
  description,
  district,
  lat,
  lng,
  category,
  min_car_type,
  seasonality,
  is_border_zone,
  image_url,
  rating,
  visit_duration_min
)
WHERE NOT EXISTS (
  SELECT 1 FROM public.places p WHERE p.title = seed.title
);

-- 7. Начальные свежие дорожные отчёты (6 реалистичных записей)
INSERT INTO public.road_reports (
  place_id,
  status,
  car_used,
  comment,
  photo_url,
  upvotes,
  expires_at,
  created_at
)
SELECT
  p.id,
  r.status,
  r.car_used,
  r.comment,
  r.photo_url,
  r.upvotes,
  now() + (r.hours_left || ' hours')::interval,
  now() - (r.hours_ago || ' hours')::interval
FROM (
  VALUES
    (
      'Мыс Тобизина',
      'passable'::public.road_status_enum,
      'sedan'::public.car_type_enum,
      'Асфальт до поворота на бухту Карпинского чистый, на грунтовке к старту тропы сухо, седан проходит без касаний.',
      NULL::text,
      7,
      66,
      6
    ),
    (
      'Триозёрье',
      'hard'::public.road_status_enum,
      'crossover'::public.car_type_enum,
      'После перевала перед спуском в бухту глубокая гребёнка и промоина по центру — на седане лучше не спускаться, кроссовер идёт уверенно.',
      NULL::text,
      11,
      58,
      14
    ),
    (
      'Полуостров Гамова / Бухта Теляковского',
      'hard'::public.road_status_enum,
      'suv_4x4'::public.car_type_enum,
      'От Андреевки до Витязя ямы подсохли, но на подъёме от Витязя к бухте Теляковского торчат острые камни и колея — нужен высокий клиренс и полный привод.',
      NULL::text,
      14,
      52,
      20
    ),
    (
      'Водопад Неожиданный (Горбатый)',
      'blocked'::public.road_status_enum,
      'suv_4x4'::public.car_type_enum,
      'Лесовозная колея после недавнего циклона залита глиной, в низине у ручья глубокая лужа без объезда. Даже на 4x4 высокий риск сесть на мосты.',
      NULL::text,
      19,
      44,
      28
    ),
    (
      'Остров Шкота',
      'hard'::public.road_status_enum,
      'crossover'::public.car_type_enum,
      'Дорога через перешеек в бухте Пограничная с глубокими песчаными ямами, перед косой лучше оставлять машину на высокой площадке и идти пешком.',
      NULL::text,
      5,
      62,
      10
    ),
    (
      'Ворошиловская батарея',
      'passable'::public.road_status_enum,
      'sedan'::public.car_type_enum,
      'Полностью асфальтированный подъезд от Университетского проспекта, парковка перед КПП музея свободная.',
      NULL::text,
      4,
      70,
      2
    )
) AS r(place_title, status, car_used, comment, photo_url, upvotes, hours_left, hours_ago)
JOIN public.places p ON p.title = r.place_title
WHERE NOT EXISTS (
  SELECT 1
  FROM public.road_reports rr
  WHERE rr.place_id = p.id
    AND rr.comment = r.comment
);
