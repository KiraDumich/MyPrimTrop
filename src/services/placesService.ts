import { isSupabaseConfigured, supabase } from '../lib/supabase';
import { getMockPlacesWithReports } from '../data/mockPlaces';
import {
  loadCachedPlacesForOffline,
  savePlacesSnapshot,
} from '../lib/offlineStorage';
import type {
  CarTypeEnum,
  PlaceRow,
  PlaceWithReports,
  RoadReportRow,
  RoadStatusEnum,
} from '../types/database';

export interface FetchPlacesResult {
  places: PlaceWithReports[];
  source: 'supabase' | 'cache' | 'mock';
  errorMessage?: string;
}

export async function fetchPlacesWithReports(): Promise<FetchPlacesResult> {
  const isBrowserOffline = typeof navigator !== 'undefined' && !navigator.onLine;

  if (isBrowserOffline) {
    const cached = loadCachedPlacesForOffline();
    if (cached && cached.length > 0) {
      return { places: cached, source: 'cache' };
    }
    return { places: getMockPlacesWithReports(), source: 'mock' };
  }

  if (!supabase || !isSupabaseConfigured) {
    const mock = getMockPlacesWithReports();
    savePlacesSnapshot(mock);
    return {
      places: mock,
      source: 'mock',
    };
  }

  try {
    const nowIso = new Date().toISOString();

    const [placesRes, reportsRes] = await Promise.all([
      supabase.from('places').select('*').order('rating', { ascending: false }),
      supabase
        .from('road_reports')
        .select('*')
        .gt('expires_at', nowIso)
        .order('created_at', { ascending: false }),
    ]);

    if (placesRes.error) {
      throw placesRes.error;
    }

    const placeRows = (placesRes.data ?? []) as PlaceRow[];
    const reportRows = (reportsRes.error ? [] : reportsRes.data ?? []) as RoadReportRow[];

    if (placeRows.length === 0) {
      const mock = getMockPlacesWithReports();
      savePlacesSnapshot(mock);
      return {
        places: mock,
        source: 'mock',
      };
    }

    const reportsByPlace = new Map<string, RoadReportRow[]>();
    for (const report of reportRows) {
      const existing = reportsByPlace.get(report.place_id) ?? [];
      existing.push(report);
      reportsByPlace.set(report.place_id, existing);
    }

    const combined: PlaceWithReports[] = placeRows.map((place) => ({
      ...place,
      rating: Number(place.rating),
      road_reports: reportsByPlace.get(place.id) ?? [],
    }));

    savePlacesSnapshot(combined);

    return {
      places: combined,
      source: 'supabase',
    };
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'Не удалось загрузить данные из Supabase';
    const cached = loadCachedPlacesForOffline();
    if (cached && cached.length > 0) {
      return {
        places: cached,
        source: 'cache',
        errorMessage: message,
      };
    }

    return {
      places: getMockPlacesWithReports(),
      source: 'mock',
      errorMessage: message,
    };
  }
}

export interface CreateRoadReportInput {
  place_id: string;
  status: RoadStatusEnum;
  car_used: CarTypeEnum;
  comment: string;
}

export async function createRoadReport(
  input: CreateRoadReportInput
): Promise<{ report: RoadReportRow; persisted: boolean }> {
  const trimmed = input.comment.trim();
  if (trimmed.length < 3) {
    throw new Error('Комментарий должен содержать минимум 3 символа');
  }

  const isOnline = typeof navigator === 'undefined' || navigator.onLine;

  if (isOnline && supabase && isSupabaseConfigured) {
    try {
      const { data, error } = await supabase
        .from('road_reports')
        .insert({
          place_id: input.place_id,
          status: input.status,
          car_used: input.car_used,
          comment: trimmed,
          upvotes: 1,
        })
        .select('*')
        .single();

      if (!error && data) {
        return { report: data as RoadReportRow, persisted: true };
      }
    } catch {
      // Fallback to local record when network drops mid-request
    }
  }

  const now = new Date();
  const expires = new Date(now.getTime() + 72 * 3600_000);
  const localReport: RoadReportRow = {
    id: crypto.randomUUID ? crypto.randomUUID() : `local-${Date.now()}`,
    place_id: input.place_id,
    status: input.status,
    car_used: input.car_used,
    comment: trimmed,
    photo_url: null,
    upvotes: 1,
    expires_at: expires.toISOString(),
    created_at: now.toISOString(),
  };

  return { report: localReport, persisted: false };
}

export async function upvoteRoadReport(
  reportId: string,
  currentUpvotes: number
): Promise<{ upvotes: number; persisted: boolean }> {
  const nextUpvotes = currentUpvotes + 1;
  const isOnline = typeof navigator === 'undefined' || navigator.onLine;

  if (isOnline && supabase && isSupabaseConfigured) {
    try {
      const { data, error } = await supabase
        .from('road_reports')
        .update({ upvotes: nextUpvotes })
        .eq('id', reportId)
        .select('upvotes')
        .single();

      if (!error && data) {
        return { upvotes: (data as { upvotes: number }).upvotes, persisted: true };
      }
    } catch {
      // Fallback to local increment when offline
    }
  }

  return { upvotes: nextUpvotes, persisted: false };
}
