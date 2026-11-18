import { useEffect, useMemo, useRef, useState } from 'react';
import * as maplibregl from 'maplibre-gl';
import maplibreWorkerUrl from 'maplibre-gl/dist/maplibre-gl-worker.mjs?url';
import 'maplibre-gl/dist/maplibre-gl.css';
import { Car, Compass, Mountain, ShieldAlert, Trees, Waves, X } from 'lucide-react';
import type { GeneratedRoute } from '../lib/routeGenerator';
import type {
  CarTypeEnum,
  PlaceCategoryEnum,
  PlaceWithReports,
  RoadReportRow,
  RoadStatusEnum,
} from '../types/database';
import { PlaceBottomSheet } from './PlaceBottomSheet';

maplibregl.setWorkerUrl(maplibreWorkerUrl);

export type MapCarFilter = 'all' | CarTypeEnum;

interface MapScreenProps {
  places: PlaceWithReports[];
  savedIds: string[];
  upvotedIds: Record<string, boolean>;
  activeRoute: GeneratedRoute | null;
  onClearRoute: () => void;
  onOpenDetails: (place: PlaceWithReports) => void;
  onOpenReportModal: (place: PlaceWithReports) => void;
  onUpvoteReport: (placeId: string, report: RoadReportRow) => Promise<void>;
  onToggleSave: (placeId: string) => void;
}

const CAR_CHIPS: { value: MapCarFilter; label: string }[] = [
  { value: 'all', label: 'Все авто' },
  { value: 'sedan', label: 'На седане' },
  { value: 'crossover', label: 'Кроссовер' },
  { value: 'suv_4x4', label: 'Только 4x4' },
];

const CATEGORY_CHIPS: { value: PlaceCategoryEnum; label: string }[] = [
  { value: 'beach', label: 'Бухты' },
  { value: 'waterfall', label: 'Водопады' },
  { value: 'viewpoint', label: 'Видовые' },
  { value: 'history', label: 'История' },
];

const CAR_RANK: Record<CarTypeEnum, number> = {
  sedan: 1,
  crossover: 2,
  suv_4x4: 3,
};

const ROUTE_SOURCE_ID = 'primtrop-route-source';
const ROUTE_CASING_LAYER_ID = 'primtrop-route-casing';
const ROUTE_LINE_LAYER_ID = 'primtrop-route-line';

function getPlaceRoadStatus(place: PlaceWithReports): RoadStatusEnum | 'none' {
  const latest = place.road_reports[0];
  return latest ? latest.status : 'none';
}

function getMarkerPalette(status: RoadStatusEnum | 'none'): {
  fill: string;
  ring: string;
  label: string;
} {
  if (status === 'passable') {
    return { fill: '#10B981', ring: '#047857', label: 'Проезжаемо' };
  }
  if (status === 'hard') {
    return { fill: '#F59E0B', ring: '#B45309', label: 'Сложно' };
  }
  if (status === 'blocked') {
    return { fill: '#EF4444', ring: '#B91C1C', label: 'Размыто' };
  }
  return { fill: '#64748B', ring: '#334155', label: 'Нет свежих данных' };
}

function CategoryGlyph({ category }: { category: PlaceCategoryEnum }) {
  if (category === 'beach') return <Waves className="w-3.5 h-3.5" />;
  if (category === 'waterfall') return <Trees className="w-3.5 h-3.5" />;
  if (category === 'viewpoint') return <Mountain className="w-3.5 h-3.5" />;
  return <ShieldAlert className="w-3.5 h-3.5" />;
}

export function MapScreen({
  places,
  savedIds,
  upvotedIds,
  activeRoute,
  onClearRoute,
  onOpenDetails,
  onOpenReportModal,
  onUpvoteReport,
  onToggleSave,
}: MapScreenProps) {
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const markersRef = useRef<maplibregl.Marker[]>([]);
  const startMarkerRef = useRef<maplibregl.Marker | null>(null);

  const [carFilter, setCarFilter] = useState<MapCarFilter>('all');
  const [categoryFilter, setCategoryFilter] = useState<PlaceCategoryEnum | null>(null);
  const [selectedPlaceId, setSelectedPlaceId] = useState<string | null>(null);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [mapError, setMapError] = useState(false);

  const filteredPlaces = useMemo(() => {
    return places.filter((place) => {
      if (categoryFilter && place.category !== categoryFilter) {
        return false;
      }
      if (carFilter === 'sedan' && place.min_car_type !== 'sedan') {
        return false;
      }
      if (carFilter === 'crossover' && CAR_RANK[place.min_car_type] > CAR_RANK.crossover) {
        return false;
      }
      if (carFilter === 'suv_4x4' && place.min_car_type !== 'suv_4x4') {
        return false;
      }
      return true;
    });
  }, [places, carFilter, categoryFilter]);

  const routeOrderByPlaceId = useMemo(() => {
    const map = new Map<string, number>();
    if (!activeRoute) return map;
    for (const stop of activeRoute.stops) {
      map.set(stop.place.id, stop.order);
    }
    return map;
  }, [activeRoute]);

  const selectedPlace = useMemo(
    () => places.find((p) => p.id === selectedPlaceId) ?? null,
    [places, selectedPlaceId]
  );

  // Initialize MapLibre GL map once
  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return;

    try {
      const map = new maplibregl.Map({
        container: mapContainerRef.current,
        style: {
          version: 8,
          sources: {
            osm: {
              type: 'raster',
              tiles: ['https://tile.openstreetmap.org/{z}/{x}/{y}.png'],
              tileSize: 256,
              attribution: '© OpenStreetMap contributors',
            },
          },
          layers: [
            {
              id: 'osm-tiles',
              type: 'raster',
              source: 'osm',
              minzoom: 0,
              maxzoom: 19,
            },
          ],
        },
        center: [132.1, 43.2],
        zoom: 8.5,
      });

      map.addControl(new maplibregl.NavigationControl({ showCompass: true }), 'bottom-right');

      map.on('load', () => {
        setMapLoaded(true);
      });

      map.on('click', (e: maplibregl.MapMouseEvent) => {
        const target = e.originalEvent.target as HTMLElement | null;
        if (target && target.closest('[data-primtrop-marker="true"]')) {
          return;
        }
        setSelectedPlaceId(null);
      });

      map.on('error', () => {
        // Keep map interactive even if individual raster tiles are delayed
      });

      mapRef.current = map;

      return () => {
        markersRef.current.forEach((m) => m.remove());
        markersRef.current = [];
        startMarkerRef.current?.remove();
        startMarkerRef.current = null;
        map.remove();
        mapRef.current = null;
        setMapLoaded(false);
      };
    } catch {
      setMapError(true);
    }
  }, []);

  // Draw or clear activeRoute GeoJSON line on MapLibre
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapLoaded) return;

    const removeExistingRoute = () => {
      if (map.getLayer(ROUTE_LINE_LAYER_ID)) map.removeLayer(ROUTE_LINE_LAYER_ID);
      if (map.getLayer(ROUTE_CASING_LAYER_ID)) map.removeLayer(ROUTE_CASING_LAYER_ID);
      if (map.getSource(ROUTE_SOURCE_ID)) map.removeSource(ROUTE_SOURCE_ID);
      startMarkerRef.current?.remove();
      startMarkerRef.current = null;
    };

    if (!activeRoute || activeRoute.coordinatesPath.length < 2) {
      removeExistingRoute();
      return;
    }

    const geojson: GeoJSON.Feature<GeoJSON.LineString> = {
      type: 'Feature',
      properties: {},
      geometry: {
        type: 'LineString',
        coordinates: activeRoute.coordinatesPath,
      },
    };

    const existingSource = map.getSource(ROUTE_SOURCE_ID) as
      | maplibregl.GeoJSONSource
      | undefined;

    if (existingSource) {
      existingSource.setData(geojson);
    } else {
      map.addSource(ROUTE_SOURCE_ID, {
        type: 'geojson',
        data: geojson,
      });

      map.addLayer({
        id: ROUTE_CASING_LAYER_ID,
        type: 'line',
        source: ROUTE_SOURCE_ID,
        layout: {
          'line-join': 'round',
          'line-cap': 'round',
        },
        paint: {
          'line-color': '#FFFFFF',
          'line-width': 7,
          'line-opacity': 0.9,
        },
      });

      map.addLayer({
        id: ROUTE_LINE_LAYER_ID,
        type: 'line',
        source: ROUTE_SOURCE_ID,
        layout: {
          'line-join': 'round',
          'line-cap': 'round',
        },
        paint: {
          'line-color': '#0D5C63',
          'line-width': 4,
          'line-dasharray': [2, 1.2],
        },
      });
    }

    startMarkerRef.current?.remove();
    const startEl = document.createElement('div');
    startEl.className =
      'px-2.5 py-1 rounded-full bg-[#11161A] text-white text-[11px] font-semibold shadow-lg border-2 border-white whitespace-nowrap';
    startEl.textContent = `Старт: ${activeRoute.start.label}`;
    startMarkerRef.current = new maplibregl.Marker({ element: startEl, anchor: 'center' })
      .setLngLat([activeRoute.start.lng, activeRoute.start.lat])
      .addTo(map);

    const bounds = new maplibregl.LngLatBounds();
    for (const coord of activeRoute.coordinatesPath) {
      bounds.extend(coord);
    }
    map.fitBounds(bounds, {
      padding: { top: 130, bottom: 90, left: 60, right: 60 },
      duration: 600,
    });
  }, [activeRoute, mapLoaded]);

  // Sync custom markers whenever filteredPlaces, road_reports, selection, or activeRoute changes
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    markersRef.current.forEach((marker) => marker.remove());
    markersRef.current = [];

    for (const place of filteredPlaces) {
      const roadStatus = getPlaceRoadStatus(place);
      const palette = getMarkerPalette(roadStatus);
      const isSelected = place.id === selectedPlaceId;
      const routeOrder = routeOrderByPlaceId.get(place.id);

      const el = document.createElement('button');
      el.type = 'button';
      el.setAttribute('data-primtrop-marker', 'true');
      el.setAttribute('aria-label', `${place.title} — ${palette.label}`);
      el.title = `${place.title} (${palette.label})`;

      el.className =
        'group flex flex-col items-center cursor-pointer focus:outline-none select-none';

      const pinSize = isSelected || routeOrder ? 'w-10 h-10 scale-110' : 'w-8 h-8 hover:scale-110';
      const ringHighlight = isSelected
        ? 'ring-4 ring-white shadow-xl'
        : routeOrder
          ? 'ring-3 ring-[#0D5C63] shadow-lg'
          : 'ring-2 ring-white/95 shadow-md';

      const dot = document.createElement('span');
      dot.className = `${pinSize} rounded-full flex items-center justify-center text-white font-semibold text-xs transition-transform ${ringHighlight}`;
      dot.style.backgroundColor = palette.fill;
      dot.style.border = `2.5px solid ${palette.ring}`;

      if (routeOrder) {
        dot.textContent = String(routeOrder);
      } else {
        dot.innerHTML =
          place.category === 'beach'
            ? '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M2 6c.6.5 1.2 1 2.5 1C7 7 7 5 9.5 5c2.6 0 2.4 2 5 2 2.5 0 2.5-2 5-2 1.3 0 1.9.5 2.5 1"/><path d="M2 12c.6.5 1.2 1 2.5 1 2.5 0 2.5-2 5-2 2.6 0 2.4 2 5 2 2.5 0 2.5-2 5-2 1.3 0 1.9.5 2.5 1"/><path d="M2 18c.6.5 1.2 1 2.5 1 2.5 0 2.5-2 5-2 2.6 0 2.4 2 5 2 2.5 0 2.5-2 5-2 1.3 0 1.9.5 2.5 1"/></svg>'
            : place.category === 'waterfall'
              ? '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z"/></svg>'
              : place.category === 'history'
                ? '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 21h18"/><path d="M5 21V7l8-4v18"/><path d="M19 21V11l-6-4"/></svg>'
                : '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="m8 3 4 8 5-5 5 15H2L8 3z"/></svg>';
      }

      const label = document.createElement('span');
      label.className = `mt-1 px-2 py-0.5 rounded bg-white/95 text-[#11161A] text-[11px] font-semibold shadow-sm border border-slate-200/90 whitespace-nowrap ${
        isSelected || routeOrder ? 'opacity-100' : 'opacity-90 group-hover:opacity-100'
      }`;
      label.textContent = routeOrder ? `${routeOrder}. ${place.title}` : place.title;

      el.appendChild(dot);
      el.appendChild(label);

      el.addEventListener('click', (evt) => {
        evt.stopPropagation();
        setSelectedPlaceId(place.id);
        map.easeTo({
          center: [place.lng, place.lat],
          duration: 450,
          offset: [0, -70],
        });
      });

      const marker = new maplibregl.Marker({ element: el, anchor: 'center' })
        .setLngLat([place.lng, place.lat])
        .addTo(map);

      markersRef.current.push(marker);
    }
  }, [filteredPlaces, selectedPlaceId, routeOrderByPlaceId]);

  return (
    <div className="relative w-full h-[calc(100vh-4rem)] min-h-[580px] bg-[#E5EAEE] overflow-hidden">
      {/* Top Horizontal Scrollable Quick Filters Bar */}
      <div className="absolute top-3 left-0 right-0 z-10 px-3 sm:px-5 pointer-events-none">
        <div className="max-w-7xl mx-auto flex flex-col gap-2">
          <div className="pointer-events-auto flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
            {/* Car Filter Chips */}
            <div className="inline-flex items-center gap-1.5 bg-white/95 backdrop-blur-sm border border-slate-200/90 rounded-xl p-1 shadow-sm shrink-0">
              <span className="pl-2 pr-1 text-slate-400" aria-hidden="true">
                <Car className="w-4 h-4" />
              </span>
              {CAR_CHIPS.map((chip) => {
                const active = carFilter === chip.value;
                return (
                  <button
                    key={chip.value}
                    type="button"
                    onClick={() => setCarFilter(chip.value)}
                    className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
                      active
                        ? 'bg-[#0D5C63] text-white'
                        : 'text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    {chip.label}
                  </button>
                );
              })}
            </div>

            {/* Category Filter Chips */}
            <div className="inline-flex items-center gap-1.5 bg-white/95 backdrop-blur-sm border border-slate-200/90 rounded-xl p-1 shadow-sm shrink-0">
              {CATEGORY_CHIPS.map((chip) => {
                const active = categoryFilter === chip.value;
                return (
                  <button
                    key={chip.value}
                    type="button"
                    onClick={() =>
                      setCategoryFilter((prev) => (prev === chip.value ? null : chip.value))
                    }
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
                      active
                        ? 'bg-[#11161A] text-white'
                        : 'text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    <CategoryGlyph category={chip.value} />
                    <span>{chip.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Compact Status Legend + Active Route Banner */}
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="pointer-events-auto inline-flex flex-wrap items-center gap-x-3.5 gap-y-1 px-3 py-1.5 bg-white/92 backdrop-blur-sm border border-slate-200/90 rounded-lg text-[11px] font-medium text-slate-700 shadow-sm">
              <span className="inline-flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                Проезжаемо
              </span>
              <span className="inline-flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                Сложно
              </span>
              <span className="inline-flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
                Размыто
              </span>
              <span className="inline-flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-slate-500" />
                Нет данных
              </span>
              <span className="text-slate-400" aria-hidden="true">
                |
              </span>
              <span className="tabular-nums text-slate-600">
                Показано: {filteredPlaces.length} из {places.length}
              </span>
            </div>

            <div className="flex items-center gap-2">
              {activeRoute && (
                <div className="pointer-events-auto inline-flex items-center gap-2 px-3 py-1.5 bg-[#0D5C63] text-white rounded-lg text-[11px] font-semibold shadow-sm">
                  <span className="tabular-nums">
                    Маршрут: {activeRoute.stops.length} точек ·{' '}
                    {activeRoute.totalDistanceKm.toFixed(1)} км
                  </span>
                  <button
                    type="button"
                    onClick={onClearRoute}
                    aria-label="Скрыть линию маршрута"
                    className="p-0.5 rounded hover:bg-white/20 transition-colors cursor-pointer"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}

              <button
                type="button"
                onClick={() => {
                  setSelectedPlaceId(null);
                  mapRef.current?.flyTo({ center: [132.1, 43.2], zoom: 8.5, duration: 500 });
                }}
                className="pointer-events-auto hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 bg-white/92 backdrop-blur-sm border border-slate-200/90 rounded-lg text-[11px] font-medium text-slate-700 hover:text-[#0D5C63] shadow-sm transition-colors cursor-pointer"
              >
                <Compass className="w-3.5 h-3.5 text-[#0D5C63]" />
                <span>Приморье целиком</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* MapLibre GL Canvas Container */}
      {mapError ? (
        <div className="w-full h-full flex flex-col items-center justify-center p-6 text-center bg-slate-100">
          <p className="text-base font-semibold text-[#11161A]">
            Не удалось инициализировать WebGL-карту в этом браузере
          </p>
          <p className="text-sm text-slate-600 mt-1 max-w-md">
            Переключитесь на вкладку «Каталог» в верхнем меню для просмотра всех локаций и
            дорожных сводок.
          </p>
        </div>
      ) : (
        <div ref={mapContainerRef} className="w-full h-full" />
      )}

      {/* Selected Place Bottom Sheet / Drawer */}
      <PlaceBottomSheet
        place={selectedPlace}
        isSaved={selectedPlace ? savedIds.includes(selectedPlace.id) : false}
        upvotedIds={upvotedIds}
        onClose={() => setSelectedPlaceId(null)}
        onOpenDetails={onOpenDetails}
        onOpenReportModal={onOpenReportModal}
        onUpvoteReport={onUpvoteReport}
        onToggleSave={onToggleSave}
      />
    </div>
  );
}
