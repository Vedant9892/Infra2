import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { useUser } from '../../contexts/UserContext';

export default function Stats() {
  const { user } = useUser();

  // Owner Dashboard
  if (user?.role === 'owner') {
    return (
      <ScrollView style={styles.container}>
        <StatusBar style="dark" />
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Owner Dashboard</Text>
          <Ionicons name="analytics-outline" size={24} color="#000" />
        </View>

        {/* Financial Overview */}
        <View style={styles.summaryRow}>
          <View style={[styles.summaryCard, { backgroundColor: '#10B981' }]}>
            <Ionicons name="cash" size={32} color="#fff" />
            <Text style={styles.summaryValue}>₹12.5L</Text>
            <Text style={styles.summaryLabel}>Total Revenue</Text>
          </View>
          <View style={[styles.summaryCard, { backgroundColor: '#EF4444' }]}>
            <Ionicons name="trending-down" size={32} color="#fff" />
            <Text style={styles.summaryValue}>₹8.2L</Text>
            <Text style={styles.summaryLabel}>Total Expenses</Text>
          </View>
        </View>

        <View style={styles.summaryRow}>
          <View style={[styles.summaryCard, { backgroundColor: '#8B5CF6' }]}>
            <Ionicons name="wallet" size={32} color="#fff" />
            <Text style={styles.summaryValue}>₹4.3L</Text>
            <Text style={styles.summaryLabel}>Net Profit</Text>
          </View>
          <View style={[styles.summaryCard, { backgroundColor: '#F59E0B' }]}>
            <Ionicons name="hourglass" size={32} color="#fff" />
            <Text style={styles.summaryValue}>₹2.1L</Text>
            <Text style={styles.summaryLabel}>Pending Bills</Text>
          </View>
        </View>

        {/* Material Requests Summary */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Material Requests</Text>
          <View style={styles.taskStats}>
            <View style={styles.taskStatItem}>
              <View style={[styles.taskStatIcon, { backgroundColor: '#FEF3C7' }]}>
                <Ionicons name="time" size={24} color="#F59E0B" />
              </View>
              <Text style={styles.taskStatValue}>12</Text>
              <Text style={styles.taskStatLabel}>Pending</Text>
            </View>
            <View style={styles.taskStatItem}>
              <View style={[styles.taskStatIcon, { backgroundColor: '#D1FAE5' }]}>
                <Ionicons name="checkmark-circle" size={24} color="#10B981" />
              </View>
              <Text style={styles.taskStatValue}>48</Text>
              <Text style={styles.taskStatLabel}>Approved</Text>
            </View>
            <View style={styles.taskStatItem}>
              <View style={[styles.taskStatIcon, { backgroundColor: '#FEE2E2' }]}>
                <Ionicons name="close-circle" size={24} color="#EF4444" />
              </View>
              <Text style={styles.taskStatValue}>5</Text>
              <Text style={styles.taskStatLabel}>Rejected</Text>
            </View>
          </View>
        </View>

        {/* Sites Overview */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Sites Overview</Text>
          <View style={styles.metricRow}>
            <View style={styles.metricLeft}>
              <Ionicons name="construct" size={20} color="#6B7280" />
              <Text style={styles.metricLabel}>Active Sites</Text>
            </View>
            <Text style={styles.metricValue}>8</Text>
          </View>
          <View style={styles.metricRow}>
            <View style={styles.metricLeft}>
              <Ionicons name="people" size={20} color="#6B7280" />
              <Text style={styles.metricLabel}>Total Workers</Text>
            </View>
            <Text style={styles.metricValue}>156</Text>
          </View>
          <View style={styles.metricRow}>
            <View style={styles.metricLeft}>
              <Ionicons name="trending-up" size={20} color="#6B7280" />
              <Text style={styles.metricLabel}>Avg. Progress</Text>
            </View>
            <Text style={styles.metricValue}>67%</Text>
          </View>
          <View style={styles.metricRow}>
            <View style={styles.metricLeft}>
              <Ionicons name="cube" size={20} color="#6B7280" />
              <Text style={styles.metricLabel}>Materials Stock</Text>
            </View>
            <Text style={[styles.metricValue, { color: '#F59E0B' }]}>Low</Text>
          </View>
        </View>

        {/* Monthly Expenses Breakdown */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>Monthly Expenses</Text>
            <Text style={styles.cardSubtitle}>January 2026</Text>
          </View>
          <View style={styles.metricRow}>
            <View style={styles.metricLeft}>
              <Ionicons name="people" size={20} color="#6B7280" />
              <Text style={styles.metricLabel}>Labour Wages</Text>
            </View>
            <Text style={styles.metricValue}>₹4.2L</Text>
          </View>
          <View style={styles.metricRow}>
            <View style={styles.metricLeft}>
              <Ionicons name="cube" size={20} color="#6B7280" />
              <Text style={styles.metricLabel}>Materials</Text>
            </View>
            <Text style={styles.metricValue}>₹2.8L</Text>
          </View>
          <View style={styles.metricRow}>
            <View style={styles.metricLeft}>
              <Ionicons name="build" size={20} color="#6B7280" />
              <Text style={styles.metricLabel}>Equipment</Text>
            </View>
            <Text style={styles.metricValue}>₹0.9L</Text>
          </View>
          <View style={styles.metricRow}>
            <View style={styles.metricLeft}>
              <Ionicons name="flash" size={20} color="#6B7280" />
              <Text style={styles.metricLabel}>Utilities</Text>
            </View>
            <Text style={styles.metricValue}>₹0.3L</Text>
          </View>
        </View>

        <View style={styles.bottomSpacer} />
      </ScrollView>
    );
  }

  // Regular Dashboard (Labour/Supervisor/Engineer)
  return (
    <ScrollView style={styles.container}>
      <StatusBar style="dark" />
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Statistics</Text>
        <Ionicons name="calendar-outline" size={24} color="#000" />
      </View>

      <View style={styles.summaryRow}>
        <View style={[styles.summaryCard, { backgroundColor: '#8B5CF6' }]}>
          <Ionicons name="checkmark-circle" size={32} color="#fff" />
          <Text style={styles.summaryValue}>95%</Text>
          <Text style={styles.summaryLabel}>Attendance</Text>
        </View>
        <View style={[styles.summaryCard, { backgroundColor: '#10B981' }]}>
          <Ionicons name="time" size={32} color="#fff" />
          <Text style={styles.summaryValue}>186h</Text>
          <Text style={styles.summaryLabel}>Hours Worked</Text>
        </View>
      </View>

      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Text style={styles.cardTitle}>Tasks Overview</Text>
          <Text style={styles.cardSubtitle}>This Month</Text>
        </View>
        <View style={styles.taskStats}>
          <View style={styles.taskStatItem}>
            <View style={[styles.taskStatIcon, { backgroundColor: '#DBEAFE' }]}>
              <Ionicons name="list" size={24} color="#3B82F6" />
            </View>
            <Text style={styles.taskStatValue}>42</Text>
            <Text style={styles.taskStatLabel}>Completed</Text>
          </View>
          <View style={styles.taskStatItem}>
            <View style={[styles.taskStatIcon, { backgroundColor: '#FEF3C7' }]}>
              <Ionicons name="hourglass" size={24} color="#F59E0B" />
            </View>
            <Text style={styles.taskStatValue}>8</Text>
            <Text style={styles.taskStatLabel}>In Progress</Text>
          </View>
          <View style={styles.taskStatItem}>
            <View style={[styles.taskStatIcon, { backgroundColor: '#FEE2E2' }]}>
              <Ionicons name="alert-circle" size={24} color="#EF4444" />
            </View>
            <Text style={styles.taskStatValue}>2</Text>
            <Text style={styles.taskStatLabel}>Delayed</Text>
          </View>
        </View>
      </View>

      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Text style={styles.cardTitle}>Weekly Performance</Text>
          <Text style={styles.cardSubtitle}>Last 7 Days</Text>
        </View>
        <View style={styles.chartContainer}>
          {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day, index) => {
            const heights = [85, 92, 78, 95, 88, 0, 0];
            return (
              <View key={day} style={styles.chartBar}>
                <View style={styles.barContainer}>
                  <View style={[styles.bar, { height: heights[index] }]} />
                </View>
                <Text style={styles.chartLabel}>{day}</Text>
              </View>
            );
          })}
        </View>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Detailed Metrics</Text>
        <View style={styles.metricRow}>
          <View style={styles.metricLeft}>
            <Ionicons name="calendar" size={20} color="#6B7280" />
            <Text style={styles.metricLabel}>Days Present</Text>
          </View>
          <Text style={styles.metricValue}>24 / 26</Text>
        </View>
        <View style={styles.metricRow}>
          <View style={styles.metricLeft}>
            <Ionicons name="alarm" size={20} color="#6B7280" />
            <Text style={styles.metricLabel}>On-Time Check-ins</Text>
          </View>
          <Text style={styles.metricValue}>22 / 24</Text>
        </View>
        <View style={styles.metricRow}>
          <View style={styles.metricLeft}>
            <Ionicons name="location" size={20} color="#6B7280" />
            <Text style={styles.metricLabel}>Sites Visited</Text>
          </View>
          <Text style={styles.metricValue}>5</Text>
        </View>
        <View style={styles.metricRow}>
          <View style={styles.metricLeft}>
            <Ionicons name="trophy" size={20} color="#6B7280" />
            <Text style={styles.metricLabel}>Performance Rating</Text>
          </View>
          <Text style={styles.metricValue}>4.8 / 5.0</Text>
        </View>
      </View>

      <View style={styles.bottomSpacer} />
    </ScrollView>
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
  summaryRow: {
    flexDirection: 'row',
    padding: 20,
    gap: 12,
  },
  summaryCard: {
    flex: 1,
    padding: 20,
    borderRadius: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  summaryValue: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#fff',
    marginTop: 8,
  },
  summaryLabel: {
    fontSize: 14,
    color: '#fff',
    opacity: 0.9,
    marginTop: 4,
  },
  card: {
    backgroundColor: '#fff',
    marginHorizontal: 20,
    marginBottom: 16,
    padding: 20,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  cardHeader: {
    marginBottom: 20,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#111',
  },
  cardSubtitle: {
    fontSize: 14,
    color: '#9CA3AF',
    marginTop: 4,
  },
  taskStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  taskStatItem: {
    alignItems: 'center',
  },
  taskStatIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  taskStatValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111',
    marginBottom: 4,
  },
  taskStatLabel: {
    fontSize: 12,
    color: '#6B7280',
  },
  chartContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    height: 120,
  },
  chartBar: {
    flex: 1,
    alignItems: 'center',
  },
  barContainer: {
    flex: 1,
    justifyContent: 'flex-end',
    width: '100%',
    paddingHorizontal: 4,
  },
  bar: {
    backgroundColor: '#8B5CF6',
    borderRadius: 4,
    width: '100%',
  },
  chartLabel: {
    fontSize: 10,
    color: '#6B7280',
    marginTop: 8,
  },
  metricRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  metricLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  metricLabel: {
    fontSize: 14,
    color: '#374151',
    marginLeft: 12,
  },
  metricValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111',
  },
  bottomSpacer: {
    height: 100,
  },
});
