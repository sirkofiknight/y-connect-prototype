import { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

L.Icon.Default.mergeOptions({ iconRetinaUrl: markerIcon2x, iconUrl: markerIcon, shadowUrl: markerShadow });

export type MapPoint = { id: number; name: string; latitude: number; longitude: number };

export function ServiceMap({ points, selectedId, onSelect }: { points: MapPoint[]; selectedId?: number | null; onSelect?: (id: number) => void }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const markersRef = useRef<Record<number, L.Marker>>({});
  const onSelectRef = useRef(onSelect);
  onSelectRef.current = onSelect;

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;
    const map = L.map(containerRef.current, { scrollWheelZoom: false }).setView([6.9, -1.0], 7);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      maxZoom: 18,
    }).addTo(map);
    mapRef.current = map;
    return () => { map.remove(); mapRef.current = null; };
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    Object.values(markersRef.current).forEach((marker) => marker.remove());
    const next: Record<number, L.Marker> = {};
    points.forEach((point) => {
      const marker = L.marker([point.latitude, point.longitude]).addTo(map).bindPopup(point.name);
      marker.on('click', () => onSelectRef.current?.(point.id));
      next[point.id] = marker;
    });
    markersRef.current = next;
    if (points.length > 0) {
      map.fitBounds(L.latLngBounds(points.map((point): [number, number] => [point.latitude, point.longitude])), { padding: [28, 28], maxZoom: 12 });
    }
  }, [points]);

  useEffect(() => {
    if (selectedId == null) return;
    markersRef.current[selectedId]?.openPopup();
  }, [selectedId]);

  return <div ref={containerRef} data-testid="map-directory" className="h-80 w-full overflow-hidden rounded-2xl border border-[hsl(var(--border))]" />;
}
