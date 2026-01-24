import React from 'react';
import { View, Text, TextInput, ScrollView, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SiteFormData } from './_types';
import { styles } from './_styles';

interface Props {
    data: SiteFormData;
    onChange: (data: SiteFormData) => void;
    onNext: () => void;
}

export default function SiteForm({ data, onChange, onNext }: Props) {

    const updateField = (key: keyof SiteFormData, value: any) => {
        onChange({ ...data, [key]: value });
    };

    return (
        <ScrollView style={styles.container} contentContainerStyle={styles.formContainer}>
            <View style={styles.inputGroup}>
                <Text style={styles.label}>Project Name *</Text>
                <TextInput
                    style={styles.input}
                    value={data.name}
                    onChangeText={(text) => updateField('name', text)}
                    placeholder="e.g., Mumbai Tower Project"
                    placeholderTextColor="#9CA3AF"
                />
            </View>

            <View style={styles.inputGroup}>
                <Text style={styles.label}>Description</Text>
                <TextInput
                    style={[styles.input, { height: 80, textAlignVertical: 'top' }]}
                    value={data.description}
                    onChangeText={(text) => updateField('description', text)}
                    placeholder="Brief description of the project"
                    placeholderTextColor="#9CA3AF"
                    multiline
                    numberOfLines={3}
                />
            </View>

            <View style={styles.inputGroup}>
                <Text style={styles.label}>Site Address *</Text>
                <TextInput
                    style={[styles.input, styles.textArea]}
                    value={data.address}
                    onChangeText={(text) => updateField('address', text)}
                    placeholder="Full street address"
                    placeholderTextColor="#9CA3AF"
                    multiline
                    numberOfLines={3}
                />
            </View>

            <TouchableOpacity style={styles.btnPrimary} onPress={onNext}>
                <Text style={styles.btnPrimaryText}>Continue to Boundary Setup</Text>
                <Ionicons name="arrow-forward" size={20} color="#fff" style={{ marginLeft: 8 }} />
            </TouchableOpacity>
        </ScrollView>
    );
}
