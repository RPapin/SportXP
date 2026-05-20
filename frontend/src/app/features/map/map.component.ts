import { Component, AfterViewInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import * as L from 'leaflet';

const SPORT_FILTERS = [
  { value: '',            label: 'Tous',      color: '#6b7280' },
  { value: 'Run',         label: 'Course',    color: '#22c55e' },
  { value: 'TrailRun',    label: 'Trail',     color: '#84cc16' },
  { value: 'Ride',        label: 'Vélo',      color: '#3b82f6' },
  { value: 'MountainBikeRide', label: 'VTT', color: '#8b5cf6' },
];

const SPORT_COLORS: Record<string, string> = {
  Run: '#22c55e', TrailRun: '#84cc16',
  Ride: '#3b82f6', MountainBikeRide: '#8b5cf6', GravelRide: '#06b6d4',
};

@Component({
  selector: 'app-map',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="map-page">
      <div class="filter-bar">
        @for (f of filters; track f.value) {
          <button
            class="filter-chip"
            [class.active]="sportTypeFilter === f.value"
            [style.--chip-color]="f.color"
            (click)="setFilter(f.value)"
          >
            {{ f.label }}
          </button>
        }
      </div>
      <div id="leaflet-map" class="map-container"></div>
    </div>
  `,
  styles: [`
    .map-page {
      display: flex;
      flex-direction: column;
      height: 100%;
    }

    .filter-bar {
      display: flex;
      gap: 8px;
      padding: 10px 12px;
      background: white;
      border-bottom: 1px solid rgba(0,0,0,.08);
      overflow-x: auto;
      flex-shrink: 0;
      scrollbar-width: none;
    }
    .filter-bar::-webkit-scrollbar { display: none; }

    .filter-chip {
      display: inline-flex;
      align-items: center;
      padding: 6px 14px;
      border-radius: 999px;
      border: 1.5px solid var(--chip-color, #6b7280);
      background: transparent;
      color: var(--chip-color, #6b7280);
      font-size: 0.8rem;
      font-weight: 500;
      cursor: pointer;
      white-space: nowrap;
      font-family: inherit;
      transition: background 0.15s, color 0.15s;
    }

    .filter-chip.active {
      background: var(--chip-color, #6b7280);
      color: white;
    }

    .map-container {
      flex: 1;
      min-height: 0;
    }

    :global(.leaflet-popup-content-wrapper) {
      border-radius: 10px !important;
      box-shadow: 0 4px 16px rgba(0,0,0,.12) !important;
    }
    :global(.leaflet-popup-content) {
      font-family: 'Inter', system-ui, sans-serif !important;
      font-size: 0.82rem !important;
    }
  `],
})
export class MapComponent implements AfterViewInit, OnDestroy {
  sportTypeFilter = '';
  filters = SPORT_FILTERS;

  private map!: L.Map;
  private layerGroup!: L.LayerGroup;

  constructor(private http: HttpClient) {}

  ngAfterViewInit() {
    this.initMap();
    this.loadTraces();
  }

  ngOnDestroy() {
    this.map?.remove();
  }

  setFilter(value: string) {
    this.sportTypeFilter = value;
    this.loadTraces();
  }

  private initMap() {
    this.map = L.map('leaflet-map', { center: [46.5, 2.5], zoom: 6, zoomControl: false });

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap',
    }).addTo(this.map);

    L.control.zoom({ position: 'topright' }).addTo(this.map);

    this.layerGroup = L.layerGroup().addTo(this.map);

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition((pos) => {
        this.map.setView([pos.coords.latitude, pos.coords.longitude], 12);
      });
    }
  }

  private loadTraces() {
    const params = new URLSearchParams();
    if (this.sportTypeFilter) params.set('sportType', this.sportTypeFilter);

    this.http.get<any[]>(`${environment.apiUrl}/api/activities/map?${params}`).subscribe({
      next: (rows) => this.renderTraces(rows),
    });
  }

  private renderTraces(rows: any[]) {
    this.layerGroup.clearLayers();

    for (const row of rows) {
      if (!row.geojson) continue;
      const geoJSON = typeof row.geojson === 'string' ? JSON.parse(row.geojson) : row.geojson;
      const coords: [number, number][] = geoJSON.coordinates.map(
        ([lng, lat]: [number, number]) => [lat, lng]
      );
      const color = SPORT_COLORS[row.a_sport_type] ?? '#2563eb';
      const polyline = L.polyline(coords, { color, weight: 3.5, opacity: 0.85 });

      polyline.bindPopup(`
        <div style="font-weight:600;margin-bottom:3px">${row.a_name ?? 'Activité'}</div>
        <div style="color:#6b7280">${row.u_first_name ?? ''} ${row.u_last_name ?? ''}</div>
        <div style="margin-top:4px;color:#2563eb;font-weight:600">
          ${((row.a_distance_m ?? 0) / 1000).toFixed(1)} km · +${Math.round(row.a_xp_earned ?? 0)} XP
        </div>
      `);

      this.layerGroup.addLayer(polyline);
    }
  }
}
