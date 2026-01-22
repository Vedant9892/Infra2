import { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Alert,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import MapView, { Marker, Circle } from 'react-native-maps';

type Site = {
  id: string;
  name: string;
  location: string;
  latitude: number;
  longitude: number;
  radius: number; // in meters for geofencing
  address: string;
  pincode: string;
  projectType: string;
  startDate: Date;
  estimatedEndDate: Date;
  budget: string;
};

export default function SiteRegistration() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [siteData, setSiteData] = useState({
    name: '',
    location: '',
    address: '',
    pincode: '',
    projectType: 'residential',
    budget: '',
  });
  
  const [selectedLocation, setSelectedLocation] = useState({
    latitude: 19.0760, // Mumbai default
    longitude: 72.8777,
  });
  const [radius, setRadius] = useState(100); // Default 100 meters
  const [currentLocation, setCurrentLocation] = useState<Location.LocationObject | null>(null);

  useEffect(() => {
    getCurrentLocation();
  }, []);

  const getCurrentLocation = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Denied', 'Location permission is required');
        return;
      }

      const location = await Location.getCurrentPositionAsync({});
      setCurrentLocation(location);
      setSelectedLocation({
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      });
    } catch (error) {
      console.error('Error getting location:', error);
    }
  };

  const handleMapPress = (event: any) => {
    const { latitude, longitude } = event.nativeEvent.coordinate;
    setSelectedLocation({ latitude, longitude });
  };

  const handleNext = () => {
    if (step === 1) {
      if (!siteData.name || !siteData.location) {
        Alert.alert('Error', 'Please fill in site name and location');
        return;
      }
      setStep(2);
    }
  };

  const handleRegisterSite = () => {
    const newSite: Site = {
      id: Date.now().toString(),
      name: siteData.name,
      location: siteData.location,
      latitude: selectedLocation.latitude,
      longitude: selectedLocation.longitude,
      radius: radius,
      address: siteData.address,
      pincode: siteData.pincode,
      projectType: siteData.projectType,
      startDate: new Date(),
      estimatedEndDate: new Date(Date.now() + 180 * 24 * 60 * 60 * 1000), // 6 months
      budget: siteData.budget,
    };

    // TODO: Save to backend/database
    console.log('Registering site:', newSite);

    Alert.alert(
      'Success',
      'Site registered successfully! Workers can now mark attendance within the specified area.',
      [
        {
          text: 'OK',
          onPress: () => router.replace('/(owner)/sites'),
        },
      ]
    );
  };

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#111" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Register New Site</Text>
      </View>

      {/* Progress Indicator */}
      <View style={styles.progressContainer}>
        <View style={styles.progressBar}>
          <View style={[styles.progressStep, step >= 1 && styles.progressStepActive]}>
            <Text style={[styles.progressStepText, step >= 1 && styles.progressStepTextActive]}>1</Text>
          </View>
          <View style={[styles.progressLine, step >= 2 && styles.progressLineActive]} />
          <View style={[styles.progressStep, step >= 2 && styles.progressStepActive]}>
            <Text style={[styles.progressStepText, step >= 2 && styles.progressStepTextActive]}>2</Text>
          </View>
        </View>
        <View style={styles.progressLabels}>
          <Text style={styles.progressLabel}>Site Details</Text>
          <Text style={styles.progressLabel}>GPS Location</Text>
        </View>
      </View>

      {step === 1 ? (
        <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
          <View style={styles.form}>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Site Name *</Text>
              <TextInput
                style={styles.input}
                value={siteData.name}
                onChangeText={(text) => setSiteData({ ...siteData, name: text })}
                placeholder="e.g., Mumbai Residential Complex"
                placeholderTextColor="#9CA3AF"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Location Name *</Text>
              <TextInput
                style={styles.input}
                value={siteData.location}
                onChangeText={(text) => setSiteData({ ...siteData, location: text })}
                placeholder="e.g., Andheri West, Mumbai"
                placeholderTextColor="#9CA3AF"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Full Address</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={siteData.address}
                onChangeText={(text) => setSiteData({ ...siteData, address: text })}
                placeholder="Enter complete site address"
                multiline
                numberOfLines={3}
                placeholderTextColor="#9CA3AF"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Pincode</Text>
              <TextInput
                style={styles.input}
                value={siteData.pincode}
                onChangeText={(text) => setSiteData({ ...siteData, pincode: text })}
                placeholder="400001"
                keyboardType="numeric"
                maxLength={6}
                placeholderTextColor="#9CA3AF"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Project Type</Text>
              <View style={styles.radioGroup}>
                {['residential', 'commercial', 'industrial', 'infrastructure'].map((type) => (
                  <TouchableOpacity
                    key={type}
                    style={[
                      styles.radioButton,
                      siteData.projectType === type && styles.radioButtonActive,
                    ]}
                    onPress={() => setSiteData({ ...siteData, projectType: type })}
                  >
                    <Text
                      style={[
                        styles.radioButtonText,
                        siteData.projectType === type && styles.radioButtonTextActive,
                      ]}
                    >
                      {type.charAt(0).toUpperCase() + type.slice(1)}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Estimated Budget</Text>
              <TextInput
                style={styles.input}
                value={siteData.budget}
                onChangeText={(text) => setSiteData({ ...siteData, budget: text })}
                placeholder="e.g., ₹50,00,000"
                keyboardType="numeric"
                placeholderTextColor="#9CA3AF"
              />
            </View>

            <TouchableOpacity style={styles.nextButton} onPress={handleNext}>
              <Text style={styles.nextButtonText}>Next: Set GPS Location</Text>
              <Ionicons name="arrow-forward" size={20} color="#fff" />
            </TouchableOpacity>
          </View>
        </ScrollView>
      ) : (
        <View style={styles.mapContainer}>
          <View style={styles.mapInstructions}>
            <Ionicons name="information-circle" size={24} color="#8B5CF6" />
            <Text style={styles.instructionText}>
              Tap on the map to set your site's GPS coordinates. Workers can mark attendance only within this area.
            </Text>
          </View>

          <MapView
            style={styles.map}
            initialRegion={{
              latitude: selectedLocation.latitude,
              longitude: selectedLocation.longitude,
              latitudeDelta: 0.01,
              longitudeDelta: 0.01,
            }}
            onPress={handleMapPress}
          >
            <Marker
              coordinate={selectedLocation}
              title={siteData.name}
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

          <View style={styles.mapControls}>
            <View style={styles.coordsDisplay}>
              <Text style={styles.coordsLabel}>GPS Coordinates:</Text>
              <Text style={styles.coordsText}>
                {selectedLocation.latitude.toFixed(6)}, {selectedLocation.longitude.toFixed(6)}
              </Text>
            </View>

            <View style={styles.radiusControl}>
              <Text style={styles.label}>Attendance Radius: {radius}m</Text>
              <View style={styles.radiusButtons}>
                <TouchableOpacity
                  style={styles.radiusButton}
                  onPress={() => setRadius(Math.max(50, radius - 50))}
                >
                  <Ionicons name="remove" size={20} color="#8B5CF6" />
                </TouchableOpacity>
                <Text style={styles.radiusValue}>{radius}m</Text>
                <TouchableOpacity
                  style={styles.radiusButton}
                  onPress={() => setRadius(Math.min(500, radius + 50))}
                >
                  <Ionicons name="add" size={20} color="#8B5CF6" />
                </TouchableOpacity>
              </View>
            </View>

            <TouchableOpacity
              style={styles.currentLocationButton}
              onPress={getCurrentLocation}
            >
              <Ionicons name="locate" size={20} color="#8B5CF6" />
              <Text style={styles.currentLocationText}>Use Current Location</Text>
            </TouchableOpacity>

            <View style={styles.actionButtons}>
              <TouchableOpacity style={styles.backButtonStep} onPress={() => setStep(1)}>
                <Ionicons name="arrow-back" size={20} color="#6B7280" />
                <Text style={styles.backButtonText}>Back</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.registerButton} onPress={handleRegisterSite}>
                <Text style={styles.registerButtonText}>Register Site</Text>
                <Ionicons name="checkmark" size={20} color="#fff" />
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  backButton: {
    marginRight: 16,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111',
  },
  progressContainer: {
    backgroundColor: '#fff',
    paddingVertical: 20,
    paddingHorizontal: 40,
  },
  progressBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  progressStep: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#E5E7EB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  progressStepActive: {
    backgroundColor: '#8B5CF6',
  },
  progressStepText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#9CA3AF',
  },
  progressStepTextActive: {
    color: '#fff',
  },
  progressLine: {
    flex: 1,
    height: 2,
    backgroundColor: '#E5E7EB',
    marginHorizontal: 12,
  },
  progressLineActive: {
    backgroundColor: '#8B5CF6',
  },
  progressLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  progressLabel: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '600',
  },
  scrollView: {
    flex: 1,
  },
  form: {
    padding: 20,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: '#111',
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  radioGroup: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  radioButton: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#E5E7EB',
    backgroundColor: '#fff',
  },
  radioButtonActive: {
    borderColor: '#8B5CF6',
    backgroundColor: '#F3E8FF',
  },
  radioButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
  },
  radioButtonTextActive: {
    color: '#8B5CF6',
  },
  nextButton: {
    backgroundColor: '#8B5CF6',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 12,
    marginTop: 24,
    gap: 8,
  },
  nextButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#fff',
  },
  mapContainer: {
    flex: 1,
  },
  mapInstructions: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3E8FF',
    padding: 16,
    gap: 12,
  },
  instructionText: {
    flex: 1,
    fontSize: 14,
    color: '#7C3AED',
    fontWeight: '500',
  },
  map: {
    flex: 1,
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
  mapControls: {
    backgroundColor: '#fff',
    padding: 20,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 10,
  },
  coordsDisplay: {
    marginBottom: 20,
  },
  coordsLabel: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 4,
  },
  coordsText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111',
  },
  radiusControl: {
    marginBottom: 20,
  },
  radiusButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    padding: 12,
  },
  radiusButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#8B5CF6',
  },
  radiusValue: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111',
  },
  currentLocationButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    gap: 8,
    marginBottom: 20,
  },
  currentLocationText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#8B5CF6',
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  backButtonStep: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 12,
    backgroundColor: '#F3F4F6',
    gap: 8,
  },
  backButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#6B7280',
  },
  registerButton: {
    flex: 2,
    backgroundColor: '#10B981',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 12,
    gap: 8,
  },
  registerButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#fff',
  },
});
