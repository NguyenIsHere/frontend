// Add styles for the header containers in event screens
import { StyleSheet, Platform } from 'react-native';

const commonStyles = StyleSheet.create({
    headerContainer: {
        backgroundColor: '#3E4FF5', // Changed from '#3B82F6' to match document style
        padding: 16,
        paddingTop: Platform.OS === 'ios' ? 50 : 16,
        paddingBottom: 16,
    },
    headerTitle: {
        color: 'white',
        fontSize: 22,
        fontWeight: 'bold',
        textAlign: 'center'
    },
});

export default commonStyles;
