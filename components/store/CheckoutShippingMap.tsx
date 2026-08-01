"use client";

import { useEffect, useRef, useState } from "react";
import {
  getDepartmentFocusPoint,
  getMunicipalityPoint,
} from "@/lib/colombia-geo";

const COLOMBIA_CENTER = { lat: 4.5709, lng: -74.2973 };
const DEFAULT_ZOOM = 5;
const CITY_ZOOM = 11;
const DEPT_ZOOM = 8;

type Props = {
  departmentCode: string;
  municipalityCode: string;
  className?: string;
};

/**
 * Mapa compacto del destino de envío (OpenStreetMap + Leaflet).
 * Al elegir departamento/municipio, centra el marcador en esa ciudad.
 */
export function CheckoutShippingMap({
  departmentCode,
  municipalityCode,
  className = "",
}: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<import("leaflet").Map | null>(null);
  const markerRef = useRef<import("leaflet").Marker | null>(null);
  const [mapReady, setMapReady] = useState(false);

  useEffect(() => {
    let cancelled = false;

    void (async () => {
      const L = (await import("leaflet")).default;
      await import("leaflet/dist/leaflet.css");

      if (cancelled || !containerRef.current || mapRef.current) return;

      const map = L.map(containerRef.current, {
        center: [COLOMBIA_CENTER.lat, COLOMBIA_CENTER.lng],
        zoom: DEFAULT_ZOOM,
        scrollWheelZoom: false,
        attributionControl: true,
      });

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution:
          '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
        maxZoom: 18,
      }).addTo(map);

      mapRef.current = map;
      requestAnimationFrame(() => {
        map.invalidateSize();
        if (!cancelled) setMapReady(true);
      });
      // Por si el layout termina de estabilizarse (sidebar más ancha / mapa más alto).
      window.setTimeout(() => {
        if (!cancelled) map.invalidateSize();
      }, 120);
    })();

    return () => {
      cancelled = true;
      setMapReady(false);
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
        markerRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    if (!mapReady) return;
    const map = mapRef.current;
    if (!map) return;

    void (async () => {
      const L = (await import("leaflet")).default;

      const point =
        getMunicipalityPoint(municipalityCode) ??
        getDepartmentFocusPoint(departmentCode);

      if (markerRef.current) {
        markerRef.current.remove();
        markerRef.current = null;
      }

      if (!point) {
        map.setView([COLOMBIA_CENTER.lat, COLOMBIA_CENTER.lng], DEFAULT_ZOOM, {
          animate: true,
        });
        return;
      }

      const zoom = municipalityCode ? CITY_ZOOM : DEPT_ZOOM;
      map.setView([point.lat, point.lng], zoom, { animate: true });

      const icon = L.divIcon({
        className: "checkout-ship-marker",
        html: `<span style="display:block;width:14px;height:14px;border-radius:9999px;background:#1c1917;border:2px solid #fff;box-shadow:0 1px 4px rgba(0,0,0,.35)"></span>`,
        iconSize: [14, 14],
        iconAnchor: [7, 7],
      });

      markerRef.current = L.marker([point.lat, point.lng], { icon })
        .addTo(map)
        .bindPopup(point.label)
        .openPopup();
    })();
  }, [departmentCode, municipalityCode, mapReady]);

  const hint = !departmentCode
    ? "Elige un departamento para ubicar el destino en el mapa."
    : !municipalityCode
      ? "Selecciona el municipio para precisar la ubicación."
      : null;

  return (
    <div className={className}>
      <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-stone-900">
        Ubicación en el mapa
      </p>
      <div
        ref={containerRef}
        className="h-52 w-full border border-stone-200 bg-stone-100 sm:h-60 [&_.leaflet-control-attribution]:text-[9px]"
        role="img"
        aria-label="Mapa del destino de envío"
      />
      {hint ? (
        <p className="mt-1.5 text-xs text-stone-500">{hint}</p>
      ) : null}
    </div>
  );
}
