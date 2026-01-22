import { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  TextInput,
  Modal,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { useLanguage } from '../../contexts/LanguageContext';
import { useUser } from '../../contexts/UserContext';
import { format } from 'date-fns';

type Message = {
  id: string;
  senderId: string;
  senderName: string;
  senderRole: string;
  text: string;
  timestamp: Date;
  read: boolean;
};

type Conversation = {
  id: string;
  participantId: string;
  participantName: string;
  participantRole: string;
  lastMessage: string;
  lastMessageTime: Date;
  unreadCount: number;
  messages: Message[];
};

// Mock conversations based on hierarchy
const mockConversations: Record<string, Conversation[]> = {
  labour: [
    {
      id: '1',
      participantId: 'sup1',
      participantName: 'Rajesh Kumar',
      participantRole: 'supervisor',
      lastMessage: 'Task approved. Good work!',
      lastMessageTime: new Date(Date.now() - 3600000),
      unreadCount: 1,
      messages: [],
    },
  ],
  supervisor: [
    {
      id: '2',
      participantId: 'lab1',
      participantName: 'Amit Sharma',
      participantRole: 'labour',
      lastMessage: 'Work completed, please verify',
      lastMessageTime: new Date(Date.now() - 1800000),
      unreadCount: 2,
      messages: [],
    },
    {
      id: '3',
      participantId: 'lab2',
      participantName: 'Suresh Patil',
      participantRole: 'labour',
      lastMessage: 'Photo uploaded',
      lastMessageTime: new Date(Date.now() - 7200000),
      unreadCount: 0,
      messages: [],
    },
    {
      id: '4',
      participantId: 'eng1',
      participantName: 'Priya Mehta',
      participantRole: 'engineer',
      lastMessage: 'Review the material request',
      lastMessageTime: new Date(Date.now() - 10800000),
      unreadCount: 1,
      messages: [],
    },
  ],
  engineer: [
    {
      id: '5',
      participantId: 'sup1',
      participantName: 'Rajesh Kumar',
      participantRole: 'supervisor',
      lastMessage: 'Site inspection needed',
      lastMessageTime: new Date(Date.now() - 5400000),
      unreadCount: 0,
      messages: [],
    },
    {
      id: '6',
      participantId: 'sup2',
      participantName: 'Vikram Singh',
      participantRole: 'supervisor',
      lastMessage: 'Documentation ready',
      lastMessageTime: new Date(Date.now() - 14400000),
      unreadCount: 3,
      messages: [],
    },
    {
      id: '7',
      participantId: 'own1',
      participantName: 'Mr. Shah',
      participantRole: 'owner',
      lastMessage: 'Budget approved',
      lastMessageTime: new Date(Date.now() - 21600000),
      unreadCount: 0,
      messages: [],
    },
  ],
  owner: [
    {
      id: '8',
      participantId: 'eng1',
      participantName: 'Priya Mehta',
      participantRole: 'engineer',
      lastMessage: 'Material procurement update',
      lastMessageTime: new Date(Date.now() - 3600000),
      unreadCount: 1,
      messages: [],
    },
    {
      id: '9',
      participantId: 'eng2',
      participantName: 'Arjun Reddy',
      participantRole: 'engineer',
      lastMessage: 'Quality report submitted',
      lastMessageTime: new Date(Date.now() - 86400000),
      unreadCount: 0,
      messages: [],
    },
  ],
};

export default function ChatScreen() {
  const { t } = useLanguage();
  const { user } = useUser();
  const [conversations, setConversations] = useState<Conversation[]>(
    user ? mockConversations[user.role] || [] : []
  );
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [messageText, setMessageText] = useState('');
  const [showChatModal, setShowChatModal] = useState(false);

  const getHierarchyInfo = () => {
    if (!user) return { canChatWith: [], description: '' };

    switch (user.role) {
      case 'labour':
        return {
          canChatWith: ['Supervisor'],
          description: 'Report to your assigned supervisor',
        };
      case 'supervisor':
        return {
          canChatWith: ['Labour (Assigned)', 'Engineer'],
          description: 'Communicate with labour and report to engineer',
        };
      case 'engineer':
        return {
          canChatWith: ['Supervisor', 'Owner'],
          description: 'Coordinate with supervisors and report to owner',
        };
      case 'owner':
        return {
          canChatWith: ['Engineer', 'All Roles'],
          description: 'Access all communications',
        };
      default:
        return { canChatWith: [], description: '' };
    }
  };

  const handleOpenChat = (conversation: Conversation) => {
    setSelectedConversation(conversation);
    setShowChatModal(true);
    // Mark as read
    const updated = conversations.map((c) =>
      c.id === conversation.id ? { ...c, unreadCount: 0 } : c
    );
    setConversations(updated);
  };

  const handleSendMessage = () => {
    if (!messageText.trim() || !selectedConversation || !user) return;

    const newMessage: Message = {
      id: Date.now().toString(),
      senderId: 'current',
      senderName: user.name,
      senderRole: user.role,
      text: messageText,
      timestamp: new Date(),
      read: false,
    };

    const updatedConversation = {
      ...selectedConversation,
      messages: [...selectedConversation.messages, newMessage],
      lastMessage: messageText,
      lastMessageTime: new Date(),
    };

    setSelectedConversation(updatedConversation);
    setConversations(
      conversations.map((c) => (c.id === updatedConversation.id ? updatedConversation : c))
    );
    setMessageText('');
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'labour':
        return '#F59E0B';
      case 'supervisor':
        return '#10B981';
      case 'engineer':
        return '#3B82F6';
      case 'owner':
        return '#8B5CF6';
      default:
        return '#6B7280';
    }
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'labour':
        return 'construct';
      case 'supervisor':
        return 'people';
      case 'engineer':
        return 'build';
      case 'owner':
        return 'business';
      default:
        return 'person';
    }
  };

  const hierarchyInfo = getHierarchyInfo();

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />
      
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Messages</Text>
        <View style={styles.headerRight}>
          <TouchableOpacity style={styles.iconButton}>
            <Ionicons name="search" size={22} color="#111" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Hierarchy Info Card */}
      <View style={styles.hierarchyCard}>
        <View style={styles.hierarchyHeader}>
          <Ionicons name="git-network" size={20} color="#8B5CF6" />
          <Text style={styles.hierarchyTitle}>Communication Hierarchy</Text>
        </View>
        <Text style={styles.hierarchyDescription}>{hierarchyInfo.description}</Text>
        <View style={styles.hierarchyBadges}>
          {hierarchyInfo.canChatWith.map((role, index) => (
            <View key={index} style={styles.hierarchyBadge}>
              <Text style={styles.hierarchyBadgeText}>{role}</Text>
            </View>
          ))}
        </View>
      </View>

      {/* Conversations List */}
      <ScrollView style={styles.conversationsList} showsVerticalScrollIndicator={false}>
        {conversations.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="chatbubbles-outline" size={64} color="#D1D5DB" />
            <Text style={styles.emptyStateTitle}>No Conversations</Text>
            <Text style={styles.emptyStateText}>
              Start communicating with your team members
            </Text>
          </View>
        ) : (
          conversations.map((conversation) => (
            <TouchableOpacity
              key={conversation.id}
              style={styles.conversationCard}
              onPress={() => handleOpenChat(conversation)}
            >
              <View
                style={[
                  styles.conversationAvatar,
                  { backgroundColor: getRoleColor(conversation.participantRole) + '20' },
                ]}
              >
                <Ionicons
                  name={getRoleIcon(conversation.participantRole) as any}
                  size={24}
                  color={getRoleColor(conversation.participantRole)}
                />
              </View>

              <View style={styles.conversationContent}>
                <View style={styles.conversationHeader}>
                  <Text style={styles.conversationName}>{conversation.participantName}</Text>
                  <Text style={styles.conversationTime}>
                    {format(conversation.lastMessageTime, 'HH:mm')}
                  </Text>
                </View>
                <View style={styles.conversationFooter}>
                  <View style={styles.conversationRoleBadge}>
                    <Text style={styles.conversationRoleText}>
                      {conversation.participantRole.toUpperCase()}
                    </Text>
                  </View>
                  <Text style={styles.conversationLastMessage} numberOfLines={1}>
                    {conversation.lastMessage}
                  </Text>
                </View>
              </View>

              {conversation.unreadCount > 0 && (
                <View style={styles.unreadBadge}>
                  <Text style={styles.unreadBadgeText}>{conversation.unreadCount}</Text>
                </View>
              )}
            </TouchableOpacity>
          ))
        )}
      </ScrollView>

      {/* Chat Modal */}
      <Modal
        visible={showChatModal}
        animationType="slide"
        onRequestClose={() => setShowChatModal(false)}
      >
        {selectedConversation && (
          <KeyboardAvoidingView
            style={styles.chatContainer}
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            keyboardVerticalOffset={0}
          >
            <StatusBar style="dark" />
            
            {/* Chat Header */}
            <View style={styles.chatHeader}>
              <TouchableOpacity
                style={styles.backButton}
                onPress={() => setShowChatModal(false)}
              >
                <Ionicons name="arrow-back" size={24} color="#111" />
              </TouchableOpacity>

              <View style={styles.chatHeaderContent}>
                <View
                  style={[
                    styles.chatAvatar,
                    { backgroundColor: getRoleColor(selectedConversation.participantRole) + '20' },
                  ]}
                >
                  <Ionicons
                    name={getRoleIcon(selectedConversation.participantRole) as any}
                    size={20}
                    color={getRoleColor(selectedConversation.participantRole)}
                  />
                </View>
                <View>
                  <Text style={styles.chatHeaderName}>{selectedConversation.participantName}</Text>
                  <Text style={styles.chatHeaderRole}>
                    {selectedConversation.participantRole.toUpperCase()}
                  </Text>
                </View>
              </View>

              <TouchableOpacity style={styles.iconButton}>
                <Ionicons name="ellipsis-vertical" size={20} color="#111" />
              </TouchableOpacity>
            </View>

            {/* Messages Area */}
            <ScrollView style={styles.messagesArea} contentContainerStyle={styles.messagesContent}>
              {selectedConversation.messages.length === 0 ? (
                <View style={styles.noMessagesState}>
                  <Ionicons name="mail-open-outline" size={48} color="#D1D5DB" />
                  <Text style={styles.noMessagesText}>No messages yet</Text>
                  <Text style={styles.noMessagesSubtext}>Start the conversation</Text>
                </View>
              ) : (
                selectedConversation.messages.map((message) => (
                  <View
                    key={message.id}
                    style={[
                      styles.messageBubble,
                      message.senderId === 'current'
                        ? styles.messageBubbleSent
                        : styles.messageBubbleReceived,
                    ]}
                  >
                    <Text
                      style={[
                        styles.messageText,
                        message.senderId === 'current'
                          ? styles.messageTextSent
                          : styles.messageTextReceived,
                      ]}
                    >
                      {message.text}
                    </Text>
                    <Text
                      style={[
                        styles.messageTime,
                        message.senderId === 'current'
                          ? styles.messageTimeSent
                          : styles.messageTimeReceived,
                      ]}
                    >
                      {format(message.timestamp, 'HH:mm')}
                    </Text>
                  </View>
                ))
              )}
            </ScrollView>

            {/* Message Input */}
            <View style={styles.inputContainer}>
              <TouchableOpacity style={styles.attachButton}>
                <Ionicons name="add-circle" size={28} color="#8B5CF6" />
              </TouchableOpacity>
              <TextInput
                style={styles.messageInput}
                placeholder="Type a message..."
                placeholderTextColor="#9CA3AF"
                value={messageText}
                onChangeText={setMessageText}
                multiline
              />
              <TouchableOpacity
                style={[
                  styles.sendButton,
                  !messageText.trim() && styles.sendButtonDisabled,
                ]}
                onPress={handleSendMessage}
                disabled={!messageText.trim()}
              >
                <Ionicons
                  name="send"
                  size={20}
                  color={messageText.trim() ? '#fff' : '#D1D5DB'}
                />
              </TouchableOpacity>
            </View>
          </KeyboardAvoidingView>
        )}
      </Modal>
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
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#111',
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  hierarchyCard: {
    backgroundColor: '#fff',
    margin: 20,
    padding: 16,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  hierarchyHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  hierarchyTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#111',
    marginLeft: 8,
  },
  hierarchyDescription: {
    fontSize: 13,
    color: '#6B7280',
    marginBottom: 12,
  },
  hierarchyBadges: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  hierarchyBadge: {
    backgroundColor: '#F3E8FF',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  hierarchyBadgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#8B5CF6',
  },
  conversationsList: {
    flex: 1,
  },
  conversationCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 16,
    marginHorizontal: 20,
    marginBottom: 12,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  conversationAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  conversationContent: {
    flex: 1,
  },
  conversationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  conversationName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111',
  },
  conversationTime: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  conversationFooter: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  conversationRoleBadge: {
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
    marginRight: 8,
  },
  conversationRoleText: {
    fontSize: 9,
    fontWeight: '700',
    color: '#6B7280',
  },
  conversationLastMessage: {
    flex: 1,
    fontSize: 13,
    color: '#6B7280',
  },
  unreadBadge: {
    backgroundColor: '#8B5CF6',
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
  },
  unreadBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#fff',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 80,
  },
  emptyStateTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#6B7280',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyStateText: {
    fontSize: 14,
    color: '#9CA3AF',
    textAlign: 'center',
  },
  chatContainer: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  chatHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 60,
    paddingBottom: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  chatHeaderContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  chatAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  chatHeaderName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111',
  },
  chatHeaderRole: {
    fontSize: 11,
    fontWeight: '600',
    color: '#6B7280',
  },
  messagesArea: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  messagesContent: {
    padding: 16,
  },
  noMessagesState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 100,
  },
  noMessagesText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6B7280',
    marginTop: 12,
  },
  noMessagesSubtext: {
    fontSize: 13,
    color: '#9CA3AF',
    marginTop: 4,
  },
  messageBubble: {
    maxWidth: '75%',
    padding: 12,
    borderRadius: 16,
    marginBottom: 12,
  },
  messageBubbleSent: {
    backgroundColor: '#8B5CF6',
    alignSelf: 'flex-end',
    borderBottomRightRadius: 4,
  },
  messageBubbleReceived: {
    backgroundColor: '#fff',
    alignSelf: 'flex-start',
    borderBottomLeftRadius: 4,
  },
  messageText: {
    fontSize: 15,
    lineHeight: 20,
    marginBottom: 4,
  },
  messageTextSent: {
    color: '#fff',
  },
  messageTextReceived: {
    color: '#111',
  },
  messageTime: {
    fontSize: 11,
  },
  messageTimeSent: {
    color: 'rgba(255, 255, 255, 0.7)',
  },
  messageTimeReceived: {
    color: '#9CA3AF',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  attachButton: {
    marginRight: 8,
    marginBottom: 8,
  },
  messageInput: {
    flex: 1,
    backgroundColor: '#F3F4F6',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 15,
    color: '#111',
    maxHeight: 100,
  },
  sendButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#8B5CF6',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
  },
  sendButtonDisabled: {
    backgroundColor: '#F3F4F6',
  },
});
