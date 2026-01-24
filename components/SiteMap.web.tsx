import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

type SiteMapProps = {
    style?: any;
    initialRegion: any;
    onPress: (event: any) => void;
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
}: SiteMapProps) {
    // Mock event for web click simulation if needed, or just display coordinates
    const handlePress = () => {
        // Web map interaction is strictly limited in this placeholder
        // Ensure we don't crash if interaction is attempted
        if (onPress) {
            // Mock event object if strictly necessary, but better to just ignore for now
        }
    };

    return (
        <View style={[style, styles.container]}>
            <View style={styles.content}>
                <Ionicons name="map-outline" size={48} color="#9CA3AF" />
                <Text style={styles.text}>Map View is not supported on Web</Text>
                <Text style={styles.subText}>
                    Selected: {selectedLocation.latitude.toFixed(4)}, {selectedLocation.longitude.toFixed(4)}
                </Text>
                <Text style={styles.note}>Please use the mobile app to set precise location.</Text>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        backgroundColor: '#F3F4F6',
        alignItems: 'center',
        justifyContent: 'center',
    },
    content: {
        alignItems: 'center',
        padding: 20,
    },
    text: {
        marginTop: 12,
        fontSize: 16,
        fontWeight: '600',
        color: '#374151',
    },
    subText: {
        marginTop: 8,
        fontSize: 14,
        color: '#6B7280',
        fontFamily: 'monospace',
    },
    note: {
        marginTop: 4,
        fontSize: 12,
        color: '#9CA3AF',
    }
});
