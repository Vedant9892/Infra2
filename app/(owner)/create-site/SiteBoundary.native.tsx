import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import MapView, { Marker, Polygon, Overlay, MapPressEvent } from 'react-native-maps';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import { SiteFormData } from './_types';
import { styles } from './_styles';

interface Props {
    data: SiteFormData;
    onChange: (data: SiteFormData) => void;
    onSubmit: () => void;
}

export default function SiteBoundary({ data, onChange, onSubmit }: Props) {
    const [mode, setMode] = useState<'draw' | 'upload'>('draw');

    const [region, setRegion] = useState({
        latitude: data.latitude,
        longitude: data.longitude,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
    });

    const handleMapPress = (e: MapPressEvent) => {
        if (mode === 'draw') {
            const { coordinate } = e.nativeEvent;
            const newBoundary = [...data.boundary, coordinate];
            onChange({ ...data, boundary: newBoundary });
        }
    };

    const handleUndo = () => {
        if (data.boundary.length > 0) {
            const newBoundary = [...data.boundary];
            newBoundary.pop();
            onChange({ ...data, boundary: newBoundary });
        }
    };

    const handleClear = () => {
        onChange({ ...data, boundary: [] });
    };

    const pickImage = async () => {
        const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();

        if (permissionResult.granted === false) {
            alert("Permission to access camera roll is required!");
            return;
        }

        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            quality: 0.8,
            base64: true,
        });

        if (!result.canceled && result.assets && result.assets.length > 0) {
            const asset = result.assets[0];
            const imageBase64 = `data:${asset.type || 'image/jpeg'};base64,${asset.base64}`;

            onChange({
                ...data,
                overlayImage: imageBase64,
                overlaySettings: {
                    ...data.overlaySettings!,
                    scale: 0.002,
                    opacity: 0.7
                }
            });
            setMode('upload');
        }
    };

    const getOverlayBounds = () => {
        if (!data.overlaySettings) return undefined;
        const { scale } = data.overlaySettings;
        const halfScale = scale / 2;
        return [
            [data.latitude - halfScale, data.longitude - halfScale],
            [data.latitude + halfScale, data.longitude + halfScale]
        ];
    };

    const updateOverlaySetting = (setting: 'opacity' | 'scale', change: number) => {
        const current = data.overlaySettings?.[setting] || 0;
        let newValue = current + change;

        if (setting === 'opacity') newValue = Math.max(0.1, Math.min(1, newValue));
        if (setting === 'scale') newValue = Math.max(0.0005, Math.min(0.02, newValue));

        onChange({
            ...data,
            overlaySettings: {
                ...data.overlaySettings!,
                [setting]: newValue
            }
        });
    };

    return (
        <View style={styles.mapContainer}>
            <MapView
                style={StyleSheet.absoluteFill}
                region={region}
                onRegionChangeComplete={setRegion}
                onPress={handleMapPress}
                mapType="satellite"
            >
                <Marker coordinate={{ latitude: data.latitude, longitude: data.longitude }} pinColor="indigo" />

                {data.boundary.length > 0 && (
                    <Polygon
                        coordinates={data.boundary}
                        fillColor="rgba(139, 92, 246, 0.3)"
                        strokeColor="#8B5CF6"
                        strokeWidth={2}
                    />
                )}

                {mode === 'draw' && data.boundary.length > 0 && (
                    <Marker coordinate={data.boundary[data.boundary.length - 1]} pinColor="violet">
                        <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: '#8B5CF6' }} />
                    </Marker>
                )}

                {data.overlayImage && (
                    <Overlay
                        image={{ uri: data.overlayImage }}
                        bounds={getOverlayBounds() as any}
                        opacity={data.overlaySettings?.opacity || 0.7}
                    />
                )}
            </MapView>

            <View style={{ position: 'absolute', bottom: 0, left: 0, right: 0 }}>
                <View style={styles.controlPanel}>

                    <View style={styles.toggleContainer}>
                        <TouchableOpacity
                            style={[styles.toggleButton, mode === 'draw' && styles.toggleButtonActive]}
                            onPress={() => setMode('draw')}
                        >
                            <Text style={[styles.toggleText, mode === 'draw' && styles.toggleTextActive]}>📍 Draw Boundary</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={[styles.toggleButton, mode === 'upload' && styles.toggleButtonActive]}
                            onPress={() => setMode('upload')}
                        >
                            <Text style={[styles.toggleText, mode === 'upload' && styles.toggleTextActive]}>📤 Overlay Plan</Text>
                        </TouchableOpacity>
                    </View>

                    {mode === 'draw' ? (
                        <View>
                            <Text style={styles.sliderLabelRow}>
                                Points: {data.boundary.length} (Min 3)
                                {data.boundary.length >= 3 && <Text style={{ color: '#10B981' }}> ✅ Valid</Text>}
                            </Text>
                            <View style={{ flexDirection: 'row', gap: 10, marginTop: 10 }}>
                                <TouchableOpacity style={[styles.sliderBtn, { flex: 1, backgroundColor: '#FEF2F2' }]} onPress={handleUndo}>
                                    <Text style={[styles.sliderBtnText, { color: '#EF4444', fontSize: 14 }]}>Undo Last</Text>
                                </TouchableOpacity>
                                <TouchableOpacity style={[styles.sliderBtn, { flex: 1, backgroundColor: '#F3F4F6' }]} onPress={handleClear}>
                                    <Text style={[styles.sliderBtnText, { color: '#6B7280', fontSize: 14 }]}>Clear All</Text>
                                </TouchableOpacity>
                            </View>
                            <Text style={{ fontSize: 12, color: '#9CA3AF', marginTop: 8, textAlign: 'center' }}>
                                Tap on map to add boundary points
                            </Text>
                        </View>
                    ) : (
                        <View style={styles.overlayControls}>
                            {data.overlayImage ? (
                                <>
                                    <View style={styles.sliderRow}>
                                        <View style={styles.sliderLabelRow}>
                                            <Text style={styles.sliderLabel}>Opacity</Text>
                                            <Text style={styles.sliderValue}>{Math.round((data.overlaySettings?.opacity || 0) * 100)}%</Text>
                                        </View>
                                        <View style={styles.sliderButtons}>
                                            <TouchableOpacity style={styles.sliderBtn} onPress={() => updateOverlaySetting('opacity', -0.1)}><Text style={styles.sliderBtnText}>-</Text></TouchableOpacity>
                                            <View style={{ flex: 1 }} />
                                            <TouchableOpacity style={styles.sliderBtn} onPress={() => updateOverlaySetting('opacity', 0.1)}><Text style={styles.sliderBtnText}>+</Text></TouchableOpacity>
                                        </View>
                                    </View>

                                    <View style={styles.sliderRow}>
                                        <View style={styles.sliderLabelRow}>
                                            <Text style={styles.sliderLabel}>Size / Scale</Text>
                                            <Text style={styles.sliderValue}>{(data.overlaySettings?.scale || 0).toFixed(4)}</Text>
                                        </View>
                                        <View style={styles.sliderButtons}>
                                            <TouchableOpacity style={styles.sliderBtn} onPress={() => updateOverlaySetting('scale', -0.0001)}><Text style={styles.sliderBtnText}>-</Text></TouchableOpacity>
                                            <View style={{ flex: 1 }} />
                                            <TouchableOpacity style={styles.sliderBtn} onPress={() => updateOverlaySetting('scale', 0.0001)}><Text style={styles.sliderBtnText}>+</Text></TouchableOpacity>
                                        </View>
                                    </View>

                                    <TouchableOpacity
                                        style={[styles.uploadButton, { padding: 10, marginTop: 8 }]}
                                        onPress={() => onChange({ ...data, overlayImage: undefined })}
                                    >
                                        <Text style={[styles.uploadText, { color: '#EF4444', marginTop: 0 }]}>Remove Overlay</Text>
                                    </TouchableOpacity>
                                </>
                            ) : (
                                <TouchableOpacity style={styles.uploadButton} onPress={pickImage}>
                                    <Ionicons name="image-outline" size={32} color="#9CA3AF" />
                                    <Text style={styles.uploadText}>Select Layout Image</Text>
                                </TouchableOpacity>
                            )}
                        </View>
                    )}

                    <TouchableOpacity
                        style={[
                            styles.btnPrimary,
                            { marginTop: 16 },
                            data.boundary.length < 3 ? { backgroundColor: '#C4B5FD' } : {}
                        ]}
                        onPress={onSubmit}
                        disabled={data.boundary.length < 3}
                    >
                        <Text style={styles.btnPrimaryText}>Create Site</Text>
                    </TouchableOpacity>

                </View>
            </View>
        </View>
    );
}
