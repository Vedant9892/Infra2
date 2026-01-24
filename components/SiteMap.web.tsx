import React, { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

type SiteMapProps = {
    style?: any;
    initialRegion: {
        latitude: number;
        longitude: number;
        latitudeDelta?: number;
        longitudeDelta?: number;
    };
    onPress: (event: { nativeEvent: { coordinate: { latitude: number; longitude: number } } }) => void;
    selectedLocation: {
        latitude: number;
        longitude: number;
    };
    siteName: string;
    radius: number;
};

export default function SiteMap({
    style,
    onPress,
    selectedLocation,
    radius,
    initialRegion,
}: SiteMapProps) {
    const mapRef = useRef<HTMLDivElement>(null);
    const [mapLoaded, setMapLoaded] = useState(false);
    const [leafletLoaded, setLeafletLoaded] = useState(false);

    useEffect(() => {
        // Load Leaflet CSS and JS from CDN
        const loadLeaflet = () => {
            if (typeof window === 'undefined') return;

            // Check if already loaded
            if ((window as any).L) {
                setLeafletLoaded(true);
                return;
            }

            // Load CSS
            const link = document.createElement('link');
            link.rel = 'stylesheet';
            link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
            document.head.appendChild(link);

            // Load JS
            const script = document.createElement('script');
            script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
            script.onload = () => {
                setLeafletLoaded(true);
            };
            document.body.appendChild(script);
        };

        loadLeaflet();
    }, []);

    useEffect(() => {
        if (!leafletLoaded || !mapRef.current || mapLoaded) return;

        const L = (window as any).L;
        if (!L) return;

        // Initialize map
        const map = L.map(mapRef.current, {
            center: [selectedLocation.latitude, selectedLocation.longitude],
            zoom: 15,
            zoomControl: true,
        });

        // Add OpenStreetMap tiles
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '© OpenStreetMap contributors',
            maxZoom: 19,
        }).addTo(map);

        // Add marker for selected location
        const marker = L.marker([selectedLocation.latitude, selectedLocation.longitude], {
            draggable: true,
        }).addTo(map);

        // Add circle for radius
        const circle = L.circle([selectedLocation.latitude, selectedLocation.longitude], {
            radius: radius,
            color: '#8B5CF6',
            fillColor: '#8B5CF6',
            fillOpacity: 0.2,
        }).addTo(map);

        // Handle map click
        map.on('click', (e: any) => {
            const { lat, lng } = e.latlng;
            marker.setLatLng([lat, lng]);
            circle.setLatLng([lat, lng]);
            onPress({
                nativeEvent: {
                    coordinate: { latitude: lat, longitude: lng },
                },
            });
        });

        // Handle marker drag
        marker.on('dragend', (e: any) => {
            const { lat, lng } = e.target.getLatLng();
            circle.setLatLng([lat, lng]);
            onPress({
                nativeEvent: {
                    coordinate: { latitude: lat, longitude: lng },
                },
            });
        });

        setMapLoaded(true);

        return () => {
            map.remove();
        };
    }, [leafletLoaded, selectedLocation, radius, onPress, mapLoaded]);

    if (!leafletLoaded) {
        return (
            <View style={[style, styles.container, styles.loading]}>
                <Ionicons name="map-outline" size={48} color="#9CA3AF" />
                <Text style={styles.loadingText}>Loading map...</Text>
            </View>
        );
    }

    return (
        <View style={[style, styles.container]}>
            <div
                ref={mapRef}
                style={{
                    width: '100%',
                    height: '100%',
                    minHeight: 400,
                    borderRadius: 12,
                    overflow: 'hidden',
                }}
            />
            <View style={styles.overlay}>
                <View style={styles.infoCard}>
                    <Ionicons name="location" size={20} color="#8B5CF6" />
                    <Text style={styles.infoText}>
                        {selectedLocation.latitude.toFixed(6)}, {selectedLocation.longitude.toFixed(6)}
                    </Text>
                </View>
                <View style={styles.infoCard}>
                    <Ionicons name="radio-button-on" size={20} color="#8B5CF6" />
                    <Text style={styles.infoText}>Radius: {radius}m</Text>
                </View>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        backgroundColor: '#F3F4F6',
        borderRadius: 12,
        overflow: 'hidden',
        position: 'relative',
    },
    loading: {
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: 400,
    },
    loadingText: {
        marginTop: 12,
        fontSize: 16,
        color: '#6B7280',
    },
    overlay: {
        position: 'absolute',
        top: 12,
        right: 12,
        gap: 8,
    },
    infoCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255, 255, 255, 0.95)',
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 8,
        gap: 8,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    infoText: {
        fontSize: 13,
        fontWeight: '600',
        color: '#111',
    },
});
