import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';

interface Project {
  id: string;
  name: string;
  location: string;
  status: 'active' | 'completed' | 'on-hold';
  progress: number;
  tasks: number;
  completedTasks: number;
  team: number;
}

export default function Projects() {
  const projects: Project[] = [
    {
      id: '1',
      name: 'Site A Construction',
      location: 'Pune, Maharashtra',
      status: 'active',
      progress: 68,
      tasks: 24,
      completedTasks: 16,
      team: 12,
    },
    {
      id: '2',
      name: 'Foundation Work - Building B',
      location: 'Mumbai, Maharashtra',
      status: 'active',
      progress: 45,
      tasks: 18,
      completedTasks: 8,
      team: 8,
    },
    {
      id: '3',
      name: 'Road Development Project',
      location: 'Nagpur, Maharashtra',
      status: 'on-hold',
      progress: 30,
      tasks: 12,
      completedTasks: 4,
      team: 6,
    },
    {
      id: '4',
      name: 'Residential Complex',
      location: 'Nashik, Maharashtra',
      status: 'completed',
      progress: 100,
      tasks: 32,
      completedTasks: 32,
      team: 15,
    },
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return '#10B981';
      case 'completed':
        return '#3B82F6';
      case 'on-hold':
        return '#F59E0B';
      default:
        return '#6B7280';
    }
  };

  const getStatusBg = (status: string) => {
    switch (status) {
      case 'active':
        return '#D1FAE5';
      case 'completed':
        return '#DBEAFE';
      case 'on-hold':
        return '#FEF3C7';
      default:
        return '#F3F4F6';
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Projects</Text>
        <TouchableOpacity>
          <Ionicons name="filter" size={24} color="#000" />
        </TouchableOpacity>
      </View>

      <View style={styles.filterRow}>
        <TouchableOpacity style={[styles.filterChip, styles.filterChipActive]}>
          <Text style={styles.filterTextActive}>All</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.filterChip}>
          <Text style={styles.filterText}>Active</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.filterChip}>
          <Text style={styles.filterText}>Completed</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.filterChip}>
          <Text style={styles.filterText}>On Hold</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content}>
        {projects.map((project) => (
          <TouchableOpacity key={project.id} style={styles.projectCard}>
            <View style={styles.projectHeader}>
              <View style={styles.projectIcon}>
                <Ionicons name="construct" size={24} color="#8B5CF6" />
              </View>
              <View
                style={[
                  styles.statusBadge,
                  { backgroundColor: getStatusBg(project.status) },
                ]}
              >
                <Text
                  style={[
                    styles.statusText,
                    { color: getStatusColor(project.status) },
                  ]}
                >
                  {project.status.charAt(0).toUpperCase() + project.status.slice(1).replace('-', ' ')}
                </Text>
              </View>
            </View>

            <Text style={styles.projectName}>{project.name}</Text>
            <View style={styles.locationRow}>
              <Ionicons name="location" size={14} color="#9CA3AF" />
              <Text style={styles.locationText}>{project.location}</Text>
            </View>

            <View style={styles.progressSection}>
              <View style={styles.progressHeader}>
                <Text style={styles.progressLabel}>Progress</Text>
                <Text style={styles.progressValue}>{project.progress}%</Text>
              </View>
              <View style={styles.progressBar}>
                <View
                  style={[
                    styles.progressFill,
                    { width: `${project.progress}%`, backgroundColor: getStatusColor(project.status) },
                  ]}
                />
              </View>
            </View>

            <View style={styles.projectFooter}>
              <View style={styles.footerItem}>
                <Ionicons name="list" size={16} color="#6B7280" />
                <Text style={styles.footerText}>
                  {project.completedTasks}/{project.tasks} Tasks
                </Text>
              </View>
              <View style={styles.footerItem}>
                <Ionicons name="people" size={16} color="#6B7280" />
                <Text style={styles.footerText}>{project.team} Members</Text>
              </View>
            </View>
          </TouchableOpacity>
        ))}
        <View style={styles.bottomSpacer} />
      </ScrollView>
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
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    paddingTop: 60,
    backgroundColor: '#fff',
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
  },
  filterRow: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 16,
    gap: 8,
    backgroundColor: '#fff',
  },
  filterChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
  },
  filterChipActive: {
    backgroundColor: '#8B5CF6',
  },
  filterText: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '500',
  },
  filterTextActive: {
    fontSize: 14,
    color: '#fff',
    fontWeight: '600',
  },
  content: {
    flex: 1,
  },
  projectCard: {
    backgroundColor: '#fff',
    marginHorizontal: 20,
    marginTop: 16,
    padding: 20,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  projectHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  projectIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#F3E8FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  projectName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#111',
    marginBottom: 8,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  locationText: {
    fontSize: 14,
    color: '#6B7280',
    marginLeft: 4,
  },
  progressSection: {
    marginBottom: 16,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  progressLabel: {
    fontSize: 14,
    color: '#6B7280',
  },
  progressValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111',
  },
  progressBar: {
    height: 8,
    backgroundColor: '#F3F4F6',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
  },
  projectFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  footerItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  footerText: {
    fontSize: 14,
    color: '#6B7280',
    marginLeft: 6,
  },
  bottomSpacer: {
    height: 100,
  },
});
