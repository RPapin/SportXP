import { Component, OnInit, AfterViewInit, OnDestroy, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { environment } from '../../../environments/environment';
import * as L from 'leaflet';

@Component({
  selector: 'app-map',
  standalone: true,
  imports: [CommonModule, FormsModule, MatCardModule, MatSelectModule, MatButtonModule],
  template: `
    <div class="map-page">
      <div class="map-filters">
        <mat-select [(ngModel)]="sportTypeFilter" placeholder="Type d'activité">
          <mat-option value="">Tous</mat-option>
          <mat-option value="Run">Course</mat-option>
          <mat-option value="Ride">Vélo</mat-option>
          <mat-option value="Hike">Randonnée</mat-option>
          <mat-option value="Walk">Marche</mat-option>
        </mat-select>
        <button mat-raised-button color="primary" (click)="applyFilters()">Filtrer</button>
      </div>
      <div id="leaflet-map" class="map-container"></div>
    </div>
  `,
  styles: [`
    .map-page { display: flex; flex-direction: column; height: calc(100vh - 64px); }
    .map-filters { display: flex; gap: 1rem; align-items: center; padding: 0.75rem 1rem; background: white; box-shadow: 0 2px 4px rgba(0,0,0,.1); }
    .map-filters mat-select { min-width: 180px; }
    .map-container { flex: 1; }
  `],
})
export class MapComponent implements AfterViewInit, OnDestroy {
  sportTypeFilter = '';
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

  private initMap() {
    this.map = L.map('leaflet-map', { center: [46.5, 2.5], zoom: 6 });
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors',
    }).addTo(this.map);
    this.layerGroup = L.layerGroup().addTo(this.map);

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition((pos) => {
        this.map.setView([pos.coords.latitude, pos.coords.longitude], 12);
      });
    }
  }

  applyFilters() {
    this.loadTraces();
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

      const coords: [number, number][] = geoJSON.coordinates.map(([lng, lat]: [number, number]) => [lat, lng]);
      const polyline = L.polyline(coords, { color: '#e67e22', weight: 3, opacity: 0.8 });

      polyline.bindPopup(`
        <strong>${row.a_name ?? 'Activité'}</strong><br>
        ${row.u_first_name ?? ''} ${row.u_last_name ?? ''}<br>
        ${((row.a_distance_m ?? 0) / 1000).toFixed(1)} km · +${Math.round(row.a_xp_earned ?? 0)} XP
      `);

      this.layerGroup.addLayer(polyline);
    }
  }
}
