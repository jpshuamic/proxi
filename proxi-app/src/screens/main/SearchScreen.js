import { useState, useEffect, useRef } from "react";
import { View, Text, TextInput, TouchableOpacity, StyleSheet, FlatList, ActivityIndicator, ScrollView, RefreshControl } from "react-native";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { listingsAPI, tasksAPI } from "../../services/api";
import { NAIRA } from "../../utils/format";

const CATEGORIES = [
  { key: "all", label: "All", icon: "apps-outline" },

  { key: "vehicles", label: "Vehicles", icon: "car-outline" },
  { key: "electronics", label: "Electronics", icon: "phone-portrait-outline" },
  { key: "fashion", label: "Fashion", icon: "shirt-outline" },
  { key: "home_furniture", label: "Home", icon: "home-outline" },
  { key: "real_estate", label: "Real Estate", icon: "business-outline" },
  { key: "health_beauty", label: "Beauty", icon: "heart-outline" },
  { key: "sporting_goods", label: "Sports", icon: "football-outline" },
  { key: "food", label: "Food", icon: "fast-food-outline" },
  { key: "tasks", label: "Tasks", icon: "briefcase-outline" },
  { key: "business", label: "Business", icon: "storefront-outline" },
  { key: "industrial", label: "Industrial", icon: "settings-outline" },
  { key: "travel", label: "Travel", icon: "airplane-outline" },
  { key: "marketplace_deals", label: "Deals", icon: "pricetag-outline" },
  { key: "community", label: "Community", icon: "people-outline" },
  { key: "others", label: "Others", icon: "ellipsis-horizontal-outline" },
];

const SUBCATEGORIES = {
  vehicles: [
    "Cars",
    "Motorcycles",
    "Trucks",
    "Buses",
    "Spare Parts",
    "Keke",
    "Boats",
    "Heavy Equipment",
    "Vehicle Services",
    "Vehicle Rentals",
    "Vehicle Accessories",
    "Vehicle Insurance",
    "Vehicle Financing",
    "Other Vehicles",
  ],
  electronics: [
    "Phones",
    "Laptops",
    "TVs",
    "Audio",
    "Cameras",
    "Accessories",
    "Tablets",
    "Wearables",
    "Gaming",
    "Drones",
    "Smart Home",
    "Office Electronics",
    "Car Electronics",
    "Software",
    "Other Electronics",
  ],
  fashion: [
    "Men",
    "Women",
    "Shoes",
    "Bags",
    "Watches",
    "Jewelry",
    "Kids",
    "Accessories",
    "Traditional Wear",
    "Athletic Wear",
    "Other Fashion",
  ],
  home_furniture: [
    "Furniture",
    "Appliances",
    "Decor",
    "Kitchen",
    "Tools",
    "Garden",
    "Bedding",
    "Bath",
    "Lighting",
    "Storage",
    "Other Home & Furniture",
  ],
  real_estate: [
    "Rent",
    "For Sale",
    "Land",
    "Commercial",
    "Shortlet",
    "Vacation Rentals",
    "Real Estate Services",
    "Other Real Estate",
  ],
  health_beauty: [
    "Skincare",
    "Makeup",
    "Hair",
    "Supplements",
    "Medical",
    "Fitness",
    "Personal Care",
    "Fragrances",
    "Health Services",
    "Beauty Services",
    "Other Health & Beauty",
  ],
  sporting_goods: [
    "Fitness",
    "Football",
    "Basketball",
    "Outdoor",
    "Cycling",
    "Water Sports",
    "Racquet Sports",
    "Winter Sports",
    "Team Sports",
    "Other Sporting Goods",
  ],
  food: [
    "Groceries",
    "Beverages",
    "Snacks",
    "Frozen",
    "Local",
    "Organic",
    "Bakery",
    "Meat & Seafood",
    "Fruits & Vegetables",
    "Dairy",
    "Other Food",
  ],
  tasks: [
    "Delivery",
    "Skilled Work",
    "Cleaning",
    "Errands",
    "Labour",
    "Moving",
    "Event Help",
    "Tutoring",
    "Tech Support",
    "Creative Services",
    "Other Tasks",
  ],
  business: [
    "Wholesale",
    "Businesses",
    "Office Supplies",
    "Services",
    "Freelance Gigs",
    "Other Business",
  ],
  industrial: [
    "Industrial",
    "Energy",
    "Construction",
    "Manufacturing",
    "Agriculture",
    "Other Industrial",
  ],
  travel: [
    "Travel",
    "Hotels",
    "Tours",
    "Transportation",
    "Other Travel",
  ],
  marketplace_deals: [
    "Deals",
    "Import",
    "Artisans",
    "Local Food",
    "Agriculture",
    "Handmade",
    "Fashion Designers",
    "Tech Services",
    "Event Services",
    "Home Services",
    "Tutoring",
    "Health Services",
    "Beauty Services",
    "Automotive Services",
    "Personal Services",
    "Business Services",
  ],
  community: [
    "Religious",
    "Charity",
    "Volunteering",
    "Local Groups",
    "Community Events",
  ],
  others: ["Others", "Services", "Free Items", "Wanted"],
};

const timeAgo = (d) => {
  const s = Math.floor((new Date() - new Date(d)) / 1000);
  if (s < 60) return "Just now";
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  return `${Math.floor(s / 86400)}d ago`;
};

export default function SearchScreen({ navigation }) {
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState("all");
  const [activeSubcategory, setActiveSubcategory] = useState("");
  const [listings, setListings] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const searchTimer = useRef(null);

  useEffect(() => {
    loadAll();

    return () => {
      if (searchTimer.current) clearTimeout(searchTimer.current);
    };
  }, [activeCategory, activeSubcategory]);

  const loadAll = async () => {
    try {
      const params = {};
      if (activeCategory !== "all" && activeCategory !== "tasks") params.category = activeCategory;
      if (activeSubcategory) params.subcategory = activeSubcategory;
      if (search.trim()) params.search = search.trim();

      if (activeCategory === "tasks") {
        const res = await tasksAPI.getAll(params);
        setTasks(res.data.tasks || []);
        setListings([]);
      } else if (activeCategory === "all") {
        const [listRes, taskRes] = await Promise.all([listingsAPI.getAll(params), tasksAPI.getAll(params)]);
        setListings(listRes.data.listings || []);
        setTasks(taskRes.data.tasks || []);
      } else {
        const res = await listingsAPI.getAll(params);
        setListings(res.data.listings || []);
        setTasks([]);
      }
    } catch (e) {
      console.log(e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleSearch = (text) => {
    setSearch(text);
    if (searchTimer.current) clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(() => loadAll(), 600);
  };

  const handleCategoryPress = (key) => {
    setActiveCategory(key);
    setActiveSubcategory("");
    setSearch("");
  };

  const urgentTasks = tasks.filter((t) => t.is_urgent);
  const regularListings = listings;
  const regularTasks = tasks.filter((t) => !t.is_urgent);

  const renderListing = ({ item }) => (
    <TouchableOpacity style={styles.card} onPress={() => navigation.navigate("ListingDetail", { listingId: item.id })}>
      <View style={styles.cardImage}>
        <MaterialCommunityIcons name="image-outline" size={28} color="#333" />
      </View>
      <View style={styles.cardInfo}>
        <Text style={styles.cardTitle} numberOfLines={1}>
          {item.title}
        </Text>
        <Text style={styles.cardPrice}>
          {NAIRA}
          {parseFloat(item.price).toLocaleString()}
        </Text>
        <View style={styles.cardMeta}>
          <Ionicons name="location-outline" size={11} color="#555" />
          <Text style={styles.cardMetaText} numberOfLines={1}>
            {item.area_description || "Lagos"}
          </Text>
          <Text style={styles.cardTime}>{timeAgo(item.created_at)}</Text>
        </View>
        {item.condition && (
          <View style={styles.conditionBadge}>
            <Text style={styles.conditionText}>{item.condition.replace(/_/g, " ")}</Text>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );

  const renderTask = ({ item }) => (
    <TouchableOpacity style={[styles.card, item.is_urgent && styles.cardUrgent]} onPress={() => navigation.navigate("TaskDetail", { taskId: item.id })}>
      <View style={[styles.cardImage, { backgroundColor: "#130D1A" }]}>
        <MaterialCommunityIcons name="briefcase-outline" size={28} color="#9B59B6" />
      </View>
      <View style={styles.cardInfo}>
        <View style={styles.cardTitleRow}>
          {item.is_urgent && (
            <View style={styles.urgentBadge}>
              <Ionicons name="flash" size={10} color="#FF6B35" />
              <Text style={styles.urgentText}>URGENT</Text>
            </View>
          )}
          <Text style={styles.cardTitle} numberOfLines={1}>
            {item.title}
          </Text>
        </View>
        <Text style={styles.cardPrice}>
          {NAIRA}
          {parseFloat(item.budget).toLocaleString()}
        </Text>
        <View style={styles.cardMeta}>
          <Ionicons name="location-outline" size={11} color="#555" />
          <Text style={styles.cardMetaText} numberOfLines={1}>
            {item.area_description || "Lagos"}
          </Text>
          <Text style={styles.cardTime}>{timeAgo(item.created_at)}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Explore</Text>
      </View>

      <View style={styles.searchBar}>
        <Ionicons name="search-outline" size={20} color="#888" />
        <TextInput
          style={styles.searchInput}
          placeholder="Search phones, cars, plumber..."
          placeholderTextColor="#555"
          value={search}
          onChangeText={handleSearch}
          returnKeyType="search"
        />
        {search.length > 0 && (
          <TouchableOpacity onPress={() => { setSearch(""); loadAll(); }}>
            <Ionicons name="close-circle" size={18} color="#555" />
          </TouchableOpacity>
        )}
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoryScroll} contentContainerStyle={styles.categoryContent}>
        {CATEGORIES.map((cat) => (
          <TouchableOpacity
            key={cat.key}
            style={[styles.categoryChip, activeCategory === cat.key && styles.categoryChipActive]}
            onPress={() => handleCategoryPress(cat.key)}
          >
            <Ionicons name={cat.icon} size={14} color={activeCategory === cat.key ? "#fff" : "#888"} />
            <Text style={[styles.categoryChipText, activeCategory === cat.key && styles.categoryChipTextActive]}>{cat.label}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {SUBCATEGORIES[activeCategory] && (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.subCategoryScroll} contentContainerStyle={styles.categoryContent}>
          {SUBCATEGORIES[activeCategory].map((sub) => (
            <TouchableOpacity
              key={sub}
              style={[styles.subChip, activeSubcategory === sub && styles.subChipActive]}
              onPress={() => setActiveSubcategory(activeSubcategory === sub ? "" : sub)}
            >
              <Text style={[styles.subChipText, activeSubcategory === sub && styles.subChipTextActive]}>{sub}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#1DB954" />
        </View>
      ) : (
        <ScrollView
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); loadAll(); }} tintColor="#1DB954" />}
        >
          {urgentTasks.length > 0 && activeCategory !== "tasks" && (
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Ionicons name="flash" size={16} color="#FF6B35" />
                <Text style={styles.sectionTitle}>Urgent Near You</Text>
                <Text style={styles.sectionCount}>{urgentTasks.length}</Text>
              </View>
              {urgentTasks.map((task) => (
                <TouchableOpacity key={task.id} style={[styles.card, styles.cardUrgent]} onPress={() => navigation.navigate("TaskDetail", { taskId: task.id })}>
                  <View style={[styles.cardImage, { backgroundColor: "#1A0A00" }]}>
                    <MaterialCommunityIcons name="briefcase-outline" size={28} color="#FF6B35" />
                  </View>
                  <View style={styles.cardInfo}>
                    <View style={styles.urgentBadge}>
                      <Ionicons name="flash" size={10} color="#FF6B35" />
                      <Text style={styles.urgentText}>URGENT</Text>
                    </View>
                    <Text style={styles.cardTitle} numberOfLines={1}>{task.title}</Text>
                    <Text style={styles.cardPrice}>
                      {NAIRA}
                      {parseFloat(task.budget).toLocaleString()}
                    </Text>
                    <View style={styles.cardMeta}>
                      <Ionicons name="location-outline" size={11} color="#555" />
                      <Text style={styles.cardMetaText} numberOfLines={1}>{task.area_description || "Lagos"}</Text>
                      <Text style={styles.cardTime}>{timeAgo(task.created_at)}</Text>
                    </View>
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          )}

          {regularListings.length > 0 && (
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>
                  {activeCategory === "all" ? "Listings" : CATEGORIES.find((c) => c.key === activeCategory)?.label}
                </Text>
                <Text style={styles.sectionCount}>{regularListings.length}</Text>
              </View>
              <FlatList
                data={regularListings}
                renderItem={renderListing}
                keyExtractor={(item) => item.id}
                scrollEnabled={false}
              />
            </View>
          )}

          {regularTasks.length > 0 && (
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Tasks & Gigs</Text>
                <Text style={styles.sectionCount}>{regularTasks.length}</Text>
              </View>
              <FlatList
                data={regularTasks}
                renderItem={renderTask}
                keyExtractor={(item) => item.id}
                scrollEnabled={false}
              />
            </View>
          )}

          {regularListings.length === 0 && regularTasks.length === 0 && urgentTasks.length === 0 && (
            <View style={styles.emptyContainer}>
              <Ionicons name="search-outline" size={48} color="#333" />
              <Text style={styles.emptyTitle}>Nothing found</Text>
              <Text style={styles.emptySubtext}>
                {search ? `No results for "${search}"` : "Be the first to post in this category"}
              </Text>
              <TouchableOpacity style={styles.emptyBtn} onPress={() => navigation.getParent()?.navigate("Post")}>
                <Text style={styles.emptyBtnText}>Post something</Text>
              </TouchableOpacity>
            </View>
          )}

          <View style={{ height: 100 }} />
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0A0A0A" },
  header: { paddingHorizontal: 20, paddingTop: 60, paddingBottom: 12 },
  headerTitle: { color: "#FFFFFF", fontSize: 28, fontWeight: "700" },
  searchBar: { flexDirection: "row", alignItems: "center", backgroundColor: "#1A1A1A", borderRadius: 14, paddingHorizontal: 14, paddingVertical: 12, marginHorizontal: 20, marginBottom: 12, borderWidth: 1, borderColor: "#2A2A2A", gap: 10 },
  searchInput: { flex: 1, color: "#FFFFFF", fontSize: 15 },
  categoryScroll: { maxHeight: 44 },
  categoryContent: { paddingHorizontal: 20, gap: 8, paddingBottom: 4 },
  categoryChip: { flexDirection: "row", alignItems: "center", gap: 6, backgroundColor: "#1A1A1A", borderRadius: 20, paddingHorizontal: 14, paddingVertical: 8, borderWidth: 1, borderColor: "#2A2A2A" },
  categoryChipActive: { backgroundColor: "#1DB954", borderColor: "#1DB954" },
  categoryChipText: { color: "#888", fontSize: 13, fontWeight: "500" },
  categoryChipTextActive: { color: "#FFFFFF", fontWeight: "600" },
  subCategoryScroll: { maxHeight: 40, marginTop: 8 },
  subChip: { backgroundColor: "#1A1A1A", borderRadius: 16, paddingHorizontal: 12, paddingVertical: 6, borderWidth: 1, borderColor: "#2A2A2A", marginRight: 8 },
  subChipActive: { backgroundColor: "#0D2818", borderColor: "#1DB954" },
  subChipText: { color: "#555", fontSize: 12 },
  subChipTextActive: { color: "#1DB954", fontWeight: "600" },
  loadingContainer: { flex: 1, justifyContent: "center", alignItems: "center", marginTop: 60 },
  section: { paddingHorizontal: 20, marginTop: 20 },
  sectionHeader: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 12 },
  sectionTitle: { color: "#FFFFFF", fontSize: 16, fontWeight: "600", flex: 1 },
  sectionCount: { color: "#555", fontSize: 13 },
  card: { flexDirection: "row", gap: 12, backgroundColor: "#1A1A1A", borderRadius: 14, padding: 12, marginBottom: 10, borderWidth: 1, borderColor: "#2A2A2A" },
  cardUrgent: { borderColor: "#FF6B3540" },
  cardImage: { width: 80, height: 80, borderRadius: 10, backgroundColor: "#2A2A2A", justifyContent: "center", alignItems: "center" },
  cardInfo: { flex: 1, justifyContent: "center" },
  cardTitleRow: { flexDirection: "row", alignItems: "center", gap: 6, flexWrap: "wrap" },
  cardTitle: { color: "#FFFFFF", fontSize: 14, fontWeight: "600", flex: 1 },
  cardPrice: { color: "#1DB954", fontSize: 15, fontWeight: "700", marginTop: 4 },
  cardMeta: { flexDirection: "row", alignItems: "center", gap: 4, marginTop: 4 },
  cardMetaText: { color: "#555", fontSize: 11, flex: 1 },
  cardTime: { color: "#444", fontSize: 11 },
  conditionBadge: { backgroundColor: "#1A1A1A", borderRadius: 6, paddingHorizontal: 6, paddingVertical: 2, marginTop: 4, alignSelf: "flex-start", borderWidth: 1, borderColor: "#2A2A2A" },
  conditionText: { color: "#888", fontSize: 10, textTransform: "capitalize" },
  urgentBadge: { flexDirection: "row", alignItems: "center", gap: 3, backgroundColor: "#1A0A00", borderRadius: 6, paddingHorizontal: 6, paddingVertical: 2, marginBottom: 4, alignSelf: "flex-start" },
  urgentText: { color: "#FF6B35", fontSize: 9, fontWeight: "700" },
  emptyContainer: { alignItems: "center", paddingTop: 60, paddingHorizontal: 40, gap: 12 },
  emptyTitle: { color: "#FFFFFF", fontSize: 20, fontWeight: "700" },
  emptySubtext: { color: "#888", fontSize: 14, textAlign: "center" },
  emptyBtn: { backgroundColor: "#1DB954", paddingHorizontal: 24, paddingVertical: 12, borderRadius: 20, marginTop: 8 },
  emptyBtnText: { color: "#FFFFFF", fontSize: 14, fontWeight: "600" },
});
