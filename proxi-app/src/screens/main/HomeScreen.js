import { useState, useEffect } from "react";
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, ActivityIndicator, RefreshControl, TextInput, FlatList } from "react-native";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { useAuth } from "../../context/AuthContext";
import { listingsAPI, tasksAPI, walletAPI } from "../../services/api";

const timeAgo = (d) => {
  const s = Math.floor((new Date() - new Date(d)) / 1000);
  if (s < 60) return "Just now";
  if (s < 3600) return `${Math.floor(s/60)}m ago`;
  if (s < 86400) return `${Math.floor(s/3600)}h ago`;
  return `${Math.floor(s/86400)}d ago`;
};

const getGreeting = () => {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
};

const getRoleMessage = (role) => {
  switch(role) {
    case "trader": return "What are you selling today?";
    case "skilled_worker": return "Find your next job";
    case "earner": return "Ready to earn today?";
    default: return "Explore your community";
  }
};

const CATEGORIES = [
  { key: "all", label: "All", icon: "apps-outline", color: "#1DB954" },
  { key: "vehicles", label: "Vehicles", icon: "car-outline", color: "#378ADD" },
  { key: "electronics", label: "Electronics", icon: "phone-portrait-outline", color: "#FFD700" },
  { key: "fashion", label: "Fashion", icon: "shirt-outline", color: "#FF6B9D" },
  { key: "home_furniture", label: "Home", icon: "home-outline", color: "#1DB954" },
  { key: "repair_services", label: "Repairs", icon: "construct-outline", color: "#FF6B35" },
  { key: "tasks_gigs", label: "Gigs", icon: "briefcase-outline", color: "#9B59B6" },
];

export default function HomeScreen({ navigation }) {
  const { user } = useAuth();
  const [listings, setListings] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [wallet, setWallet] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeCategory, setActiveCategory] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    try {
      const [l, t, w] = await Promise.all([
        listingsAPI.getAll(),
        tasksAPI.getAll(),
        walletAPI.getWallet(),
      ]);
      setListings(l.data.listings || []);
      setTasks(t.data.tasks || []);
      setWallet(w.data.wallet);
    } catch (e) { console.log(e); }
    finally { setLoading(false); setRefreshing(false); }
  };

  const filteredListings = listings.filter(l => {
    const matchCat = activeCategory === "all" || l.category === activeCategory;
    const matchSearch = !searchQuery || l.title?.toLowerCase().includes(searchQuery.toLowerCase()) || l.area_description?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchCat && matchSearch;
  });

  const filteredTasks = tasks.filter(t => {
    const matchSearch = !searchQuery || t.title?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchSearch;
  });

  if (loading) return (
    <View style={styles.loadingContainer}>
      <ActivityIndicator size="large" color="#1DB954" />
    </View>
  );

  return (
    <View style={styles.container}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); loadData(); }} tintColor="#1DB954" />}
        stickyHeaderIndices={[0]}
      >
        {/* Sticky header */}
        <View style={styles.stickyHeader}>
          <View style={styles.topRow}>
            <View>
              <Text style={styles.greeting}>{getGreeting()}</Text>
              <Text style={styles.name}>{user?.full_name?.split(" ")[0] || "there"}</Text>
            </View>
            <View style={styles.headerRight}>
              <TouchableOpacity style={styles.headerBtn} onPress={() => navigation.navigate("Wallet")}>
                <MaterialCommunityIcons name="wallet-outline" size={20} color="#888" />
                <Text style={styles.walletQuick}>₦{wallet ? parseFloat(wallet.balance).toLocaleString() : "0"}</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => navigation.navigate("Profile")}>
                <View style={styles.miniAvatar}>
                  <Text style={styles.miniAvatarText}>{user?.full_name?.charAt(0)?.toUpperCase() || "U"}</Text>
                </View>
              </TouchableOpacity>
            </View>
          </View>

          {/* Search bar */}
          <TouchableOpacity
            style={styles.searchBar}
            onPress={() => navigation.navigate("Explore")}
          >
            <Ionicons name="search-outline" size={18} color="#555" />
            <Text style={styles.searchPlaceholder}>Search listings, tasks, locations...</Text>
            <Ionicons name="options-outline" size={18} color="#555" />
          </TouchableOpacity>
        </View>

        {/* Stats row */}
        <View style={styles.statsRow}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>₦{wallet ? parseFloat(wallet.balance).toLocaleString("en-NG", { minimumFractionDigits: 2 }) : "0.00"}</Text>
            <Text style={styles.statLabel}>Wallet Balance</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{user?.proxi_score || "0.00"}</Text>
            <Text style={styles.statLabel}>Proxi Score</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{listings.length}</Text>
            <Text style={styles.statLabel}>Listings</Text>
          </View>
        </View>

        {/* Role banner */}
        <TouchableOpacity
          style={styles.roleBanner}
          onPress={() => user?.role === "trader" ? navigation.navigate("PostListing") : null}
        >
          <View style={styles.roleBannerLeft}>
            <MaterialCommunityIcons
              name={user?.role === "trader" ? "store-outline" : user?.role === "skilled_worker" ? "hammer-wrench" : "lightning-bolt-outline"}
              size={24}
              color="#1DB954"
            />
            <View>
              <Text style={styles.roleBannerTitle}>{getRoleMessage(user?.role)}</Text>
              <Text style={styles.roleBannerSub}>
                {user?.role === "trader" ? "Tap to post a listing" : "Browse open gigs below"}
              </Text>
            </View>
          </View>
          <Ionicons name="chevron-forward" size={20} color="#1DB954" />
        </TouchableOpacity>

        {/* Category scroll */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoryScroll} contentContainerStyle={styles.categoryContent}>
          {CATEGORIES.map((cat) => (
            <TouchableOpacity
              key={cat.key}
              style={[styles.categoryChip, activeCategory === cat.key && { backgroundColor: cat.color, borderColor: cat.color }]}
              onPress={() => setActiveCategory(cat.key)}
            >
              <Ionicons name={cat.icon} size={16} color={activeCategory === cat.key ? "#FFFFFF" : cat.color} />
              <Text style={[styles.categoryChipText, activeCategory === cat.key && { color: "#FFFFFF" }]}>{cat.label}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Listings section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionTitleRow}>
              <MaterialCommunityIcons name="store-outline" size={16} color="#1DB954" />
              <Text style={styles.sectionTitle}>For Sale ({filteredListings.length})</Text>
            </View>
            <TouchableOpacity onPress={() => navigation.navigate("Explore")}>
              <Text style={styles.seeAll}>See all</Text>
            </TouchableOpacity>
          </View>

          {filteredListings.length === 0 ? (
            <View style={styles.emptyCard}>
              <MaterialCommunityIcons name="store-outline" size={32} color="#333" />
              <Text style={styles.emptyText}>No listings found</Text>
              <TouchableOpacity style={styles.emptyAction} onPress={() => navigation.navigate("PostListing")}>
                <Text style={styles.emptyActionText}>+ Post a listing</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {filteredListings.slice(0, 8).map((item) => (
                <TouchableOpacity
                  key={item.id}
                  style={styles.listingCard}
                  onPress={() => navigation.navigate("ListingDetail", { listingId: item.id })}
                >
                  <View style={styles.listingImagePlaceholder}>
                    <MaterialCommunityIcons name="image-outline" size={28} color="#333" />
                  </View>
                  <View style={styles.listingCardInfo}>
                    <View style={styles.listingBadge}>
                      <Text style={styles.listingBadgeText}>{item.category}</Text>
                    </View>
                    <Text style={styles.listingCardTitle} numberOfLines={2}>{item.title}</Text>
                    <Text style={styles.listingCardPrice}>₦{parseFloat(item.price).toLocaleString()}</Text>
                    <Text style={styles.listingCardLocation} numberOfLines={1}>
                      {item.area_description || "Location not set"}
                    </Text>
                    <Text style={styles.listingCardTime}>{timeAgo(item.created_at)}</Text>
                  </View>
                </TouchableOpacity>
              ))}
            </ScrollView>
          )}
        </View>

        {/* Tasks section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionTitleRow}>
              <MaterialCommunityIcons name="clipboard-list-outline" size={16} color="#9B59B6" />
              <Text style={styles.sectionTitle}>Open Gigs ({filteredTasks.length})</Text>
            </View>
            <TouchableOpacity onPress={() => navigation.navigate("Explore")}>
              <Text style={styles.seeAll}>See all</Text>
            </TouchableOpacity>
          </View>

          {filteredTasks.length === 0 ? (
            <View style={styles.emptyCard}>
              <MaterialCommunityIcons name="clipboard-list-outline" size={32} color="#333" />
              <Text style={styles.emptyText}>No gigs yet</Text>
              <TouchableOpacity style={styles.emptyAction} onPress={() => navigation.navigate("PostTask")}>
                <Text style={styles.emptyActionText}>+ Post a task</Text>
              </TouchableOpacity>
            </View>
          ) : (
            filteredTasks.slice(0, 5).map((item) => (
              <TouchableOpacity
                key={item.id}
                style={styles.taskRow}
                onPress={() => navigation.navigate("TaskDetail", { taskId: item.id })}
              >
                <View style={[styles.taskTypeIcon, { backgroundColor: "#1A0D2E" }]}>
                  <MaterialCommunityIcons name="briefcase-outline" size={20} color="#9B59B6" />
                </View>
                <View style={styles.taskRowInfo}>
                  <Text style={styles.taskRowTitle} numberOfLines={1}>{item.title}</Text>
                  <Text style={styles.taskRowMeta}>{item.task_type} ï {item.area_description || "Location not set"}</Text>
                </View>
                <View style={styles.taskRowRight}>
                  <Text style={styles.taskRowBudget}>₦{parseFloat(item.budget).toLocaleString()}</Text>
                  <Text style={styles.taskRowTime}>{timeAgo(item.created_at)}</Text>
                </View>
              </TouchableOpacity>
            ))
          )}
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0A0A0A" },
  loadingContainer: { flex: 1, backgroundColor: "#0A0A0A", justifyContent: "center", alignItems: "center" },
  stickyHeader: { backgroundColor: "#0A0A0A", paddingHorizontal: 20, paddingTop: 60, paddingBottom: 12 },
  topRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 12 },
  greeting: { color: "#888", fontSize: 12 },
  name: { color: "#FFFFFF", fontSize: 22, fontWeight: "700" },
  headerRight: { flexDirection: "row", alignItems: "center", gap: 10 },
  headerBtn: { flexDirection: "row", alignItems: "center", gap: 6, backgroundColor: "#1A1A1A", paddingHorizontal: 10, paddingVertical: 6, borderRadius: 20, borderWidth: 1, borderColor: "#2A2A2A" },
  walletQuick: { color: "#1DB954", fontSize: 13, fontWeight: "600" },
  miniAvatar: { width: 36, height: 36, borderRadius: 18, backgroundColor: "#1DB954", justifyContent: "center", alignItems: "center" },
  miniAvatarText: { color: "#FFFFFF", fontSize: 15, fontWeight: "700" },
  searchBar: { flexDirection: "row", alignItems: "center", gap: 10, backgroundColor: "#1A1A1A", borderRadius: 14, paddingHorizontal: 16, paddingVertical: 12, borderWidth: 1, borderColor: "#2A2A2A" },
  searchPlaceholder: { flex: 1, color: "#555", fontSize: 14 },
  statsRow: { flexDirection: "row", alignItems: "center", backgroundColor: "#1A1A1A", marginHorizontal: 20, borderRadius: 14, padding: 16, marginBottom: 16, borderWidth: 1, borderColor: "#2A2A2A" },
  statItem: { flex: 1, alignItems: "center" },
  statValue: { color: "#FFFFFF", fontSize: 16, fontWeight: "700", marginBottom: 2 },
  statLabel: { color: "#888", fontSize: 10 },
  statDivider: { width: 1, height: 30, backgroundColor: "#2A2A2A" },
  roleBanner: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", backgroundColor: "#0D2818", borderRadius: 14, padding: 16, marginHorizontal: 20, marginBottom: 16, borderWidth: 1, borderColor: "#1DB954" },
  roleBannerLeft: { flexDirection: "row", alignItems: "center", gap: 12 },
  roleBannerTitle: { color: "#FFFFFF", fontSize: 15, fontWeight: "600" },
  roleBannerSub: { color: "#888", fontSize: 12, marginTop: 2 },
  categoryScroll: { marginBottom: 16 },
  categoryContent: { paddingHorizontal: 20, gap: 8 },
  categoryChip: { flexDirection: "row", alignItems: "center", gap: 6, backgroundColor: "#1A1A1A", borderRadius: 20, paddingHorizontal: 14, paddingVertical: 8, borderWidth: 1, borderColor: "#2A2A2A" },
  categoryChipText: { color: "#888", fontSize: 13, fontWeight: "500" },
  section: { paddingHorizontal: 20, marginBottom: 24 },
  sectionHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 12 },
  sectionTitleRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  sectionTitle: { color: "#FFFFFF", fontSize: 17, fontWeight: "600" },
  seeAll: { color: "#1DB954", fontSize: 13 },
  emptyCard: { backgroundColor: "#1A1A1A", borderRadius: 12, padding: 24, alignItems: "center", gap: 6, borderWidth: 1, borderColor: "#2A2A2A" },
  emptyText: { color: "#555", fontSize: 15, fontWeight: "500" },
  emptyAction: { marginTop: 8, backgroundColor: "#0D2818", paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, borderWidth: 1, borderColor: "#1DB954" },
  emptyActionText: { color: "#1DB954", fontSize: 13, fontWeight: "500" },
  listingCard: { width: 160, backgroundColor: "#1A1A1A", borderRadius: 14, marginRight: 12, borderWidth: 1, borderColor: "#2A2A2A", overflow: "hidden" },
  listingImagePlaceholder: { width: "100%", height: 110, backgroundColor: "#111", justifyContent: "center", alignItems: "center" },
  listingCardInfo: { padding: 10 },
  listingBadge: { backgroundColor: "#0D2818", paddingHorizontal: 6, paddingVertical: 2, borderRadius: 10, alignSelf: "flex-start", marginBottom: 4 },
  listingBadgeText: { color: "#1DB954", fontSize: 9, fontWeight: "600" },
  listingCardTitle: { color: "#FFFFFF", fontSize: 13, fontWeight: "600", marginBottom: 4, lineHeight: 18 },
  listingCardPrice: { color: "#1DB954", fontSize: 13, fontWeight: "700", marginBottom: 4, flexWrap: "wrap" },
  listingCardLocation: { color: "#888", fontSize: 11, marginBottom: 2 },
  listingCardTime: { color: "#555", fontSize: 10 },
  taskRow: { flexDirection: "row", alignItems: "center", gap: 12, backgroundColor: "#1A1A1A", borderRadius: 12, padding: 14, marginBottom: 8, borderWidth: 1, borderColor: "#2A2A2A" },
  taskTypeIcon: { width: 44, height: 44, borderRadius: 12, justifyContent: "center", alignItems: "center" },
  taskRowInfo: { flex: 1 },
  taskRowTitle: { color: "#FFFFFF", fontSize: 14, fontWeight: "600", marginBottom: 4 },
  taskRowMeta: { color: "#888", fontSize: 12 },
  taskRowRight: { alignItems: "flex-end" },
  taskRowBudget: { color: "#1DB954", fontSize: 14, fontWeight: "700" },
  taskRowTime: { color: "#555", fontSize: 11, marginTop: 2 },
});

