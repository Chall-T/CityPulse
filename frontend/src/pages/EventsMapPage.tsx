import React, { useEffect, useRef, useState } from 'react';
import { useClusterStore, useFilterStore } from '../store/eventStore';
import { EventCard } from '../components/EventCard';
import EventMapFilters from '../components/EventMapFilters';
import { MapContainer, TileLayer, Marker, Popup, useMap, useMapEvents } from 'react-leaflet';
import MarkerClusterGroup from 'react-leaflet-markercluster';
import type { LatLngExpression, Map as LeafletMap } from 'leaflet';
import 'leaflet/dist/leaflet.css';

const EventPage: React.FC = () => {
    const { clusters, fetchClusters, loading } = useClusterStore();
    const { selectedCategories } = useFilterStore();

    const [coords, setCoords] = useState<LatLngExpression>([52.510885, 13.3989367]); // Berlin
    const [zoom, setZoom] = useState(10);

    const mapRef = useRef<LeafletMap | null>(null);


    const handleBoundsFetch = (bounds: any, newZoom: number) => {
        const southWest = bounds.getSouthWest();
        const northEast = bounds.getNorthEast();
        console.log(selectedCategories)
        fetchClusters({
            minLat: southWest.lat,
            maxLat: northEast.lat,
            minLng: southWest.lng,
            maxLng: northEast.lng,
            zoom: newZoom,
            categoryIds: selectedCategories,
        });
    };

    const didInitialFetch = useRef(false);

    const MapEvents = () => {
        const map = useMap();

        useMapEvents({
            moveend: () => {
                // Only fetch on moves after initial fetch
                if (didInitialFetch.current) {
                    const bounds = map.getBounds();
                    const zoom = map.getZoom();
                    setZoom(zoom);
                    handleBoundsFetch(bounds, zoom);
                }
            },
        });

        useEffect(() => {
            if (!didInitialFetch.current && map && map.getBounds) {
                const bounds = map.getBounds();
                const currentZoom = map.getZoom();
                setZoom(currentZoom);
                handleBoundsFetch(bounds, currentZoom);
                didInitialFetch.current = true; // mark initial fetch done
            }
        }, [map]);

        return null;
    };


    return (
        <main className="max-w-7xl mx-auto px-4 py-10">
            <h1 className="text-4xl font-bold text-center mb-10">Find and Discover Events</h1>

            <EventMapFilters />

            <div className="h-[600px] w-full mt-10 relative">
                {loading && (
                    <div className="absolute inset-0 flex items-center justify-center bg-white/70 z-10">
                        <div className="text-lg font-semibold text-gray-600">Loading events...</div>
                    </div>
                )}

                <MapContainer
                    center={coords}
                    zoom={zoom}
                    scrollWheelZoom={true}
                    className="h-full w-full rounded-lg"
                    ref={(mapInstance) => {
                        if (mapInstance) {
                            mapRef.current = mapInstance;
                        }
                    }}
                >


                    <MapEvents />

                    <TileLayer
                        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                        attribution='&copy; <a href="http://osm.org/copyright">OpenStreetMap</a> contributors'
                    />

                    <MarkerClusterGroup>
                        {clusters.map((cluster) => (
                            <Marker
                                key={cluster.geohash}
                                position={[cluster.lat, cluster.lng] as LatLngExpression}
                            >
                                <Popup>
                                    <div className="max-w-xs">
                                        <h3 className="font-bold">{cluster.count}</h3>
                                    </div>
                                </Popup>
                            </Marker>
                        ))}
                    </MarkerClusterGroup>
                </MapContainer>
            </div>
        </main>
    );
};

export default EventPage;
