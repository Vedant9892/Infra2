import React from 'react';
import { View, StyleSheet } from 'react-native';
import MapView, { Marker, Circle, MapPressEvent } from 'react-native-maps';
import { Ionicons } from '@expo/vector-icons';

type SiteMapProps = {
    style?: any;
    initialRegion: {
        latitude: number;
        longitude: number;
        latitudeDelta: number;
        longitudeDelta: number;
    };
    onPress: (event: MapPressEvent) => void;
    selectedLocation: {
        latitude: number;
        longitude: number;
    };
    siteName: string;
    radius: number;
};

export default function SiteMap({
    style,
    initialRegion,
    onPress,
    selectedLocation,
    siteName,
    radius,
}: SiteMapProps) {
    return (
        <MapView
            style={style}
            initialRegion={initialRegion}
            onPress={onPress}
        >
            <Marker
                coordinate={selectedLocation}
                title={siteName}
                description="Site Center"
            >
                <View style={styles.markerContainer}>
                    <Ionicons name="business" size={32} color="#8B5CF6" />
                </View>
            </Marker>

            <Circle
                center={selectedLocation}
                radius={radius}
                fillColor="rgba(139, 92, 246, 0.2)"
                strokeColor="rgba(139, 92, 246, 0.8)"
                strokeWidth={2}
            />
        </MapView>
    );
}

const styles = StyleSheet.create({
    markerContainer: {
        backgroundColor: '#fff',
        padding: 8,
        borderRadius: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 4,
        elevation: 5,
    },
});
