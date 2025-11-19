import React from 'react';
import {
  View,
  Text,
  ScrollView,
  Image,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';

export default function EventDetailsScreen({ route, navigation }) {
  const { event } = route.params;

  return (
    <ScrollView style={styles.container}>
      {event.image && (
        <Image source={{ uri: event.image }} style={styles.headerImage} />
      )}
      
      <View style={styles.content}>
        <Text style={styles.title}>{event.title}</Text>
        
        {event.description && (
          <Text style={styles.description}>{event.description}</Text>
        )}

        <View style={styles.infoSection}>
          {event.startTime && (
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>⏰ Time:</Text>
              <Text style={styles.infoValue}>
                {event.startTime}
                {event.endTime && ` - ${event.endTime}`}
              </Text>
            </View>
          )}

          {event.startDate && (
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>📅 Date:</Text>
              <Text style={styles.infoValue}>
                {new Date(event.startDate).toLocaleDateString()}
              </Text>
            </View>
          )}

          {event.location && (
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>📍 Location:</Text>
              <Text style={styles.infoValue}>{event.location}</Text>
            </View>
          )}

          {event.category && (
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>🏷️ Category:</Text>
              <Text style={styles.infoValue}>{event.category}</Text>
            </View>
          )}

          {event.capacity && (
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>👥 Capacity:</Text>
              <Text style={styles.infoValue}>{event.capacity} attendees</Text>
            </View>
          )}

          {event.price !== undefined && (
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>💰 Price:</Text>
              <Text style={styles.infoValue}>
                {event.price === 0 ? 'Free' : `$${event.price}`}
              </Text>
            </View>
          )}
        </View>

        <TouchableOpacity style={styles.registerButton}>
          <Text style={styles.registerButtonText}>Register for Event</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  headerImage: {
    width: '100%',
    height: 250,
    resizeMode: 'cover',
  },
  content: {
    padding: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1a1a1a',
    marginBottom: 16,
  },
  description: {
    fontSize: 16,
    color: '#666',
    lineHeight: 24,
    marginBottom: 24,
  },
  infoSection: {
    backgroundColor: '#f8f8f8',
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
  },
  infoRow: {
    flexDirection: 'row',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  infoLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a1a',
    width: 120,
  },
  infoValue: {
    fontSize: 16,
    color: '#666',
    flex: 1,
  },
  registerButton: {
    backgroundColor: '#007AFF',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  registerButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
});
