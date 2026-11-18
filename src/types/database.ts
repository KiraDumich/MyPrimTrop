export type CarTypeEnum = 'sedan' | 'crossover' | 'suv_4x4';

export type RoadStatusEnum = 'passable' | 'hard' | 'blocked';

export type PlaceCategoryEnum = 'beach' | 'waterfall' | 'viewpoint' | 'history';

/**
 * PostGIS geography(Point, 4326) в ответах PostgREST возвращается
 * как GeoJSON Point или WKT-строка в зависимости от выборки.
 */
export interface GeoJsonPoint {
  type: 'Point';
  coordinates: [number, number];
}

export type PlaceRow = {
  id: string;
  title: string;
  description: string;
  district: string;
  lat: number;
  lng: number;
  location: GeoJsonPoint | string | null;
  category: PlaceCategoryEnum;
  min_car_type: CarTypeEnum;
  seasonality: string;
  is_border_zone: boolean;
  image_url: string;
  rating: number;
  visit_duration_min: number;
};

export type PlaceInsert = {
  id?: string;
  title: string;
  description: string;
  district: string;
  lat: number;
  lng: number;
  location?: GeoJsonPoint | string | null;
  category: PlaceCategoryEnum;
  min_car_type: CarTypeEnum;
  seasonality: string;
  is_border_zone?: boolean;
  image_url?: string;
  rating?: number;
  visit_duration_min: number;
};

export type PlaceUpdate = Partial<PlaceInsert>;

export type RoadReportRow = {
  id: string;
  place_id: string;
  status: RoadStatusEnum;
  car_used: CarTypeEnum;
  comment: string;
  photo_url: string | null;
  upvotes: number;
  expires_at: string;
  created_at: string;
};

export type RoadReportInsert = {
  id?: string;
  place_id: string;
  status: RoadStatusEnum;
  car_used: CarTypeEnum;
  comment: string;
  photo_url?: string | null;
  upvotes?: number;
  expires_at?: string;
  created_at?: string;
};

export type RoadReportUpdate = {
  upvotes?: number;
};

export type Database = {
  public: {
    Tables: {
      places: {
        Row: PlaceRow;
        Insert: PlaceInsert;
        Update: PlaceUpdate;
        Relationships: [];
      };
      road_reports: {
        Row: RoadReportRow;
        Insert: RoadReportInsert;
        Update: RoadReportUpdate;
        Relationships: [
          {
            foreignKeyName: 'road_reports_place_id_fkey';
            columns: ['place_id'];
            isOneToOne: false;
            referencedRelation: 'places';
            referencedColumns: ['id'];
          },
        ];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: {
      car_type_enum: CarTypeEnum;
      road_status_enum: RoadStatusEnum;
      place_category_enum: PlaceCategoryEnum;
    };
    CompositeTypes: Record<string, never>;
  };
};

export interface PlaceWithReports extends PlaceRow {
  road_reports: RoadReportRow[];
}
