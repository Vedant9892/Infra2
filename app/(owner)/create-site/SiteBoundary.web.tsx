import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SiteFormData } from './_types';
import { styles } from './_styles';

interface Props {
    data: SiteFormData;
    onChange: (data: SiteFormData) => void;
    onSubmit: () => void;
}

export default function SiteBoundary({ data, onChange, onSubmit }: Props) {
    // Web Fallback Implementation
    return (
        <View style={styles.mapContainer}>
            <View style={webStyles.container}>
                <Ionicons name="map-outline" size={64} color="#9CA3AF" />
                <Text style={webStyles.title}>Map Drawing Not Supported on Web</Text>
                <Text style={webStyles.subtitle}>
                    The interactive boundary drawing and overlay features rely on native map capabilities.
                </Text>

                <View style={webStyles.infoBox}>
                    <Text style={webStyles.infoLabel}>Selected Center:</Text>
                    <Text style={webStyles.infoValue}>
                        {data.latitude.toFixed(6)}, {data.longitude.toFixed(6)}
                    </Text>

                    <Text style={webStyles.infoLabel}>Boundary Points:</Text>
                    <Text style={webStyles.infoValue}>
                        {data.boundary.length > 0 ? `${data.boundary.length} points marked` : 'None'}
                    </Text>
                </View>

                <Text style={webStyles.note}>
                    Please use the InfraTrace mobile app (Android/iOS) to configure site boundaries and simple overlays.
                </Text>

                {/* Allow submit if valid for testing purposes, or strictly block */}
                <TouchableOpacity
                    style={[
                        styles.btnPrimary,
                        { marginTop: 24, width: '100%', maxWidth: 400 },
                        data.boundary.length < 3 ? { backgroundColor: '#C4B5FD' } : {}
                    ]}
                    onPress={onSubmit}
                    disabled={data.boundary.length < 3}
                >
                    <Text style={styles.btnPrimaryText}>Create Site (Requires 3+ points)</Text>
                </TouchableOpacity>

                {/* Helper for web testing: Add dummy points */}
                <TouchableOpacity
                    onPress={() => {
                        // Add a dummy triangle around center
                        const d = 0.001;
                        onChange({
                            ...data,
                            boundary: [
                                { latitude: data.latitude + d, longitude: data.longitude },
                                { latitude: data.latitude - d, longitude: data.longitude + d },
                                { latitude: data.latitude - d, longitude: data.longitude - d }
                            ]
                        })
                    }}
                    style={{ marginTop: 16 }}
                >
                    <Text style={{ color: '#8B5CF6' }}>[Web Dev] Add Dummy Boundary</Text>
                </TouchableOpacity>
            </View>
        </View>
    );
}

const webStyles = StyleSheet.create({
    container: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        padding: 24,
        backgroundColor: '#F9FAFB',
    },
    title: {
        fontSize: 20,
        fontWeight: '700',
        color: '#111',
        marginTop: 16,
        marginBottom: 8,
        textAlign: 'center',
    },
    subtitle: {
        fontSize: 16,
        color: '#6B7280',
        textAlign: 'center',
        maxWidth: 400,
        marginBottom: 24,
    },
    infoBox: {
        backgroundColor: '#fff',
        padding: 16,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#E5E7EB',
        width: '100%',
        maxWidth: 400,
        marginBottom: 24,
    },
    infoLabel: {
        fontSize: 14,
        color: '#6B7280',
        marginBottom: 4,
    },
    infoValue: {
        fontSize: 16,
        fontWeight: '600',
        color: '#111',
        marginBottom: 12,
    },
    note: {
        fontSize: 14,
        color: '#EF4444',
        textAlign: 'center',
        maxWidth: 400,
        marginBottom: 8,
    },
});
