import { StyleSheet, Platform } from 'react-native';

export const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F9FAFB',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingTop: Platform.OS === 'ios' ? 60 : 40,
        paddingBottom: 20,
        backgroundColor: '#fff',
        borderBottomWidth: 1,
        borderBottomColor: '#E5E7EB',
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: '700',
        color: '#111',
        flex: 1,
        textAlign: 'center',
        marginRight: 40, // offset back button
    },
    backButton: {
        padding: 8,
    },
    progressContainer: {
        backgroundColor: '#fff',
        paddingVertical: 16,
        paddingHorizontal: 24,
        borderBottomWidth: 1,
        borderBottomColor: '#f0f0f0',
    },
    progressBar: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 8,
    },
    progressStep: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: '#E5E7EB',
        alignItems: 'center',
        justifyContent: 'center',
    },
    progressStepActive: {
        backgroundColor: '#8B5CF6',
    },
    progressStepCompleted: {
        backgroundColor: '#10B981',
    },
    progressStepText: {
        fontSize: 14,
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
        marginHorizontal: 8,
    },
    progressLineActive: {
        backgroundColor: '#8B5CF6',
    },
    progressLabels: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingHorizontal: 4,
    },
    progressLabel: {
        fontSize: 12,
        color: '#6B7280',
        fontWeight: '600',
    },
    contentContainer: {
        flex: 1,
    },
    // Form Styles
    formContainer: {
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
        height: 100,
        textAlignVertical: 'top',
    },
    btnPrimary: {
        backgroundColor: '#8B5CF6',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 16,
        borderRadius: 12,
        shadowColor: '#8B5CF6',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
        elevation: 4,
    },
    btnPrimaryText: {
        fontSize: 16,
        fontWeight: '700',
        color: '#fff',
    },

    // Map/Boundary Control Styles
    controlPanel: {
        backgroundColor: '#fff',
        padding: 16,
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 10,
        maxHeight: '40%',
    },
    toggleContainer: {
        flexDirection: 'row',
        backgroundColor: '#F3F4F6',
        borderRadius: 8,
        padding: 4,
        marginBottom: 16,
    },
    toggleButton: {
        flex: 1,
        paddingVertical: 8,
        alignItems: 'center',
        borderRadius: 6,
    },
    toggleButtonActive: {
        backgroundColor: '#fff',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
        elevation: 2,
    },
    toggleText: {
        fontSize: 13,
        fontWeight: '600',
        color: '#6B7280',
    },
    toggleTextActive: {
        color: '#111',
    },
    overlayControls: {
        marginBottom: 16,
    },
    sliderRow: {
        marginBottom: 12,
    },
    sliderLabelRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 6,
    },
    sliderLabel: {
        fontSize: 12,
        color: '#4B5563',
        fontWeight: '500',
    },
    sliderValue: {
        fontSize: 12,
        color: '#8B5CF6',
        fontWeight: '700',
    },
    // Custom Slider Replacement (Row of buttons)
    sliderButtons: {
        flexDirection: 'row',
        gap: 8,
    },
    sliderBtn: {
        backgroundColor: '#F3E8FF',
        width: 32,
        height: 32,
        borderRadius: 16,
        alignItems: 'center',
        justifyContent: 'center',
    },
    sliderBtnText: {
        fontSize: 18,
        color: '#7C3AED',
        fontWeight: 'bold',
    },
    uploadButton: {
        borderWidth: 2,
        borderColor: '#E5E7EB',
        borderStyle: 'dashed',
        borderRadius: 12,
        padding: 20,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#F9FAFB',
        marginBottom: 16,
    },
    uploadText: {
        marginTop: 8,
        fontSize: 14,
        fontWeight: '600',
        color: '#4B5563',
    },
    mapOverlay: {
        ...StyleSheet.absoluteFillObject,
    },
    mapContainer: {
        flex: 1,
        position: 'relative',
    },
});

// Default export to prevent Expo Router from treating this as a route
export default null;
