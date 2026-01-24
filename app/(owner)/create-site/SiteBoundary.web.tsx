import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SiteFormData } from './_types';
import { styles } from './_styles';
import SiteMap from '../../../components/SiteMap.web';

interface Props {
    data: SiteFormData;
    onChange: (data: SiteFormData) => void;
    onSubmit: () => void;
}

export default function SiteBoundary({ data, onChange, onSubmit }: Props) {
    const [radius, setRadius] = useState(data.radius || 100); // Default 100m

    const handleMapPress = (event: { nativeEvent: { coordinate: { latitude: number; longitude: number } } }) => {
        const { latitude, longitude } = event.nativeEvent.coordinate;
        onChange({
            ...data,
            latitude,
            longitude,
        });
    };

    const handleRadiusChange = (newRadius: number) => {
        const clampedRadius = Math.max(50, Math.min(500, newRadius));
        setRadius(clampedRadius);
        // Update form data with radius
        onChange({
            ...data,
            radius: clampedRadius,
        });
    };

    return (
        <View style={styles.mapContainer}>
            <View style={webStyles.mapWrapper}>
                <SiteMap
                    style={webStyles.map}
                    initialRegion={{
                        latitude: data.latitude,
                        longitude: data.longitude,
                        latitudeDelta: 0.01,
                        longitudeDelta: 0.01,
                    }}
                    onPress={handleMapPress}
                    selectedLocation={{
                        latitude: data.latitude,
                        longitude: data.longitude,
                    }}
                    siteName={data.name}
                    radius={radius}
                />
            </View>

            <View style={styles.controlPanel}>
                <ScrollView showsVerticalScrollIndicator={false}>
                    <Text style={webStyles.sectionTitle}>Site GPS Location</Text>
                    <Text style={webStyles.instruction}>
                        Tap on the map to set your site center. Workers can mark attendance only within the radius.
                    </Text>

                    <View style={webStyles.coordsBox}>
                        <View style={webStyles.coordRow}>
                            <Ionicons name="location" size={20} color="#8B5CF6" />
                            <View style={webStyles.coordText}>
                                <Text style={webStyles.coordLabel}>Latitude</Text>
                                <Text style={webStyles.coordValue}>{data.latitude.toFixed(6)}</Text>
                            </View>
                        </View>
                        <View style={webStyles.coordRow}>
                            <Ionicons name="location" size={20} color="#8B5CF6" />
                            <View style={webStyles.coordText}>
                                <Text style={webStyles.coordLabel}>Longitude</Text>
                                <Text style={webStyles.coordValue}>{data.longitude.toFixed(6)}</Text>
                            </View>
                        </View>
                    </View>

                    <View style={webStyles.radiusSection}>
                        <Text style={webStyles.radiusLabel}>Attendance Radius: {radius}m</Text>
                        <Text style={webStyles.radiusSubtext}>Workers must be within this distance to mark attendance</Text>
                        
                        <View style={webStyles.radiusControls}>
                            <TouchableOpacity
                                style={webStyles.radiusButton}
                                onPress={() => handleRadiusChange(radius - 50)}
                                disabled={radius <= 50}
                            >
                                <Ionicons name="remove" size={20} color={radius <= 50 ? "#9CA3AF" : "#8B5CF6"} />
                            </TouchableOpacity>
                            
                            <View style={webStyles.radiusValueBox}>
                                <Text style={webStyles.radiusValue}>{radius}</Text>
                                <Text style={webStyles.radiusUnit}>meters</Text>
                            </View>
                            
                            <TouchableOpacity
                                style={webStyles.radiusButton}
                                onPress={() => handleRadiusChange(radius + 50)}
                                disabled={radius >= 500}
                            >
                                <Ionicons name="add" size={20} color={radius >= 500 ? "#9CA3AF" : "#8B5CF6"} />
                            </TouchableOpacity>
                        </View>

                        <View style={webStyles.radiusPresets}>
                            {[50, 100, 200, 300, 500].map((preset) => (
                                <TouchableOpacity
                                    key={preset}
                                    style={[
                                        webStyles.presetButton,
                                        radius === preset && webStyles.presetButtonActive,
                                    ]}
                                    onPress={() => handleRadiusChange(preset)}
                                >
                                    <Text style={[
                                        webStyles.presetText,
                                        radius === preset && webStyles.presetTextActive,
                                    ]}>
                                        {preset}m
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                    </View>

                    <TouchableOpacity
                        style={[styles.btnPrimary, webStyles.submitButton]}
                        onPress={() => {
                            // Store radius in form data before submit
                            onSubmit();
                        }}
                    >
                        <Ionicons name="checkmark-circle" size={20} color="#fff" />
                        <Text style={styles.btnPrimaryText}>Confirm & Create Site</Text>
                    </TouchableOpacity>
                </ScrollView>
            </View>
        </View>
    );
}

const webStyles = StyleSheet.create({
    mapWrapper: {
        flex: 1,
        minHeight: 400,
    },
    map: {
        flex: 1,
        width: '100%',
        minHeight: 400,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#111',
        marginBottom: 8,
    },
    instruction: {
        fontSize: 14,
        color: '#6B7280',
        marginBottom: 20,
        lineHeight: 20,
    },
    coordsBox: {
        backgroundColor: '#F9FAFB',
        borderRadius: 12,
        padding: 16,
        marginBottom: 20,
        borderWidth: 1,
        borderColor: '#E5E7EB',
    },
    coordRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
    },
    coordText: {
        marginLeft: 12,
        flex: 1,
    },
    coordLabel: {
        fontSize: 12,
        color: '#6B7280',
        marginBottom: 2,
    },
    coordValue: {
        fontSize: 16,
        fontWeight: '700',
        color: '#111',
        fontFamily: 'monospace',
    },
    radiusSection: {
        marginBottom: 24,
    },
    radiusLabel: {
        fontSize: 16,
        fontWeight: '700',
        color: '#111',
        marginBottom: 4,
    },
    radiusSubtext: {
        fontSize: 13,
        color: '#6B7280',
        marginBottom: 16,
    },
    radiusControls: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#F3E8FF',
        borderRadius: 12,
        padding: 16,
        marginBottom: 12,
    },
    radiusButton: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: '#fff',
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 2,
        borderColor: '#8B5CF6',
    },
    radiusValueBox: {
        flex: 1,
        alignItems: 'center',
        marginHorizontal: 20,
    },
    radiusValue: {
        fontSize: 32,
        fontWeight: '700',
        color: '#8B5CF6',
    },
    radiusUnit: {
        fontSize: 12,
        color: '#6B7280',
        marginTop: 4,
    },
    radiusPresets: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
    },
    presetButton: {
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 8,
        backgroundColor: '#F3F4F6',
        borderWidth: 1,
        borderColor: '#E5E7EB',
    },
    presetButtonActive: {
        backgroundColor: '#8B5CF6',
        borderColor: '#8B5CF6',
    },
    presetText: {
        fontSize: 13,
        fontWeight: '600',
        color: '#6B7280',
    },
    presetTextActive: {
        color: '#fff',
    },
    submitButton: {
        marginTop: 8,
        gap: 8,
    },
});
