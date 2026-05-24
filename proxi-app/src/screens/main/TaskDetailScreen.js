import { useState, useEffect } from "react";
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, ActivityIndicator, Alert } from "react-native";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { useAuth } from "../../context/AuthContext";
import { tasksAPI } from "../../services/api";

const timeAgo = (d) => {
  const s = Math.floor((new Date() - new Date(d)) / 1000);
  if (s < 60) return "Just now";
  if (s < 3600) return `${Math.floor(s/60)}m ago`;
  if (s < 86400) return `${Math.floor(s/3600)}h ago`;
  return `${Math.floor(s/86400)}d ago`;
};

export default function TaskDetailScreen({ route, navigation }) {
  const { taskId } = route.params;
  const { user } = useAuth();
  const [task, setTask] = useState(null);
  const [loading, setLoading] = useState(true);
  const [applying, setApplying] = useState(false);

  useEffect(() => { loadTask(); }, []);

  const loadTask = async () => {
    try {
      const res = await tasksAPI.getOne(taskId);
      setTask(res.data.task);
    } catch (e) {
      Alert.alert("Error", "Could not load task");
      navigation.goBack();
    } finally {
      setLoading(false);
    }
  };

  const handleApply = async () => {
    setApplying(true);
    try {
      await tasksAPI.apply(taskId, { pitch: "I am interested in this task" });
      Alert.alert(
        "Applied Successfully!",
        "Your application has been sent. Once selected, payment will be held in escrow before work begins.",
        [{ text: "OK", onPress: () => navigation.goBack() }]
      );
    } catch (e) {
      Alert.alert("Error", e.response?.data?.message || "Failed to apply");
    } finally {
      setApplying(false);
    }
  };

  const getTypeColor = (type) => {
    switch(type) {
      case "delivery": return "#378ADD";
      case "skilled": return "#FFD700";
      case "errand": return "#1DB954";
      case "labour": return "#FF6B35";
      case "promotion": return "#FF6B9D";
      default: return "#888";
    }
  };

  if (loading) return (
    <View style={styles.loadingContainer}>
      <ActivityIndicator size="large" color="#1DB954" />
    </View>
  );

  if (!task) return null;
  const isOwner = task.poster_id === user?.id;
  const typeColor = getTypeColor(task.task_type);

  return (
    <View style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.backBtn} onPress={() => {
            if (navigation.canGoBack()) {
              navigation.goBack();
            } else {
              navigation.navigate("Main");
            }
          }}>
            <Ionicons name="arrow-back" size={20} color="#FFFFFF" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.shareBtn}>
            <Ionicons name="share-outline" size={20} color="#888" />
          </TouchableOpacity>
        </View>

        {/* Hero section */}
        <View style={styles.hero}>
          <View style={[styles.typePill, { backgroundColor: typeColor + "20", borderColor: typeColor }]}>
            <MaterialCommunityIcons name="briefcase-outline" size={14} color={typeColor} />
            <Text style={[styles.typePillText, { color: typeColor }]}>{task.task_type?.toUpperCase()}</Text>
          </View>
          <Text style={styles.taskTitle}>{task.title}</Text>
          <View style={styles.budgetRow}>
            <Text style={styles.budget}>₦{parseFloat(task.budget).toLocaleString()}</Text>
            <Text style={styles.budgetLabel}>Budget</Text>
          </View>
        </View>

        {/* Details card */}
        <View style={styles.detailsCard}>
          <View style={styles.detailItem}>
            <View style={styles.detailIcon}>
              <Ionicons name="location-outline" size={18} color="#1DB954" />
            </View>
            <View>
              <Text style={styles.detailLabel}>Location</Text>
              <Text style={styles.detailValue}>{task.area_description || "Not specified"}</Text>
            </View>
          </View>
          <View style={styles.detailDivider} />
          <View style={styles.detailItem}>
            <View style={styles.detailIcon}>
              <Ionicons name="people-outline" size={18} color="#378ADD" />
            </View>
            <View>
              <Text style={styles.detailLabel}>Workers needed</Text>
              <Text style={styles.detailValue}>{task.workers_needed || 1} person{task.workers_needed > 1 ? "s" : ""}</Text>
            </View>
          </View>
          {task.required_skill && (
            <>
              <View style={styles.detailDivider} />
              <View style={styles.detailItem}>
                <View style={styles.detailIcon}>
                  <MaterialCommunityIcons name="hammer-wrench" size={18} color="#FFD700" />
                </View>
                <View>
                  <Text style={styles.detailLabel}>Required skill</Text>
                  <Text style={styles.detailValue}>{task.required_skill}</Text>
                </View>
              </View>
            </>
          )}
          <View style={styles.detailDivider} />
          <View style={styles.detailItem}>
            <View style={styles.detailIcon}>
              <Ionicons name="time-outline" size={18} color="#888" />
            </View>
            <View>
              <Text style={styles.detailLabel}>Posted</Text>
              <Text style={styles.detailValue}>{timeAgo(task.created_at)}</Text>
            </View>
          </View>
        </View>

        {/* Description */}
        {task.description && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>About this task</Text>
            <View style={styles.descriptionCard}>
              <Text style={styles.description}>{task.description}</Text>
            </View>
          </View>
        )}

        {/* Posted by */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Posted by</Text>
          <TouchableOpacity style={styles.posterCard}>
            <View style={styles.posterAvatar}>
              <Text style={styles.posterAvatarText}>{task.poster_name?.charAt(0)?.toUpperCase() || "U"}</Text>
            </View>
            <View style={styles.posterInfo}>
              <Text style={styles.posterName}>{task.poster_name || "Unknown"}</Text>
              <View style={styles.posterMeta}>
                <MaterialCommunityIcons name="shield-check-outline" size={14} color="#1DB954" />
                <Text style={styles.posterScore}>Score: {task.poster_score || "0.00"}</Text>
                <Text style={styles.posterDot}>�</Text>
                <Text style={styles.posterTier}>{task.poster_tier?.replace("_", " ") || "Newcomer"}</Text>
              </View>
              {parseFloat(task.poster_score) === 0 && (
                <Text style={styles.newUserNote}>New user � payment protected by escrow</Text>
              )}
            </View>
            <Ionicons name="chevron-forward" size={16} color="#555" />
          </TouchableOpacity>
        </View>
        <TouchableOpacity
          style={styles.reviewsBtn}
          onPress={() => navigation.navigate("Reviews", {
            userId: listing.seller_id,
            userName: listing.seller_name,
            referenceId: listing.id,
            referenceType: "listing",
            canReview: !isOwner,
          })}
        >
          <Ionicons name="star-outline" size={16} color="#FFD700" />
          <Text style={styles.reviewsBtnText}>View & Leave Reviews</Text>
          <Ionicons name="chevron-forward" size={16} color="#555" />
        </TouchableOpacity>


        {/* Escrow notice */}
        <View style={styles.escrowNotice}>
          <MaterialCommunityIcons name="shield-check-outline" size={20} color="#1DB954" />
          <View style={styles.escrowText}>
            <Text style={styles.escrowTitle}>Protected by Proxi Escrow</Text>
            <Text style={styles.escrowDesc}>"Poster pays first - funds locked - you complete task - poster confirms - you get paid"</Text>
          </View>
        </View>

        <View style={{ height: 120 }} />
      </ScrollView>

      {/* Bottom action */}
      {!isOwner && task.status === "open" && (
        <View style={styles.bottomBar}>
          <TouchableOpacity
            style={styles.messageBtn}
            onPress={() => navigation.navigate("Chat", {
              otherUserId: task.poster_id,
              otherPersonName: task.poster_name,
              referenceId: task.id,
              referenceType: "task"
            })}
          >
            <Ionicons name="chatbubble-outline" size={20} color="#1DB954" />
            <Text style={styles.messageBtnText}>Message</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.applyBtn, applying && { opacity: 0.6 }]}
            onPress={() => Alert.alert(
              "Apply for this task",
              `Earn ?${parseFloat(task.budget).toLocaleString()} when completed.\n\nPayment is protected by Proxi Escrow.`,
              [
                { text: "Cancel", style: "cancel" },
                { text: "Apply Now", onPress: handleApply }
              ]
            )}
            disabled={applying}
          >
            {applying ? <ActivityIndicator color="#fff" size="small" /> : (
              <>
                <Text style={styles.applyBtnText}>Apply for this task</Text>
                <Text style={styles.applyBtnSub}>₦{parseFloat(task.budget).toLocaleString()} on completion</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      )}

      {isOwner && (
        <View style={styles.bottomBar}>
          <View style={styles.ownerBar}>
            <MaterialCommunityIcons name="check-circle-outline" size={22} color="#1DB954" />
            <Text style={styles.ownerText}>This is your task</Text>
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0A0A0A" },
  loadingContainer: { flex: 1, backgroundColor: "#0A0A0A", justifyContent: "center", alignItems: "center" },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", padding: 20, paddingTop: 60 },
  backBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: "#1A1A1A", justifyContent: "center", alignItems: "center" },
  shareBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: "#1A1A1A", justifyContent: "center", alignItems: "center" },
  hero: { paddingHorizontal: 20, paddingBottom: 24 },
  typePill: { flexDirection: "row", alignItems: "center", gap: 6, alignSelf: "flex-start", paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, borderWidth: 1, marginBottom: 12 },
  typePillText: { fontSize: 11, fontWeight: "700" },
  taskTitle: { fontSize: 26, fontWeight: "700", color: "#FFFFFF", marginBottom: 16, lineHeight: 32 },
  budgetRow: { flexDirection: "row", alignItems: "baseline", gap: 8 },
  budget: { fontSize: 36, fontWeight: "700", color: "#1DB954" },
  budgetLabel: { color: "#888", fontSize: 14 },
  detailsCard: { margin: 20, backgroundColor: "#1A1A1A", borderRadius: 16, padding: 16, borderWidth: 1, borderColor: "#2A2A2A" },
  detailItem: { flexDirection: "row", alignItems: "center", gap: 12, paddingVertical: 4 },
  detailIcon: { width: 36, height: 36, borderRadius: 10, backgroundColor: "#0A0A0A", justifyContent: "center", alignItems: "center" },
  detailLabel: { color: "#888", fontSize: 11, marginBottom: 2 },
  detailValue: { color: "#FFFFFF", fontSize: 14, fontWeight: "500" },
  detailDivider: { height: 1, backgroundColor: "#2A2A2A", marginVertical: 8 },
  section: { paddingHorizontal: 20, marginBottom: 20 },
  sectionTitle: { color: "#888", fontSize: 12, fontWeight: "600", textTransform: "uppercase", letterSpacing: 0.8, marginBottom: 10 },
  descriptionCard: { backgroundColor: "#1A1A1A", borderRadius: 14, padding: 16, borderWidth: 1, borderColor: "#2A2A2A" },
  description: { color: "#CCCCCC", fontSize: 15, lineHeight: 24 },
  posterCard: { flexDirection: "row", alignItems: "center", gap: 12, backgroundColor: "#1A1A1A", borderRadius: 14, padding: 14, borderWidth: 1, borderColor: "#2A2A2A" },
  posterAvatar: { width: 48, height: 48, borderRadius: 24, backgroundColor: "#1DB954", justifyContent: "center", alignItems: "center" },
  posterAvatarText: { color: "#FFFFFF", fontSize: 20, fontWeight: "700" },
  posterInfo: { flex: 1 },
  posterName: { color: "#FFFFFF", fontSize: 15, fontWeight: "600", marginBottom: 4 },
  posterMeta: { flexDirection: "row", alignItems: "center", gap: 4 },
  posterScore: { color: "#888", fontSize: 13 },
  posterDot: { color: "#555" },
  posterTier: { color: "#555", fontSize: 13 },
  newUserNote: { color: "#378ADD", fontSize: 11, marginTop: 4 },
  escrowNotice: { flexDirection: "row", alignItems: "flex-start", gap: 12, backgroundColor: "#0D2818", borderRadius: 14, padding: 16, margin: 20, marginTop: 0, borderWidth: 1, borderColor: "#1DB954" },
  escrowText: { flex: 1 },
  escrowTitle: { color: "#1DB954", fontSize: 14, fontWeight: "600", marginBottom: 4 },
  escrowDesc: { color: "#888", fontSize: 12, lineHeight: 18 },
  bottomBar: { position: "absolute", bottom: 0, left: 0, right: 0, padding: 16, backgroundColor: "#0A0A0A", borderTopWidth: 1, borderTopColor: "#1A1A1A", flexDirection: "row", gap: 10 },
  messageBtn: { backgroundColor: "#1A1A1A", borderRadius: 14, paddingVertical: 14, paddingHorizontal: 20, alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: "#1DB954", gap: 4 },
  messageBtnText: { color: "#1DB954", fontSize: 13, fontWeight: "600" },
  applyBtn: { flex: 1, backgroundColor: "#1DB954", borderRadius: 14, paddingVertical: 12, alignItems: "center" },
  applyBtnText: { color: "#FFFFFF", fontSize: 15, fontWeight: "700" },
  applyBtnSub: { color: "rgba(255,255,255,0.7)", fontSize: 11, marginTop: 2 },
  ownerBar: { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8 },
  ownerText: { color: "#1DB954", fontSize: 15, fontWeight: "600" },
  reviewsBtn: { flexDirection: "row", alignItems: "center", gap: 10, backgroundColor: "#1A1400", borderRadius: 12, padding: 14, marginHorizontal: 20, marginBottom: 20, borderWidth: 1, borderColor: "#FFD70040" },
  reviewsBtnText: { flex: 1, color: "#FFD700", fontSize: 14, fontWeight: "500" },
});
