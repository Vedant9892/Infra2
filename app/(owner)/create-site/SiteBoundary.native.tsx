import React, { useState, useRef, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, TextInput, ScrollView, Alert } from 'react-native';
import MapView, { Marker, Polygon, Overlay, MapPressEvent } from 'react-native-maps';
import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';
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
    const [searchQuery, setSearchQuery] = useState('');
    const [searching, setSearching] = useState(false);
    const [mapLoaded, setMapLoaded] = useState(false);
    const [showFallback, setShowFallback] = useState(false);
    const mapRef = useRef<MapView>(null);

    const [region, setRegion] = useState({
        latitude: data.latitude,
        longitude: data.longitude,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
    });

    // Fallback timer if map doesn't load
    useEffect(() => {
        const timer = setTimeout(() => {
            if (!mapLoaded) {
                setShowFallback(true);
            }
        }, 3000);
        return () => clearTimeout(timer);
    }, [mapLoaded]);

    const addQuickBoundary = () => {
        const size = 0.002;
        const newBoundary = [
            { latitude: data.latitude + size, longitude: data.longitude - size },
            { latitude: data.latitude + size, longitude: data.longitude + size },
            { latitude: data.latitude - size, longitude: data.longitude + size },
            { latitude: data.latitude - size, longitude: data.longitude - size },
        ];
        onChange({ ...data, boundary: newBoundary });
        Alert.alert('Success', 'Default boundary added! You can now create the site.');
    };

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
            // Provide feedback
            Alert.alert('Point Removed', `Removed last point. ${newBoundary.length} points remaining.`);
        }
    };

    const handleClear = () => {
        if (data.boundary.length > 0) {
            Alert.alert(
                'Clear All Points',
                'Are you sure you want to remove all boundary points?',
                [
                    { text: 'Cancel', style: 'cancel' },
                    {
                        text: 'Clear All',
                        style: 'destructive',
                        onPress: () => {
                            onChange({ ...data, boundary: [] });
                            Alert.alert('Cleared', 'All boundary points have been removed.');
                        }
                    }
                ]
            );
        }
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
            quality: 1,
            base64: true,
        });

        if (!result.canceled && result.assets[0].base64) {
            onChange({
                ...data,
                overlayImage: `data:image/jpeg;base64,${result.assets[0].base64}`
            });
        }
    };

    const getOverlayBounds = () => {
        const scale = data.overlaySettings?.scale || 0.004;
        return [
            [data.latitude - scale, data.longitude - scale],
            [data.latitude + scale, data.longitude + scale],
        ];
    };

    const handleOverlaySetting = (setting: 'opacity' | 'scale' | 'rotation', value: number) => {
        onChange({
            ...data,
            overlaySettings: {
                ...data.overlaySettings!,
                [setting]: value
            }
        });
    };

    const searchLocation = async () => {
        if (!searchQuery.trim()) return;

        setSearching(true);
        try {
            // Request permission first
            const { status } = await Location.requestForegroundPermissionsAsync();
            if (status !== 'granted') {
                alert('Location permission needed for search. You can still draw the boundary manually.');
                setSearching(false);
                return;
            }

            // Use geocoding to find location
            const results = await Location.geocodeAsync(searchQuery);

            if (results && results.length > 0) {
                const location = results[0];
                const newRegion = {
                    latitude: location.latitude,
                    longitude: location.longitude,
                    latitudeDelta: 0.01,
                    longitudeDelta: 0.01,
                };

                // Animate map to searched location
                mapRef.current?.animateToRegion(newRegion, 1000);
                setRegion(newRegion);

                // Update form data with new coordinates
                onChange({
                    ...data,
                    latitude: location.latitude,
                    longitude: location.longitude,
                });
            } else {
                alert('Location not found. Please try a different search term.');
            }
        } catch (error) {
            console.error('Search error:', error);
            alert('Search failed. You can still draw the boundary manually.');
        } finally {
            setSearching(false);
        }
    };

    return (
        <View style={styles.mapContainer}>
            {/* Search Bar */}
            <View style={localStyles.searchContainer}>
                <View style={localStyles.searchBar}>
                    <Ionicons name="search" size={20} color="#6B7280" style={localStyles.searchIcon} />
                    <TextInput
                        style={localStyles.searchInput}
                        placeholder="Search for a location..."
                        placeholderTextColor="#9CA3AF"
                        value={searchQuery}
                        onChangeText={setSearchQuery}
                        onSubmitEditing={searchLocation}
                        returnKeyType="search"
                    />
                    {searchQuery.length > 0 && (
                        <TouchableOpacity onPress={() => setSearchQuery('')} style={localStyles.clearButton}>
                            <Ionicons name="close-circle" size={20} color="#9CA3AF" />
                        </TouchableOpacity>
                    )}
                </View>
                {searchQuery.length > 0 && (
                    <TouchableOpacity
                        style={localStyles.searchButton}
                        onPress={searchLocation}
                        disabled={searching}
                    >
                        <Text style={localStyles.searchButtonText}>
                            {searching ? 'Searching...' : 'Search'}
                        </Text>
                    </TouchableOpacity>
                )}
            </View>

            <MapView
                ref={mapRef}
                style={StyleSheet.absoluteFill}
                initialRegion={region}
                onRegionChangeComplete={setRegion}
                onPress={handleMapPress}
                onMapReady={() => setMapLoaded(true)}
                mapType="standard"
                showsUserLocation={false}
                showsMyLocationButton={false}
                rotateEnabled={false}
                pitchEnabled={false}
            >
                {data.boundary.length > 0 && (
                    <Polygon
                        coordinates={data.boundary}
                        fillColor="rgba(139, 92, 246, 0.3)"
                        strokeColor="#8B5CF6"
                        strokeWidth={2}
                    />
                )}

                {mode === 'draw' && data.boundary.map((point, index) => (
                    <Marker 
                        key={index} 
                        coordinate={point} 
                        pinColor="violet"
                        title={`Point ${index + 1}`}
                    />
                ))}

                {mode === 'draw' && data.boundary.length > 0 && (
                    <Marker coordinate={data.boundary[data.boundary.length - 1]} pinColor="violet">
                        <View style={{ width: 12, height: 12, borderRadius: 6, backgroundColor: '#8B5CF6', borderWidth: 2, borderColor: '#fff' }} />
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

            {/* Fallback Button if Map Doesn't Load */}
            {showFallback && data.boundary.length === 0 && (
                <View style={localStyles.fallbackContainer}>
                    <Text style={localStyles.fallbackText}>Map taking too long?</Text>
                    <TouchableOpacity
                        style={localStyles.fallbackButton}
                        onPress={addQuickBoundary}
                    >
                        <Text style={localStyles.fallbackButtonText}>⚡ Use Default Boundary</Text>
                    </TouchableOpacity>
                    <Text style={localStyles.fallbackHint}>Creates boundary at {data.address}</Text>
                </View>
            )}

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
                        <>
                            <View style={localStyles.pointsCounter}>
                                <View style={localStyles.pointsBadge}>
                                    <Ionicons name="location" size={18} color="#8B5CF6" />
                                    <Text style={localStyles.pointsText}>
                                        {data.boundary.length} Point{data.boundary.length !== 1 ? 's' : ''}
                                    </Text>
                                </View>
                                <Text style={localStyles.pointsHint}>
                                    {data.boundary.length < 3 ? `Need ${3 - data.boundary.length} more` : '✓ Ready to create'}
                                </Text>
                            </View>

                            {/* Action Buttons */}
                            <View style={localStyles.actionButtonsContainer}>
                                <TouchableOpacity
                                    style={[
                                        localStyles.actionButton,
                                        localStyles.undoButton,
                                        data.boundary.length === 0 && localStyles.buttonDisabled
                                    ]}
                                    onPress={handleUndo}
                                    disabled={data.boundary.length === 0}
                                    activeOpacity={0.7}
                                >
                                    <View style={localStyles.buttonContent}>
                                        <Ionicons 
                                            name="arrow-undo" 
                                            size={22} 
                                            color={data.boundary.length === 0 ? "#9CA3AF" : "#8B5CF6"} 
                                        />
                                        <Text style={[
                                            localStyles.actionButtonText,
                                            data.boundary.length === 0 && { color: "#9CA3AF" }
                                        ]}>
                                            Undo Last
                                        </Text>
                                    </View>
                                </TouchableOpacity>

                                <TouchableOpacity
                                    style={[
                                        localStyles.actionButton,
                                        localStyles.clearButton,
                                        data.boundary.length === 0 && localStyles.buttonDisabled
                                    ]}
                                    onPress={handleClear}
                                    disabled={data.boundary.length === 0}
                                    activeOpacity={0.7}
                                >
                                    <View style={localStyles.buttonContent}>
                                        <Ionicons 
                                            name="trash" 
                                            size={22} 
                                            color={data.boundary.length === 0 ? "#9CA3AF" : "#EF4444"} 
                                        />
                                        <Text style={[
                                            localStyles.actionButtonText,
                                            localStyles.clearButtonText,
                                            data.boundary.length === 0 && { color: "#9CA3AF" }
                                        ]}>
                                            Clear All
                                        </Text>
                                    </View>
                                </TouchableOpacity>
                            </View>

                            <Text style={styles.helpText}>
                                {data.boundary.length === 0 
                                    ? "📍 Tap on the map to add boundary points" 
                                    : `📍 Tap map to add • Use Undo to remove last point`
                                }
                            </Text>
                        </>
                    ) : (
                        <>
                            {!data.overlayImage ? (
                                <TouchableOpacity style={styles.btnPrimary} onPress={pickImage}>
                                    <Text style={styles.btnPrimaryText}>Upload Site Plan Image</Text>
                                </TouchableOpacity>
                            ) : (
                                <>
                                    <Text style={styles.instructionText}>Adjust Overlay:</Text>
                                    <Text style={styles.helpText}>Opacity: {(data.overlaySettings?.opacity || 0.7) * 100}%</Text>
                                    <Text style={styles.helpText}>Scale: {data.overlaySettings?.scale || 0.004}</Text>
                                    <TouchableOpacity style={styles.btnSecondary} onPress={() => onChange({ ...data, overlayImage: undefined })}>
                                        <Text style={styles.btnSecondaryText}>Remove Overlay</Text>
                                    </TouchableOpacity>
                                </>
                            )}
                        </>
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

const localStyles = StyleSheet.create({
    searchContainer: {
        position: 'absolute',
        top: 20,
        left: 16,
        right: 16,
        zIndex: 10,
        flexDirection: 'row',
        gap: 8,
    },
    searchBar: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FFFFFF',
        borderRadius: 12,
        paddingHorizontal: 16,
        paddingVertical: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.15,
        shadowRadius: 8,
        elevation: 5,
    },
    searchIcon: {
        marginRight: 12,
    },
    searchInput: {
        flex: 1,
        fontSize: 15,
        color: '#111827',
        padding: 0,
    },
    clearButton: {
        padding: 4,
    },
    searchButton: {
        backgroundColor: '#8B5CF6',
        borderRadius: 12,
        paddingHorizontal: 20,
        paddingVertical: 12,
        justifyContent: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.15,
        shadowRadius: 8,
        elevation: 5,
    },
    searchButtonText: {
        color: '#FFFFFF',
        fontSize: 15,
        fontWeight: '600',
    },
    fallbackContainer: {
        position: 'absolute',
        top: '40%',
        left: 32,
        right: 32,
        backgroundColor: 'rgba(255, 255, 255, 0.95)',
        borderRadius: 16,
        padding: 24,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 12,
        elevation: 8,
    },
    fallbackText: {
        fontSize: 16,
        color: '#374151',
        marginBottom: 16,
        textAlign: 'center',
    },
    fallbackButton: {
        backgroundColor: '#8B5CF6',
        paddingHorizontal: 24,
        paddingVertical: 14,
        borderRadius: 12,
        marginBottom: 12,
    },
    fallbackButtonText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: '600',
    },
    fallbackHint: {
        fontSize: 13,
        color: '#6B7280',
        textAlign: 'center',
    },
    pointsCounter: {
        marginBottom: 16,
        padding: 12,
        backgroundColor: '#F3E8FF',
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#E9D5FF',
    },
    pointsBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 6,
    },
    pointsText: {
        fontSize: 16,
        fontWeight: '700',
        color: '#8B5CF6',
        marginLeft: 8,
    },
    pointsHint: {
        fontSize: 13,
        color: '#6B7280',
        textAlign: 'center',
        fontWeight: '500',
    },
    actionButtonsContainer: {
        flexDirection: 'row',
        gap: 12,
        marginBottom: 12,
    },
    actionButton: {
        flex: 1,
        paddingVertical: 14,
        paddingHorizontal: 16,
        borderRadius: 12,
        borderWidth: 2,
        backgroundColor: '#FFFFFF',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    undoButton: {
        borderColor: '#8B5CF6',
    },
    clearButton: {
        borderColor: '#EF4444',
    },
    buttonContent: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
    },
    actionButtonText: {
        fontSize: 15,
        fontWeight: '600',
        color: '#8B5CF6',
    },
    clearButtonText: {
        color: '#EF4444',
    },
    buttonDisabled: {
        opacity: 0.4,
        backgroundColor: '#F3F4F6',
    },
});
