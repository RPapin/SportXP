import { Component, Input, AfterViewInit, OnDestroy, ElementRef, ViewChild } from '@angular/core';
import * as L from 'leaflet';

@Component({
  selector: 'app-activity-map-preview',
  standalone: true,
  template: `<div #mapEl class="map-wrap"></div>`,
  styles: [`
    :host { display: block; }
    .map-wrap { width: 100%; height: 160px; background: #e5e7eb; }
  `],
})
export class ActivityMapPreviewComponent implements AfterViewInit, OnDestroy {
  @ViewChild('mapEl', { static: true }) mapEl!: ElementRef<HTMLDivElement>;
  @Input() geojson: any = null;
  @Input() color = '#3b82f6';

  private map?: L.Map;

  ngAfterViewInit() {
    if (!this.geojson?.coordinates?.length) return;

    this.map = L.map(this.mapEl.nativeElement, {
      zoomControl: false,
      attributionControl: false,
      dragging: false,
      scrollWheelZoom: false,
      touchZoom: false,
      doubleClickZoom: false,
      keyboard: false,
      boxZoom: false,
    });

    L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
      maxZoom: 19,
    }).addTo(this.map);

    const coords: [number, number][] = this.geojson.coordinates.map(
      ([lng, lat]: [number, number]) => [lat, lng] as [number, number]
    );

    const polyline = L.polyline(coords, {
      color: this.color,
      weight: 4,
      opacity: 0.9,
    }).addTo(this.map);

    this.map.fitBounds(polyline.getBounds(), { padding: [16, 16] });
  }

  ngOnDestroy() {
    this.map?.remove();
  }
}
