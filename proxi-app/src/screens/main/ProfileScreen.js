import { useState, useEffect } from "react";
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, ActivityIndicator, Alert, RefreshControl } from "react-native";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { useAuth } from "../../context/AuthContext";
import { authAPI, listingsAPI, tasksAPI } from "../../services/api";

export default function ProfileScreen({ navigation }) {
  const { user, logout } = useAuth();
  const [profile, setProfile] = useState(null);
  const [myListings, setMyListings] = useState([]);
  const [myTasks, setMyTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState("listings");

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    try {
      const [p, l, t] = await Promise.all([authAPI.getMe(), listingsAPI.getMine(), tasksAPI.getMine()]);
      setProfile(p.data.user);
      setMyListings(l.data.listings || []);
      setMyTasks(t.data.tasks || []);
    } catch (e) { console.log(e); }
    finally { setLoading(false); setRefreshing(false); }
  };

  const getTierColor = (tier) => {
    switch(tier) {
      case "elite": return "#FFD700";
      case "verified_pro": return "#1DB954";
      case "trusted": return "#378ADD";
      default: return "#888";
    }
  };

  const handleLogout = () => {
    Alert.alert("Logout", "Are you sure?", [
      { text: "Cancel", style: "cancel" },
      { text: "Logout", style: "destructive", onPress: logout },
    ]);
  };

  if (loading) return (
    <View style={styles.loadingContainer}>
      <ActivityIndicator size="large" color="#1DB954" />
    </View>
  );

  const tierColor = getTierColor(profile?.score_tier);

  return (
    <View style={styles.container}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); loadData(); }} tintColor="#1DB954" />}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Profile</Text>
          <TouchableOpacity style={styles.settingsBtn} onPress={handleLogout}>
            <Ionicons name="log-out-outline" size={20} color="#FF3B30" />
          </TouchableOpacity>
        </View>

        {/* Profile card */}
        <View style={styles.profileCard}>
          <View style={[styles.avatar, { borderColor: tierColor }]}>
            <Text style={styles.avatarText}>{profile?.full_name?.charAt(0)?.toUpperCase() || "U"}</Text>
          </View>
          <Text style={styles.name}>{profile?.full_name}</Text>
          <Text style={styles.phone}>{profile?.phone_number}</Text>
          <Text style={styles.joined}>
            Joined {new Date(profile?.created_at).toLocaleDateString("en-NG", { month: "long", year: "numeric" })}
          </Text>
          <View style={styles.badgeRow}>
            <View style={[styles.tierBadge, { backgroundColor: tierColor + "20", borderColor: tierColor }]}>
              <MaterialCommunityIcons name="shield-check-outline" size={13} color={tierColor} />
              <Text style={[styles.tierText, { color: tierColor }]}>
                {profile?.score_tier?.replace("_", " ").toUpperCase() || "NEWCOMER"}
              </Text>
            </View>
            <View style={styles.roleBadge}>
              <MaterialCommunityIcons
                name={profile?.role === "trader" ? "store-outline" : profile?.role === "skilled_worker" ? "hammer-wrench" : "lightning-bolt-outline"}
                size={13} color="#1DB954"
              />
              <Text style={styles.roleText}>
                {profile?.role?.replace("_", " ") || "earner"}
              </Text>
            </View>
            <View style={styles.verifiedBadge}>
              <Ionicons name="checkmark-circle" size={13} color="#378ADD" />
              <Text style={styles.verifiedText}>Verified</Text>
            </View>
          </View>
        </View>

        {/* Stats */}
        <View style={styles.statsRow}>
          <TouchableOpacity style={styles.statBox} onPress={() => navigation.navigate("Wallet")}>
            <MaterialCommunityIcons name="wallet-outline" size={20} color="#1DB954" />
            <Text style={styles.statValue}>{profile?.proxi_score || "0.00"}</Text>
            <Text style={styles.statLabel}>Proxi Score</Text>
          </TouchableOpacity>
          <View style={styles.statDivider} />
          <View style={styles.statBox}>
            <MaterialCommunityIcons name="store-outline" size={20} color="#378ADD" />
            <Text style={styles.statValue}>{myListings.length}</Text>
            <Text style={styles.statLabel}>Listings</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statBox}>
            <MaterialCommunityIcons name="clipboard-list-outline" size={20} color="#9B59B6" />
            <Text style={styles.statValue}>{myTasks.length}</Text>
            <Text style={styles.statLabel}>Tasks</Text>
          </View>
        </View>

        {/* Quick actions */}
        <View style={styles.quickActions}>
          <TouchableOpacity style={styles.quickBtn} onPress={() => navigation.navigate("Wallet")}>
            <MaterialCommunityIcons name="wallet-outline" size={22} color="#1DB954" />
            <Text style={styles.quickBtnText}>Wallet</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.quickBtn} onPress={() => navigation.navigate("PostListing")}>
            <MaterialCommunityIcons name="plus-circle-outline" size={22} color="#378ADD" />
            <Text style={styles.quickBtnText}>New Listing</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.quickBtn} onPress={() => navigation.navigate("PostTask")}>
            <MaterialCommunityIcons name="clipboard-list-outline" size={22} color="#9B59B6" />
            <Text style={styles.quickBtnText}>New Task</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.quickBtn} onPress={() => Alert.alert("Share", "Share your profile link with others!")}>
            <MaterialCommunityIcons name="share-outline" size={22} color="#FFD700" />
            <Text style={styles.quickBtnText}>Share</Text>
          </TouchableOpacity>
        </View>

        {/* My content tabs */}
        <View style={styles.tabsContainer}>
          <View style={styles.tabs}>
            <TouchableOpacity style={[styles.tab, activeTab === "listings" && styles.tabActive]} onPress={() => setActiveTab("listings")}>
              <Text style={[styles.tabText, activeTab === "listings" && styles.tabTextActive]}>Listings ({myListings.length})</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.tab, activeTab === "tasks" && styles.tabActive]} onPress={() => setActiveTab("tasks")}>
              <Text style={[styles.tabText, activeTab === "tasks" && styles.tabTextActive]}>Tasks ({myTasks.length})</Text>
            </TouchableOpacity>
          </View>

          {activeTab === "listings" && (
            <View style={styles.contentList}>
              {myListings.length === 0 ? (
                <View style={styles.emptyCard}>
                  <MaterialCommunityIcons name="store-outline" size={32} color="#333" />
                  <Text style={styles.emptyText}>No listings yet</Text>
                  <TouchableOpacity style={styles.emptyAction} onPress={() => navigation.navigate("PostListing")}>
                    <Text style={styles.emptyActionText}>+ Post your first listing</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                myListings.map((item) => (
                  <TouchableOpacity key={item.id} style={styles.itemCard} onPress={() => navigation.navigate("ListingDetail", { listingId: item.id })}>
                    <View style={styles.itemImagePlaceholder}>
                      <MaterialCommunityIcons name="image-outline" size={20} color="#333" />
                    </View>
                    <View style={styles.itemInfo}>
                      <Text style={styles.itemTitle} numberOfLines={1}>{item.title}</Text>
                      <Text style={styles.itemMeta}>{item.category} · {item.area_description}</Text>
                      <Text style={styles.itemPrice}>\u20A6{parseFloat(item.price).toLocaleString()}</Text>
                    </View>
                    <View style={[styles.statusBadge, item.status === "active" ? styles.statusActive : styles.statusInactive]}>
                      <Text style={[styles.statusText, item.status === "active" ? styles.statusActiveText : styles.statusInactiveText]}>{item.status}</Text>
                    </View>
                    <TouchableOpacity style={styles.moreBtn} onPress={() => Alert.alert(item.title, "What would you like to do?", [
                      { text: "View", onPress: () => navigation.navigate("ListingDetail", { listingId: item.id }) },
                      { text: "Mark as sold", onPress: () => Alert.alert("Coming soon") },
                      { text: "Delete", style: "destructive", onPress: () => Alert.alert("Coming soon") },
                      { text: "Cancel", style: "cancel" },
                    ])}>
                      <Ionicons name="ellipsis-vertical" size={16} color="#555" />
                    </TouchableOpacity>
                  </TouchableOpacity>
                ))
              )}
            </View>
          )}

          {activeTab === "tasks" && (
            <View style={styles.contentList}>
              {myTasks.length === 0 ? (
                <View style={styles.emptyCard}>
                  <MaterialCommunityIcons name="clipboard-list-outline" size={32} color="#333" />
                  <Text style={styles.emptyText}>No tasks yet</Text>
                  <TouchableOpacity style={styles.emptyAction} onPress={() => navigation.navigate("PostTask")}>
                    <Text style={styles.emptyActionText}>+ Post your first task</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                myTasks.map((item) => (
                  <TouchableOpacity key={item.id} style={styles.itemCard} onPress={() => navigation.navigate("TaskDetail", { taskId: item.id })}>
                    <View style={[styles.itemImagePlaceholder, { backgroundColor: "#130D1A" }]}>
                      <MaterialCommunityIcons name="briefcase-outline" size={20} color="#9B59B6" />
                    </View>
                    <View style={styles.itemInfo}>
                      <Text style={styles.itemTitle} numberOfLines={1}>{item.title}</Text>
                      <Text style={styles.itemMeta}>{item.task_type} · {item.area_description}</Text>
                      <Text style={styles.itemPrice}>\u20A6{parseFloat(item.budget).toLocaleString()}</Text>
                    </View>
                    <View style={[styles.statusBadge, item.status === "open" ? styles.statusActive : styles.statusInactive]}>
                      <Text style={[styles.statusText, item.status === "open" ? styles.statusActiveText : styles.statusInactiveText]}>{item.status}</Text>
                    </View>
                    <TouchableOpacity style={styles.moreBtn} onPress={() => Alert.alert(item.title, "What would you like to do?", [
                      { text: "View", onPress: () => navigation.navigate("TaskDetail", { taskId: item.id }) },
                      { text: "Close task", onPress: () => Alert.alert("Coming soon") },
                      { text: "Delete", style: "destructive", onPress: () => Alert.alert("Coming soon") },
                      { text: "Cancel", style: "cancel" },
                    ])}>
                      <Ionicons name="ellipsis-vertical" size={16} color="#555" />
                    </TouchableOpacity>
                  </TouchableOpacity>
                ))
              )}
            </View>
          )}
        </View>

        {/* Settings */}
        <View style={styles.settingsSection}>
          <Text style={styles.settingsSectionTitle}>Account Settings</Text>
          {[
            { icon: "wallet-outline", label: "Wallet & Payments", color: "#1DB954", onPress: () => navigation.navigate("Wallet") },
            { icon: "notifications-outline", label: "Notifications", color: "#888", onPress: () => Alert.alert("Coming soon") },
            { icon: "lock-closed-outline", label: "Privacy & Security", color: "#888", onPress: () => Alert.alert("Coming soon") },
            { icon: "gift-outline", label: "Refer a Friend", color: "#FFD700", onPress: () => Alert.alert("Coming soon") },
            { icon: "help-circle-outline", label: "Help & Support", color: "#888", onPress: () => Alert.alert("Support", "Email: support@proxi.ng") },
            { icon: "information-circle-outline", label: "About Proxi", color: "#888", onPress: () => Alert.alert("About", "Proxi v1.0.0\nBuilt for Nigeria") },
          ].map((item) => (
            <TouchableOpacity key={item.label} style={styles.settingsRow} onPress={item.onPress}>
              <View style={[styles.settingsIcon, { backgroundColor: item.color + "20" }]}>
                <Ionicons name={item.icon} size={18} color={item.color} />
              </View>
              <Text style={styles.settingsText}>{item.label}</Text>
              <Ionicons name="chevron-forward" size={16} color="#555" />
            </TouchableOpacity>
          ))}
          <TouchableOpacity style={[styles.settingsRow, styles.logoutRow]} onPress={handleLogout}>
            <View style={[styles.settingsIcon, { backgroundColor: "#FF3B3020" }]}>
              <Ionicons name="log-out-outline" size={18} color="#FF3B30" />
            </View>
            <Text style={[styles.settingsText, { color: "#FF3B30" }]}>Logout</Text>
          </TouchableOpacity>
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0A0A0A" },
  loadingContainer: { flex: 1, backgroundColor: "#0A0A0A", justifyContent: "center", alignItems: "center" },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", padding: 20, paddingTop: 60 },
  headerTitle: { color: "#FFFFFF", fontSize: 24, fontWeight: "700" },
  settingsBtn: { backgroundColor: "#1A1A1A", padding: 8, borderRadius: 10 },
  profileCard: { alignItems: "center", paddingHorizontal: 20, paddingBottom: 24 },
  avatar: { width: 88, height: 88, borderRadius: 44, backgroundColor: "#1DB954", justifyContent: "center", alignItems: "center", borderWidth: 3, marginBottom: 12 },
  avatarText: { color: "#FFFFFF", fontSize: 36, fontWeight: "700" },
  name: { color: "#FFFFFF", fontSize: 22, fontWeight: "700", marginBottom: 4 },
  phone: { color: "#888", fontSize: 14, marginBottom: 4 },
  joined: { color: "#555", fontSize: 12, marginBottom: 12 },
  badgeRow: { flexDirection: "row", gap: 8, flexWrap: "wrap", justifyContent: "center" },
  tierBadge: { flexDirection: "row", alignItems: "center", gap: 4, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20, borderWidth: 1 },
  tierText: { fontSize: 11, fontWeight: "700" },
  roleBadge: { flexDirection: "row", alignItems: "center", gap: 4, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20, backgroundColor: "#0D2818", borderWidth: 1, borderColor: "#1DB954" },
  roleText: { color: "#1DB954", fontSize: 11, fontWeight: "600" },
  verifiedBadge: { flexDirection: "row", alignItems: "center", gap: 4, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20, backgroundColor: "#0D1A2E", borderWidth: 1, borderColor: "#378ADD" },
  verifiedText: { color: "#378ADD", fontSize: 11, fontWeight: "600" },
  statsRow: { flexDirection: "row", backgroundColor: "#1A1A1A", marginHorizontal: 20, borderRadius: 16, padding: 16, marginBottom: 16, borderWidth: 1, borderColor: "#2A2A2A" },
  statBox: { flex: 1, alignItems: "center", gap: 4 },
  statValue: { color: "#FFFFFF", fontSize: 20, fontWeight: "700" },
  statLabel: { color: "#888", fontSize: 11 },
  statDivider: { width: 1, backgroundColor: "#2A2A2A", marginVertical: 4 },
  quickActions: { flexDirection: "row", justifyContent: "space-between", paddingHorizontal: 20, marginBottom: 20 },
  quickBtn: { alignItems: "center", gap: 6, backgroundColor: "#1A1A1A", borderRadius: 14, padding: 14, width: "23%", borderWidth: 1, borderColor: "#2A2A2A" },
  quickBtnText: { color: "#888", fontSize: 10, textAlign: "center" },
  tabsContainer: { paddingHorizontal: 20, marginBottom: 24 },
  tabs: { flexDirection: "row", backgroundColor: "#1A1A1A", borderRadius: 12, padding: 4, marginBottom: 16 },
  tab: { flex: 1, paddingVertical: 10, alignItems: "center", borderRadius: 10 },
  tabActive: { backgroundColor: "#1DB954" },
  tabText: { color: "#888", fontSize: 14, fontWeight: "500" },
  tabTextActive: { color: "#FFFFFF", fontWeight: "600" },
  contentList: { gap: 8 },
  itemCard: { flexDirection: "row", alignItems: "center", gap: 10, backgroundColor: "#1A1A1A", borderRadius: 12, padding: 12, borderWidth: 1, borderColor: "#2A2A2A" },
  itemImagePlaceholder: { width: 48, height: 48, borderRadius: 10, backgroundColor: "#111", justifyContent: "center", alignItems: "center" },
  itemInfo: { flex: 1 },
  itemTitle: { color: "#FFFFFF", fontSize: 14, fontWeight: "600", marginBottom: 2 },
  itemMeta: { color: "#888", fontSize: 11, marginBottom: 2 },
  itemPrice: { color: "#1DB954", fontSize: 13, fontWeight: "700" },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 10, borderWidth: 1 },
  statusActive: { backgroundColor: "#0D2818", borderColor: "#1DB954" },
  statusInactive: { backgroundColor: "#1A0A0A", borderColor: "#555" },
  statusText: { fontSize: 10, fontWeight: "600" },
  statusActiveText: { color: "#1DB954" },
  statusInactiveText: { color: "#555" },
  moreBtn: { padding: 4 },
  emptyCard: { backgroundColor: "#1A1A1A", borderRadius: 12, padding: 24, alignItems: "center", gap: 8, borderWidth: 1, borderColor: "#2A2A2A" },
  emptyText: { color: "#555", fontSize: 15 },
  emptyAction: { marginTop: 4, backgroundColor: "#0D2818", paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, borderWidth: 1, borderColor: "#1DB954" },
  emptyActionText: { color: "#1DB954", fontSize: 13 },
  settingsSection: { paddingHorizontal: 20, marginBottom: 8 },
  settingsSectionTitle: { color: "#888", fontSize: 13, fontWeight: "600", marginBottom: 12, textTransform: "uppercase", letterSpacing: 0.5 },
  settingsRow: { flexDirection: "row", alignItems: "center", gap: 12, backgroundColor: "#1A1A1A", borderRadius: 14, padding: 14, marginBottom: 8, borderWidth: 1, borderColor: "#2A2A2A" },
  settingsIcon: { width: 36, height: 36, borderRadius: 10, justifyContent: "center", alignItems: "center" },
  settingsText: { flex: 1, color: "#CCCCCC", fontSize: 15 },
  logoutRow: { borderColor: "#FF3B3030" },
});


