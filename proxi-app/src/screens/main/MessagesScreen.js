import { useState, useEffect } from "react";
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, ActivityIndicator, RefreshControl } from "react-native";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { useAuth } from "../../context/AuthContext";
import { messagesAPI } from "../../services/api";

const timeAgo = (d) => {
  const s = Math.floor((new Date() - new Date(d)) / 1000);
  if (s < 60) return "Just now";
  if (s < 3600) return `${Math.floor(s/60)}m ago`;
  if (s < 86400) return `${Math.floor(s/3600)}h ago`;
  return `${Math.floor(s/86400)}d ago`;
};

export default function MessagesScreen({ navigation }) {
  const { user } = useAuth();
  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => { loadConversations(); }, []);

  const loadConversations = async () => {
    try {
      const res = await messagesAPI.getConversations();
      setConversations(res.data.conversations || []);
    } catch (e) { console.log(e); }
    finally { setLoading(false); setRefreshing(false); }
  };

  const getOtherPerson = (conv) => {
    if (conv.participant_one === user?.id) {
      return { name: conv.participant_two_name, score: conv.participant_two_score };
    }
    return { name: conv.participant_one_name, score: conv.participant_one_score };
  };

  if (loading) return (
    <View style={styles.loadingContainer}>
      <ActivityIndicator size="large" color="#1DB954" />
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Messages</Text>
        <Text style={styles.subtitle}>{conversations.length > 0 ? `${conversations.length} conversation${conversations.length > 1 ? "s" : ""}` : "Stay connected"}</Text>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); loadConversations(); }} tintColor="#1DB954" />}
      >
        {conversations.length === 0 ? (
          <View style={styles.emptyContainer}>
            <View style={styles.emptyIconWrap}>
              <Ionicons name="chatbubbles-outline" size={48} color="#1DB954" />
            </View>
            <Text style={styles.emptyTitle}>No messages yet</Text>
            <Text style={styles.emptySubtext}>
              Start a conversation by tapping the{"\n"}Message button on any listing or task
            </Text>
            <TouchableOpacity style={styles.emptyBtn} onPress={() => navigation.navigate("Home")}>
              <Text style={styles.emptyBtnText}>Browse listings</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <>
            {conversations.map((conv) => {
              const other = getOtherPerson(conv);
              return (
              <TouchableOpacity
              key={conv.id}
              style={styles.convCard}
              onPress={() => navigation.navigate("Chat", {
                conversationId: conv.id,
                otherPersonName: other.name,
                otherUserId: conv.participant_one === user?.id ? conv.participant_two : conv.participant_one,
                referenceId: conv.reference_id,
                referenceType: conv.reference_type,

              })}
              >
                <View style={styles.convAvatar}>
                  <Text style={styles.convAvatarText}>{other.name?.charAt(0)?.toUpperCase() || "U"}</Text>
                </View>
                <View style={styles.convInfo}>
                  <View style={styles.convTopRow}>
                    <Text style={styles.convName}>{other.name || "Unknown"}</Text>
                    <Text style={styles.convTime}>{timeAgo(conv.last_message_at)}</Text>
                  </View>
                  {conv.reference_title && (

                    <View style={styles.convReference}>
                      <Ionicons
                        name={conv.reference_type === "listing" ? "pricetag-outline" : "briefcase-outline"}
                        size={11}
                        color="#1DB954"
                      />
                      <Text style={styles.convReferenceText} numberOfLines={1}>
                        {conv.reference_title}
                        {conv.reference_price ? ` · ₦${parseFloat(conv.reference_price).toLocaleString()}` : ""}
                      </Text>
                    </View>
                )} 
                <Text style={styles.convLastMessage} numberOfLines={1}>
                  {conv.last_message || "Start a conversation"}
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={16} color="#555" />
            </TouchableOpacity>
          );
        }
        )}
          </>
        )}
        <View style={{ height: 100 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0A0A0A" },
  loadingContainer: { flex: 1, backgroundColor: "#0A0A0A", justifyContent: "center", alignItems: "center" },
  header: { paddingHorizontal: 20, paddingTop: 60, paddingBottom: 16 },
  title: { color: "#FFFFFF", fontSize: 28, fontWeight: "700" },
  subtitle: { color: "#888", fontSize: 14, marginTop: 4 },
  emptyContainer: { alignItems: "center", paddingTop: 80, paddingHorizontal: 40, gap: 12 },
  emptyIconWrap: { width: 100, height: 100, borderRadius: 50, backgroundColor: "#0D2818", justifyContent: "center", alignItems: "center", marginBottom: 8 },
  emptyTitle: { color: "#FFFFFF", fontSize: 22, fontWeight: "700" },
  emptySubtext: { color: "#888", fontSize: 14, textAlign: "center", lineHeight: 22 },
  emptyBtn: { marginTop: 8, backgroundColor: "#1DB954", paddingHorizontal: 24, paddingVertical: 12, borderRadius: 20 },
  emptyBtnText: { color: "#FFFFFF", fontSize: 14, fontWeight: "600" },
  convCard: { flexDirection: "row", alignItems: "center", gap: 14, padding: 16, borderBottomWidth: 1, borderBottomColor: "#1A1A1A" },
  convAvatar: { width: 52, height: 52, borderRadius: 26, backgroundColor: "#1DB954", justifyContent: "center", alignItems: "center" },
  convAvatarText: { color: "#FFFFFF", fontSize: 20, fontWeight: "700" },
  convInfo: { flex: 1 },
  convTopRow: { flexDirection: "row", justifyContent: "space-between", marginBottom: 4 },
  convName: { color: "#FFFFFF", fontSize: 15, fontWeight: "600" },
  convTime: { color: "#555", fontSize: 12 },
  convLastMessage: { color: "#888", fontSize: 13 },
  convReference: { flexDirection: "row", alignItems: "center", gap: 4, marginBottom: 2 },
  convReferenceText: { color: "#1DB954", fontSize: 11, fontWeight: "500", flex: 1 },
});
