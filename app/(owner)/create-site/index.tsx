import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Alert, SafeAreaView, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import { styles } from './_styles';
import { CreateSiteStep, SiteFormData } from './_types';
import SiteForm from './SiteForm';
import SiteBoundary from './SiteBoundary';
import { useUser } from '../../../contexts/UserContext';
import { API_BASE_URL } from '../../../constants/api';

export default function CreateSiteWizard() {
    const router = useRouter();
    const { user } = useUser();
    const [step, setStep] = useState<CreateSiteStep>('details');
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState<SiteFormData>({
        name: '',
        description: '',
        address: '',
        latitude: 19.0760,
        longitude: 72.8777,
        boundary: [],
        overlaySettings: {
            opacity: 0.7,
            scale: 0.004,
            rotation: 0,
        }
    });

    const handleNext = () => {
        if (step === 'details') {
            if (!formData.name || !formData.address) {
                Alert.alert('Required Fields', 'Please fill in Site Name and Address.');
                return;
            }
            setStep('boundary');
        }
    };

    const handleBack = () => {
        if (step === 'boundary') {
            setStep('details');
        } else {
            router.back();
        }
    };

    const handleSubmit = async () => {
        // For web, we don't require boundary points - just GPS center and radius
        // if (formData.boundary.length < 3) {
        //     Alert.alert('Invalid Boundary', 'Please mark at least 3 points to create a valid site boundary.');
        //     return;
        // }
        
        // Radius validation removed - use default if not set

        setLoading(true);
        try {
            const payload = {
                ownerId: user?.id,
                name: formData.name,
                description: formData.description,
                address: formData.address,
                latitude: formData.latitude,
                longitude: formData.longitude,
                radius: formData.radius || 100, // Default 100m if not set
                boundary: formData.boundary,
                overlayImage: formData.overlayImage,
                overlaySettings: formData.overlaySettings,
                projectType: 'residential'
            };

            console.log('Creating site:', payload);

            const response = await fetch(`${API_BASE_URL}/api/sites`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(payload),
            });

            const data = await response.json();

            if (data.success) {
                Alert.alert(
                    'Success',
                    'Site created successfully!',
                    [{ text: 'OK', onPress: () => router.replace('/(owner)/sites') }]
                );
            } else {
                Alert.alert('Error', data.message || 'Failed to create site');
            }
        } catch (error) {
            console.error('Create site error:', error);
            Alert.alert('Error', 'Failed to create site. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <View style={styles.container}>
            <StatusBar style="dark" />

            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={handleBack} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color="#111" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>
                    {step === 'details' ? 'New Project Details' : 'Site Boundary'}
                </Text>
                <View style={{ width: 40 }} />
            </View>

            {/* Progress Indicator */}
            <View style={styles.progressContainer}>
                <View style={styles.progressBar}>
                    <View style={[styles.progressStep, step === 'details' ? styles.progressStepActive : styles.progressStepCompleted]}>
                        <Text style={[styles.progressStepText, step === 'details' ? styles.progressStepTextActive : styles.progressStepTextActive]}>1</Text>
                    </View>
                    <View style={[styles.progressLine, step === 'boundary' && styles.progressLineActive]} />
                    <View style={[styles.progressStep, step === 'boundary' ? styles.progressStepActive : {}]}>
                        <Text style={[styles.progressStepText, step === 'boundary' ? styles.progressStepTextActive : {}]}>2</Text>
                    </View>
                </View>
                <View style={styles.progressLabels}>
                    <Text style={styles.progressLabel}>Details</Text>
                    <Text style={styles.progressLabel}>Geofence</Text>
                </View>
            </View>

            {/* Content */}
            <View style={styles.contentContainer}>
                {step === 'details' ? (
                    <SiteForm
                        data={formData}
                        onChange={setFormData}
                        onNext={handleNext}
                    />
                ) : (
                    <SiteBoundary
                        data={formData}
                        onChange={setFormData}
                        onSubmit={handleSubmit}
                    />
                )}
            </View>
        </View>
    );
}
