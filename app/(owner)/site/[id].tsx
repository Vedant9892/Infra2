import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  Platform,
  Image,
  TextInput,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

const { width } = Dimensions.get('window');

export default function SiteDashboard() {
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const [activeTab, setActiveTab] = useState('overview');
  const [selectedChat, setSelectedChat] = useState(null);
  const [messageText, setMessageText] = useState('');

  // Mock data
  const siteData = {
    name: 'Mumbai Residential Complex',
    location: 'Andheri West, Mumbai',
    stats: { workers: 45, progress: 67, budget: '₹2.5 Cr', spent: '₹1.68 Cr', issues: 0 },
    attendance: [
      { day: 'Mon', present: 42 }, { day: 'Tue', present: 44 }, { day: 'Wed', present: 41 },
      { day: 'Thu', present: 45 }, { day: 'Fri', present: 43 }, { day: 'Sat', present: 40 },
    ],
  };

  const teamMembers = [
    { id: '1', name: 'Rahul Sharma', role: 'Site Engineer', photo: 'https://i.pravatar.cc/150?img=12', status: 'online', unreadMessages: 3 },
    { id: '2', name: 'Priya Patel', role: 'Site Supervisor', photo: 'https://i.pravatar.cc/150?img=47', status: 'online', unreadMessages: 1 },
    { id: '3', name: 'Amit Kumar', role: 'Site Engineer', photo: 'https://i.pravatar.cc/150?img=33', status: 'offline', unreadMessages: 0 },
  ];

  const [messages, setMessages] = useState([
    { id: '1', senderId: '1', text: 'Foundation work completed. Ready for inspection.', timestamp: new Date(Date.now() - 3600000), isOwner: false },
    { id: '2', senderId: 'owner', text: "Great! I'll visit tomorrow morning.", timestamp: new Date(Date.now() - 1800000), isOwner: true },
  ]);

  const statCards = [
    { label: 'Workers', value: 45, icon: 'people', color: '#8B5CF6' },
    { label: 'Progress', value: '67%', icon: 'trending-up', color: '#06B6D4' },
    { label: 'Budget', value: siteData.stats.spent, icon: 'cash', color: '#10B981' },
    { label: 'Issues', value: 0, icon: 'alert-circle', color: '#EF4444' },
  ];

  const handleSendMessage = () => {
    if (messageText.trim() && selectedChat) {
      setMessages([...messages, {
        id: Date.now().toString(),
        senderId: 'owner',
        text: messageText.trim(),
        timestamp: new Date(),
        isOwner: true,
      }]);
      setMessageText('');
    }
  };

  const formatTime = (date) => {
    const diff = new Date().getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    if (minutes < 1) return 'Just now';
    if (minutes < 60) return minutes + 'm ago';
    if (hours < 24) return hours + 'h ago';
    return date.toLocaleDateString();
  };

  const renderOverview = () => (
    <ScrollView style={styles.tabContent} showsVerticalScrollIndicator={false}>
      <View style={styles.statsGrid}>
        {statCards.map((stat, i) => (
          <View key={i} style={styles.statCard}>
            <View style={[styles.statIcon, { backgroundColor: stat.color + '15' }]}>
              <Ionicons name={stat.icon} size={24} color={stat.color} />
            </View>
            <Text style={styles.statValue}>{stat.value}</Text>
            <Text style={styles.statLabel}>{stat.label}</Text>
          </View>
        ))}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Weekly Attendance</Text>
        <View style={styles.chartCard}>
          <View style={styles.attendanceChart}>
            {siteData.attendance.map((day, i) => {
              const pct = (day.present / 45) * 100;
              return (
                <View key={i} style={styles.barContainer}>
                  <View style={styles.barWrapper}>
                    <LinearGradient colors={['#8B5CF6', '#7C3AED']} style={[styles.bar, { height: pct + '%' }]} />
                  </View>
                  <Text style={styles.barLabel}>{day.day}</Text>
                  <Text style={styles.barValue}>{day.present}</Text>
                </View>
              );
            })}
          </View>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Quick Actions</Text>
        <View style={styles.actionsGrid}>
          {[
            { icon: 'cube', label: 'Stock', colors: ['#10B981', '#059669'], route: `/(owner)/stock/${id}` },
            { icon: 'receipt', label: 'GST Bills', colors: ['#8B5CF6', '#7C3AED'], route: `/(owner)/bills/${id}` },
            { icon: 'people', label: 'Workers', colors: ['#06B6D4', '#0891B2'] },
            { icon: 'document-text', label: 'Reports', colors: ['#F59E0B', '#D97706'] },
          ].map((action, i) => (
            <TouchableOpacity
              key={i}
              style={styles.actionButton}
              onPress={() => action.route && router.push(action.route)}
            >
              <LinearGradient colors={action.colors} style={styles.actionGradient}>
                <Ionicons name={action.icon} size={24} color="#fff" />
              </LinearGradient>
              <Text style={styles.actionText}>{action.label}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
      <View style={{ height: 100 }} />
    </ScrollView>
  );

  const renderAnalytics = () => (
    <ScrollView style={styles.tabContent} showsVerticalScrollIndicator={false}>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Budget Distribution</Text>
        <View style={styles.budgetCard}>
          {[
            { label: 'Labour', value: '₹80L', color: '#8B5CF6' },
            { label: 'Materials', value: '₹65L', color: '#06B6D4' },
            { label: 'Equipment', value: '₹23L', color: '#10B981' },
          ].map((item, i) => (
            <View key={i} style={styles.budgetRow}>
              <View style={styles.budgetItem}>
                <View style={[styles.budgetDot, { backgroundColor: item.color }]} />
                <Text style={styles.budgetLabel}>{item.label}</Text>
              </View>
              <Text style={styles.budgetValue}>{item.value}</Text>
            </View>
          ))}
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Performance Metrics</Text>
        <View style={styles.metricsGrid}>
          {[
            { value: '94%', label: 'Efficiency', icon: 'trending-up', color: '#10B981' },
            { value: '8.5/10', label: 'Quality', icon: 'star', color: '#F59E0B' },
            { value: '98%', label: 'Safety', icon: 'shield-checkmark', color: '#06B6D4' },
          ].map((metric, i) => (
            <View key={i} style={styles.metricCard}>
              <Text style={styles.metricValue}>{metric.value}</Text>
              <Text style={styles.metricLabel}>{metric.label}</Text>
              <Ionicons name={metric.icon} size={20} color={metric.color} />
            </View>
          ))}
        </View>
      </View>
      <View style={{ height: 100 }} />
    </ScrollView>
  );

  const renderChat = () => {
    if (!selectedChat) {
      return (
        <ScrollView style={styles.tabContent}>
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Team Messages</Text>
            {teamMembers.map((member) => (
              <TouchableOpacity key={member.id} style={styles.chatListItem} onPress={() => setSelectedChat(member.id)}>
                <View style={styles.chatAvatarContainer}>
                  <Image source={{ uri: member.photo }} style={styles.chatAvatar} />
                  <View style={[styles.statusDot, { backgroundColor: member.status === 'online' ? '#10B981' : '#9CA3AF' }]} />
                </View>
                <View style={styles.chatInfo}>
                  <Text style={styles.chatName}>{member.name}</Text>
                  <Text style={styles.chatRole}>{member.role}</Text>
                </View>
                {member.unreadMessages > 0 && (
                  <View style={styles.unreadBadge}>
                    <Text style={styles.unreadText}>{member.unreadMessages}</Text>
                  </View>
                )}
                <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>
      );
    }

    const member = teamMembers.find(m => m.id === selectedChat);
    const chatMessages = messages.filter(m => m.senderId === selectedChat || m.isOwner);

    return (
      <View style={styles.chatContainer}>
        <View style={styles.chatHeader}>
          <TouchableOpacity onPress={() => setSelectedChat(null)}>
            <Ionicons name="arrow-back" size={24} color="#374151" />
          </TouchableOpacity>
          <Image source={{ uri: member?.photo }} style={styles.chatHeaderAvatar} />
          <View style={styles.chatHeaderInfo}>
            <Text style={styles.chatHeaderName}>{member?.name}</Text>
            <Text style={styles.chatHeaderStatus}>{member?.status === 'online' ? '🟢 Online' : '⚫ Offline'}</Text>
          </View>
        </View>

        <ScrollView style={styles.messagesContainer}>
          {chatMessages.map((msg) => (
            <View key={msg.id} style={[styles.messageBubble, msg.isOwner ? styles.messageBubbleOwner : styles.messageBubbleOther]}>
              <Text style={[styles.messageText, msg.isOwner && styles.messageTextOwner]}>{msg.text}</Text>
              <Text style={[styles.messageTime, msg.isOwner && styles.messageTimeOwner]}>{formatTime(msg.timestamp)}</Text>
            </View>
          ))}
        </ScrollView>

        <View style={styles.chatInputContainer}>
          <TextInput
            style={styles.chatInput}
            placeholder="Type a message..."
            value={messageText}
            onChangeText={setMessageText}
            multiline
          />
          <TouchableOpacity style={styles.sendButton} onPress={handleSendMessage}>
            <LinearGradient colors={['#8B5CF6', '#7C3AED']} style={styles.sendButtonGradient}>
              <Ionicons name="send" size={20} color="#fff" />
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  const renderTeam = () => (
    <ScrollView style={styles.tabContent}>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Site Team</Text>
        <View style={styles.teamGrid}>
          {teamMembers.map((member) => (
            <View key={member.id} style={styles.teamCard}>
              <Image source={{ uri: member.photo }} style={styles.teamAvatar} />
              <View style={[styles.teamStatusDot, { backgroundColor: member.status === 'online' ? '#10B981' : '#9CA3AF' }]} />
              <Text style={styles.teamName}>{member.name}</Text>
              <Text style={styles.teamRole}>{member.role}</Text>
              <View style={styles.teamActions}>
                <TouchableOpacity style={styles.teamActionButton}>
                  <Ionicons name="call" size={18} color="#8B5CF6" />
                </TouchableOpacity>
                <TouchableOpacity style={styles.teamActionButton} onPress={() => { setActiveTab('chat'); setSelectedChat(member.id); }}>
                  <Ionicons name="chatbubble" size={18} color="#06B6D4" />
                </TouchableOpacity>
              </View>
            </View>
          ))}
        </View>
      </View>
      <View style={{ height: 100 }} />
    </ScrollView>
  );

  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      <LinearGradient colors={['#8B5CF6', '#7C3AED']} style={styles.header}>
        <View style={styles.headerContent}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#fff" />
          </TouchableOpacity>
          <View style={styles.headerText}>
            <Text style={styles.headerTitle}>{siteData.name}</Text>
            <Text style={styles.headerSubtitle}>{siteData.location}</Text>
          </View>
          <TouchableOpacity>
            <Ionicons name="ellipsis-vertical" size={24} color="#fff" />
          </TouchableOpacity>
        </View>

        <View style={styles.tabsContainer}>
          {['overview', 'analytics', 'chat', 'team'].map((tab) => (
            <TouchableOpacity key={tab} style={[styles.tab, activeTab === tab && styles.tabActive]} onPress={() => setActiveTab(tab)}>
              <Text style={[styles.tabText, activeTab === tab && styles.tabTextActive]}>
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
              </Text>
              {activeTab === tab && <View style={styles.tabIndicator} />}
            </TouchableOpacity>
          ))}
        </View>
      </LinearGradient>

      {activeTab === 'overview' && renderOverview()}
      {activeTab === 'analytics' && renderAnalytics()}
      {activeTab === 'chat' && renderChat()}
      {activeTab === 'team' && renderTeam()}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9FAFB' },
  header: { paddingTop: Platform.OS === 'ios' ? 60 : 40, paddingBottom: 0 },
  headerContent: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingBottom: 20 },
  backButton: { padding: 8 },
  headerText: { flex: 1, marginLeft: 12 },
  headerTitle: { fontSize: 20, fontWeight: '700', color: '#fff', marginBottom: 4 },
  headerSubtitle: { fontSize: 14, color: '#E9D5FF' },
  tabsContainer: { flexDirection: 'row', paddingHorizontal: 20, gap: 8 },
  tab: { flex: 1, paddingVertical: 12, alignItems: 'center', position: 'relative' },
  tabActive: {},
  tabText: { fontSize: 14, fontWeight: '600', color: '#E9D5FF' },
  tabTextActive: { color: '#fff' },
  tabIndicator: { position: 'absolute', bottom: 0, left: '20%', right: '20%', height: 3, backgroundColor: '#fff', borderRadius: 2 },
  tabContent: { flex: 1 },
  section: { padding: 20 },
  sectionTitle: { fontSize: 18, fontWeight: '700', color: '#1F2937', marginBottom: 16 },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', padding: 16, gap: 12 },
  statCard: { width: (width - 56) / 2, backgroundColor: '#fff', borderRadius: 16, padding: 16, alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 2 },
  statIcon: { width: 48, height: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
  statValue: { fontSize: 24, fontWeight: '700', color: '#1F2937', marginBottom: 4 },
  statLabel: { fontSize: 12, color: '#6B7280' },
  chartCard: { backgroundColor: '#fff', borderRadius: 16, padding: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 2 },
  attendanceChart: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', height: 200 },
  barContainer: { flex: 1, alignItems: 'center' },
  barWrapper: { width: 32, height: 160, justifyContent: 'flex-end' },
  bar: { width: '100%', borderRadius: 8 },
  barLabel: { fontSize: 12, color: '#6B7280', marginTop: 8 },
  barValue: { fontSize: 11, color: '#9CA3AF', marginTop: 2 },
  actionsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  actionButton: { width: (width - 64) / 4, alignItems: 'center' },
  actionGradient: { width: 56, height: 56, borderRadius: 16, alignItems: 'center', justifyContent: 'center', marginBottom: 8 },
  actionText: { fontSize: 12, color: '#374151', textAlign: 'center' },
  budgetCard: { backgroundColor: '#fff', borderRadius: 16, padding: 20, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 2, gap: 16 },
  budgetRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  budgetItem: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  budgetDot: { width: 12, height: 12, borderRadius: 6 },
  budgetLabel: { fontSize: 15, color: '#374151' },
  budgetValue: { fontSize: 16, fontWeight: '600', color: '#1F2937' },
  metricsGrid: { flexDirection: 'row', gap: 12 },
  metricCard: { flex: 1, backgroundColor: '#fff', borderRadius: 16, padding: 16, alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 2 },
  metricValue: { fontSize: 24, fontWeight: '700', color: '#1F2937', marginBottom: 4 },
  metricLabel: { fontSize: 12, color: '#6B7280', marginBottom: 12 },
  chatListItem: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderRadius: 12, padding: 16, marginBottom: 12, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 1 },
  chatAvatarContainer: { position: 'relative', marginRight: 12 },
  chatAvatar: { width: 48, height: 48, borderRadius: 24 },
  statusDot: { position: 'absolute', bottom: 0, right: 0, width: 14, height: 14, borderRadius: 7, borderWidth: 2, borderColor: '#fff' },
  chatInfo: { flex: 1 },
  chatName: { fontSize: 16, fontWeight: '600', color: '#1F2937', marginBottom: 4 },
  chatRole: { fontSize: 14, color: '#6B7280' },
  unreadBadge: { backgroundColor: '#8B5CF6', borderRadius: 12, paddingHorizontal: 8, paddingVertical: 4, marginRight: 8 },
  unreadText: { fontSize: 12, fontWeight: '600', color: '#fff' },
  chatContainer: { flex: 1, backgroundColor: '#F9FAFB' },
  chatHeader: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', padding: 16, borderBottomWidth: 1, borderBottomColor: '#E5E7EB', gap: 12 },
  chatHeaderAvatar: { width: 40, height: 40, borderRadius: 20 },
  chatHeaderInfo: { flex: 1 },
  chatHeaderName: { fontSize: 16, fontWeight: '600', color: '#1F2937', marginBottom: 2 },
  chatHeaderStatus: { fontSize: 13, color: '#6B7280' },
  messagesContainer: { flex: 1, padding: 16 },
  messageBubble: { maxWidth: '75%', padding: 12, borderRadius: 16, marginBottom: 12 },
  messageBubbleOwner: { backgroundColor: '#8B5CF6', alignSelf: 'flex-end', borderBottomRightRadius: 4 },
  messageBubbleOther: { backgroundColor: '#fff', alignSelf: 'flex-start', borderBottomLeftRadius: 4 },
  messageText: { fontSize: 15, color: '#1F2937', marginBottom: 4 },
  messageTextOwner: { color: '#fff' },
  messageTime: { fontSize: 11, color: '#9CA3AF' },
  messageTimeOwner: { color: '#E9D5FF' },
  chatInputContainer: { flexDirection: 'row', alignItems: 'flex-end', padding: 16, backgroundColor: '#fff', borderTopWidth: 1, borderTopColor: '#E5E7EB', gap: 12 },
  chatInput: { flex: 1, backgroundColor: '#F3F4F6', borderRadius: 24, paddingHorizontal: 16, paddingVertical: 12, fontSize: 15, maxHeight: 100 },
  sendButton: { width: 44, height: 44 },
  sendButtonGradient: { width: '100%', height: '100%', borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  teamGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 16 },
  teamCard: { width: (width - 56) / 2, backgroundColor: '#fff', borderRadius: 16, padding: 16, alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 2, position: 'relative' },
  teamAvatar: { width: 64, height: 64, borderRadius: 32, marginBottom: 12 },
  teamStatusDot: { position: 'absolute', top: 24, right: '30%', width: 16, height: 16, borderRadius: 8, borderWidth: 3, borderColor: '#fff' },
  teamName: { fontSize: 15, fontWeight: '600', color: '#1F2937', marginBottom: 4, textAlign: 'center' },
  teamRole: { fontSize: 12, color: '#6B7280', marginBottom: 12, textAlign: 'center' },
  teamActions: { flexDirection: 'row', gap: 8 },
  teamActionButton: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#F3F4F6', alignItems: 'center', justifyContent: 'center' },
});
