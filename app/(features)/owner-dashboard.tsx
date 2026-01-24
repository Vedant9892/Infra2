/** Owner's Dashboard – Essential. Frontend-only, mock. */
import React, { useState, useCallback, useEffect, useRef } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, RefreshControl, Dimensions, TextInput, Alert, ActivityIndicator } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import MapView, { Marker, Region } from 'react-native-maps';
import * as Location from 'expo-location';
import { DESIGN } from '../../constants/designSystem';
import { getOwnerDashboard } from '../../lib/mock-api';

const { width } = Dimensions.get('window');

export default function OwnerDashboardScreen() {
  const router = useRouter();
  const mapRef = useRef<MapView>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [userLocation, setUserLocation] = useState<Location.LocationObject | null>(null);
  const [locationAddress, setLocationAddress] = useState<string>('Loading location...');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [searchLocation, setSearchLocation] = useState<{ latitude: number; longitude: number; address: string } | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [mapRegion, setMapRegion] = useState<Region | null>(null);
  const dash = getOwnerDashboard();

  // Get user's current location
  useEffect(() => {
    const getLocation = async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
          setLocationAddress('Location permission denied');
          // Use default Mumbai coordinates if permission denied
          setUserLocation({
            coords: {
              latitude: 19.0760,
              longitude: 72.8777,
              altitude: null,
              accuracy: null,
              altitudeAccuracy: null,
              heading: null,
              speed: null,
            },
            timestamp: Date.now(),
          });
          return;
        }

        const location = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.High,
        });
        setUserLocation(location);

        // Set initial map region
        const region: Region = {
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
          latitudeDelta: 0.01,
          longitudeDelta: 0.01,
        };
        setMapRegion(region);

        // Get address from coordinates
        const address = await Location.reverseGeocodeAsync({
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
        });

        if (address && address.length > 0) {
          const addr = address[0];
          const fullAddress = [
            addr.street,
            addr.district,
            addr.city,
            addr.region,
            addr.postalCode,
          ]
            .filter(Boolean)
            .join(', ');
          setLocationAddress(fullAddress || 'Address not available');
        } else {
          setLocationAddress(
            `${location.coords.latitude.toFixed(4)}, ${location.coords.longitude.toFixed(4)}`
          );
        }
      } catch (error) {
        console.error('Error getting location:', error);
        setLocationAddress('Unable to get location');
        // Use default Mumbai coordinates on error
        setUserLocation({
          coords: {
            latitude: 19.0760,
            longitude: 72.8777,
            altitude: null,
            accuracy: null,
            altitudeAccuracy: null,
            heading: null,
            speed: null,
          },
          timestamp: Date.now(),
        });
      }
    };

    getLocation();
  }, []);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 400);
  }, []);

  // Search for location
  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      Alert.alert('Error', 'Please enter a location to search');
      return;
    }

    setIsSearching(true);
    try {
      // Use geocoding to convert address to coordinates
      const results = await Location.geocodeAsync(searchQuery);
      
      if (results && results.length > 0) {
        const result = results[0];
        const coords = {
          latitude: result.latitude,
          longitude: result.longitude,
        };

        // Get address from coordinates for better display
        const addressResults = await Location.reverseGeocodeAsync(coords);
        let address = searchQuery;
        if (addressResults && addressResults.length > 0) {
          const addr = addressResults[0];
          address = [
            addr.street,
            addr.district,
            addr.city,
            addr.region,
            addr.postalCode,
          ]
            .filter(Boolean)
            .join(', ') || searchQuery;
        }

        setSearchLocation({
          latitude: coords.latitude,
          longitude: coords.longitude,
          address: address,
        });

        // Update map region to show searched location
        const newRegion: Region = {
          latitude: coords.latitude,
          longitude: coords.longitude,
          latitudeDelta: 0.01,
          longitudeDelta: 0.01,
        };
        setMapRegion(newRegion);

        // Animate map to searched location
        if (mapRef.current) {
          mapRef.current.animateToRegion(newRegion, 1000);
        }

        Alert.alert('Location Found', `Found: ${address}`);
      } else {
        Alert.alert('Not Found', 'Location not found. Please try a different search term.');
      }
    } catch (error) {
      console.error('Search error:', error);
      Alert.alert('Error', 'Unable to search location. Please try again.');
    } finally {
      setIsSearching(false);
    }
  };

  // Clear search and return to user location
  const handleClearSearch = () => {
    setSearchQuery('');
    setSearchLocation(null);
    if (userLocation && mapRef.current) {
      const region: Region = {
        latitude: userLocation.coords.latitude,
        longitude: userLocation.coords.longitude,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      };
      setMapRegion(region);
      mapRef.current.animateToRegion(region, 1000);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <StatusBar style="dark" />
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color="#111" />
        </TouchableOpacity>
        <Text style={styles.title}>Owner's Dashboard</Text>
        <View style={styles.backBtn} />
      </View>
      <ScrollView
        style={styles.scroll}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[DESIGN.colors.primary]} />}
      >
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Financial & time progression</Text>
          <View style={styles.statsRow}>
            <View style={styles.statCard}>
              <Ionicons name="wallet" size={28} color={DESIGN.colors.primary} />
              <Text style={styles.statValue}>₹{(dash.totalSpend / 1_00_000).toFixed(1)}L</Text>
              <Text style={styles.statLabel}>Total spend</Text>
            </View>
            <View style={styles.statCard}>
              <Ionicons name="checkmark-done" size={28} color={DESIGN.colors.success} />
              <Text style={styles.statValue}>{dash.completedTasks}/{dash.totalTasks}</Text>
              <Text style={styles.statLabel}>Tasks done</Text>
            </View>
            <View style={styles.statCard}>
              <Ionicons name="trending-up" size={28} color={DESIGN.colors.info} />
              <Text style={styles.statValue}>{dash.progress}%</Text>
              <Text style={styles.statLabel}>Progress</Text>
            </View>
          </View>
        </View>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Your Location</Text>
          {userLocation && mapRegion && (
            <View style={styles.mapContainer}>
              {/* Search Bar */}
              <View style={styles.searchContainer}>
                <View style={styles.searchInputContainer}>
                  <Ionicons name="search" size={20} color="#6B7280" style={styles.searchIcon} />
                  <TextInput
                    style={styles.searchInput}
                    placeholder="Search location (e.g., Mumbai, Andheri, Pune)"
                    placeholderTextColor="#9CA3AF"
                    value={searchQuery}
                    onChangeText={setSearchQuery}
                    onSubmitEditing={handleSearch}
                    returnKeyType="search"
                  />
                  {searchQuery.length > 0 && (
                    <TouchableOpacity onPress={handleClearSearch} style={styles.clearButton}>
                      <Ionicons name="close-circle" size={20} color="#9CA3AF" />
                    </TouchableOpacity>
                  )}
                </View>
                <TouchableOpacity
                  style={[styles.searchButton, isSearching && styles.searchButtonDisabled]}
                  onPress={handleSearch}
                  disabled={isSearching}
                >
                  {isSearching ? (
                    <ActivityIndicator size="small" color="#fff" />
                  ) : (
                    <Ionicons name="arrow-forward" size={20} color="#fff" />
                  )}
                </TouchableOpacity>
              </View>

              <MapView
                ref={mapRef}
                style={styles.map}
                region={mapRegion}
                onRegionChangeComplete={setMapRegion}
                showsUserLocation={true}
                showsMyLocationButton={true}
                mapType="standard"
              >
                {/* User Location Marker */}
                <Marker
                  coordinate={{
                    latitude: userLocation.coords.latitude,
                    longitude: userLocation.coords.longitude,
                  }}
                  title="Your Location"
                  description={locationAddress}
                >
                  <View style={styles.markerContainer}>
                    <Ionicons name="location" size={32} color={DESIGN.colors.primary} />
                  </View>
                </Marker>

                {/* Searched Location Marker */}
                {searchLocation && (
                  <Marker
                    coordinate={{
                      latitude: searchLocation.latitude,
                      longitude: searchLocation.longitude,
                    }}
                    title="Searched Location"
                    description={searchLocation.address}
                  >
                    <View style={[styles.markerContainer, styles.searchMarkerContainer]}>
                      <Ionicons name="pin" size={32} color="#EF4444" />
                    </View>
                  </Marker>
                )}
              </MapView>
              
              <View style={styles.locationInfo}>
                <Ionicons name="location" size={16} color={DESIGN.colors.primary} />
                <Text style={styles.locationText}>
                  {searchLocation ? searchLocation.address : locationAddress}
                </Text>
              </View>
              <View style={styles.coordinatesInfo}>
                <Text style={styles.coordinatesText}>
                  📍 {searchLocation 
                    ? `${searchLocation.latitude.toFixed(6)}, ${searchLocation.longitude.toFixed(6)}`
                    : `${userLocation.coords.latitude.toFixed(6)}, ${userLocation.coords.longitude.toFixed(6)}`
                  }
                </Text>
              </View>
            </View>
          )}
        </View>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Recent bills</Text>
          {dash.recentBills.length === 0 ? (
            <Text style={styles.empty}>No bills.</Text>
          ) : (
            dash.recentBills.map((b) => (
              <View key={b.id} style={styles.card}>
                <Text style={styles.billNo}>{b.billNumber}</Text>
                <Text style={styles.vendor}>{b.vendorName}</Text>
                <Text style={styles.total}>₹{b.grandTotal.toLocaleString()}</Text>
              </View>
            ))
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: DESIGN.colors.background },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: DESIGN.spacing.lg,
    paddingVertical: DESIGN.spacing.md,
    backgroundColor: DESIGN.colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: DESIGN.colors.border,
  },
  backBtn: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  title: { fontSize: 18, fontWeight: '700', color: DESIGN.colors.text.primary },
  scroll: { flex: 1 },
  section: { paddingHorizontal: DESIGN.spacing.lg, paddingTop: DESIGN.spacing.xl },
  sectionTitle: { fontSize: 14, fontWeight: '600', color: DESIGN.colors.text.secondary, marginBottom: DESIGN.spacing.md },
  statsRow: { flexDirection: 'row', gap: DESIGN.spacing.md, marginBottom: DESIGN.spacing.lg },
  statCard: {
    flex: 1,
    backgroundColor: DESIGN.colors.surface,
    borderRadius: DESIGN.radius.md,
    padding: DESIGN.spacing.md,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: DESIGN.colors.border,
  },
  statValue: { fontSize: 18, fontWeight: '700', color: DESIGN.colors.text.primary, marginTop: 8 },
  statLabel: { fontSize: 11, color: DESIGN.colors.text.secondary, marginTop: 4 },
  card: {
    backgroundColor: DESIGN.colors.surface,
    borderRadius: DESIGN.radius.md,
    padding: DESIGN.spacing.md,
    marginBottom: DESIGN.spacing.md,
    borderWidth: 1,
    borderColor: DESIGN.colors.border,
  },
  billNo: { fontSize: 14, fontWeight: '700', color: DESIGN.colors.text.primary },
  vendor: { fontSize: 12, color: DESIGN.colors.text.secondary, marginTop: 2 },
  total: { fontSize: 14, fontWeight: '600', color: DESIGN.colors.primary, marginTop: 4 },
  empty: { fontSize: 14, color: DESIGN.colors.text.secondary },
  mapContainer: {
    backgroundColor: DESIGN.colors.surface,
    borderRadius: DESIGN.radius.md,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: DESIGN.colors.border,
    marginBottom: DESIGN.spacing.md,
  },
  map: {
    width: '100%',
    height: 250,
  },
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
  locationInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: DESIGN.spacing.md,
    gap: DESIGN.spacing.sm,
    backgroundColor: '#F9FAFB',
  },
  locationText: {
    fontSize: 13,
    color: DESIGN.colors.text.primary,
    flex: 1,
  },
  coordinatesInfo: {
    padding: DESIGN.spacing.sm,
    backgroundColor: '#F0F9FF',
    borderTopWidth: 1,
    borderTopColor: DESIGN.colors.border,
  },
  coordinatesText: {
    fontSize: 11,
    color: DESIGN.colors.text.secondary,
    fontFamily: 'monospace',
  },
  searchContainer: {
    flexDirection: 'row',
    padding: DESIGN.spacing.md,
    gap: DESIGN.spacing.sm,
    backgroundColor: DESIGN.colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: DESIGN.colors.border,
  },
  searchInputContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    borderRadius: DESIGN.radius.md,
    borderWidth: 1,
    borderColor: DESIGN.colors.border,
    paddingHorizontal: DESIGN.spacing.md,
  },
  searchIcon: {
    marginRight: DESIGN.spacing.sm,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: DESIGN.colors.text.primary,
    paddingVertical: DESIGN.spacing.sm,
  },
  clearButton: {
    padding: 4,
  },
  searchButton: {
    backgroundColor: DESIGN.colors.primary,
    borderRadius: DESIGN.radius.md,
    padding: DESIGN.spacing.md,
    justifyContent: 'center',
    alignItems: 'center',
    minWidth: 48,
  },
  searchButtonDisabled: {
    opacity: 0.6,
  },
  searchMarkerContainer: {
    backgroundColor: '#FEE2E2',
  },
});
