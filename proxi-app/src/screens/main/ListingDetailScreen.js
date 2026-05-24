import { getCrossSell } from "../../utils/crossSell";
import { useState, useEffect } from "react";
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, ActivityIndicator, Alert } from "react-native";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { useAuth } from "../../context/AuthContext";
import { listingsAPI } from "../../services/api";

const timeAgo = (d) => {
  const s = Math.floor((new Date() - new Date(d)) / 1000);
  if (s < 60) return "Just now";
  if (s < 3600) return `${Math.floor(s/60)}m ago`;
  if (s < 86400) return `${Math.floor(s/3600)}h ago`;
  return `${Math.floor(s/86400)}d ago`;
};

export default function ListingDetailScreen({ route, navigation }) {
  const { listingId } = route.params;
  const { user } = useAuth();
  const [listing, setListing] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => { loadListing(); }, []);

  const loadListing = async () => {
    try {
      const res = await listingsAPI.getOne(listingId);
      setListing(res.data.listing);
    } catch (e) {
      Alert.alert("Error", "Could not load listing");
      navigation.goBack();
    } finally {
      setLoading(false);
    }
  };

  const getConditionColor = (c) => {
    switch(c) {
      case "brand_new": return "#1DB954";
      case "used_good": return "#378ADD";
      case "used_fair": return "#FFD700";
      case "refurbished": return "#888";
      default: return "#888";
    }
  };

  const getConditionLabel = (c) => {
    switch(c) {
      case "brand_new": return "Brand New";
      case "used_good": return "Used � Good";
      case "used_fair": return "Used � Fair";
      case "refurbished": return "Refurbished";
      default: return c;
    }
  };

  if (loading) return (
    <View style={styles.loadingContainer}>
      <ActivityIndicator size="large" color="#1DB954" />
    </View>
  );

  if (!listing) return null;
  const isOwner = listing.seller_id === user?.id;
  const condColor = getConditionColor(listing.condition);

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

        {/* Image area */}
        <View style={styles.imagePlaceholder}>
          <MaterialCommunityIcons name="image-outline" size={48} color="#333" />
          <Text style={styles.imagePlaceholderText}>No photos yet</Text>
        </View>

        {/* Main info */}
        <View style={styles.mainInfo}>
          <View style={styles.badgeRow}>
            <View style={styles.categoryBadge}>
              <Text style={styles.categoryBadgeText}>{listing.category}</Text>
            </View>
            <View style={[styles.conditionBadge, { borderColor: condColor }]}>
              <Text style={[styles.conditionBadgeText, { color: condColor }]}>{getConditionLabel(listing.condition)}</Text>
            </View>
            {listing.delivery_available && (
              <View style={styles.deliveryBadge}>
                <MaterialCommunityIcons name="truck-delivery-outline" size={12} color="#888" />
                <Text style={styles.deliveryBadgeText}>Delivery</Text>
              </View>
            )}
          </View>

          <Text style={styles.title}>{listing.title}</Text>
          <Text style={styles.price}><Text style={{fontFamily: 'System'}}>&#x20A6;</Text>{parseFloat(listing.price).toLocaleString()}</Text>

          <View style={styles.metaRow}>
            <View style={styles.metaItem}>
              <Ionicons name="location-outline" size={14} color="#888" />
              <Text style={styles.metaText}>{listing.area_description || "Location not set"}</Text>
            </View>
            <View style={styles.metaItem}>
              <Ionicons name="time-outline" size={14} color="#888" />
              <Text style={styles.metaText}>{timeAgo(listing.created_at)}</Text>
            </View>
            <View style={styles.metaItem}>
              <Ionicons name="eye-outline" size={14} color="#888" />
              <Text style={styles.metaText}>{listing.view_count || 0} views</Text>
            </View>
          </View>
        </View>

        {/* Description */}
        {listing.description && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Description</Text>
            <View style={styles.descriptionCard}>
              <Text style={styles.description}>{listing.description}</Text>
            </View>
          </View>
        )}

        {/* Details */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Details</Text>
          <View style={styles.detailsCard}>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Category</Text>
              <Text style={styles.detailValue}>{listing.category}</Text>
            </View>
            <View style={styles.detailDivider} />
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Condition</Text>
              <Text style={[styles.detailValue, { color: condColor }]}>{getConditionLabel(listing.condition)}</Text>
            </View>
            <View style={styles.detailDivider} />
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Location</Text>
              <Text style={styles.detailValue}>{listing.area_description || "Not set"}</Text>
            </View>
            <View style={styles.detailDivider} />
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Delivery</Text>
              <Text style={styles.detailValue}>{listing.delivery_available ? "Available" : "Not available"}</Text>
            </View>
          </View>
        </View>

        {/* Seller */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Seller</Text>
          <View style={styles.sellerCard}>
            <View style={styles.sellerAvatar}>
              <Text style={styles.sellerAvatarText}>{listing.seller_name?.charAt(0)?.toUpperCase() || "U"}</Text>
            </View>
            <View style={styles.sellerInfo}>
              <Text style={styles.sellerName}>{listing.seller_name || "Unknown"}</Text>
              <View style={styles.sellerMeta}>
                <MaterialCommunityIcons name="shield-check-outline" size={14} color="#1DB954" />
                <Text style={styles.sellerScore}>Score: {listing.seller_score || "0.00"}</Text>
                <Text style={styles.sellerDot}>�</Text>
                <Text style={styles.sellerTier}>{listing.seller_tier?.replace("_", " ") || "Newcomer"}</Text>
              </View>
              {parseFloat(listing.seller_score) === 0 && (
                <Text style={styles.newUserNote}>New seller � payment protected by escrow</Text>
              )}
            </View>
          </View>
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
            <Text style={styles.escrowTitle}>Safe to buy on Proxi</Text>
            <Text style={styles.escrowDesc}>Your payment is held in escrow and only released after you confirm you received the item.</Text>
          </View>
        </View>

        {/* Cross-sell related services */}
        {getCrossSell(listing.category) && (
          <View style={styles.crossSellSection}>
            <View style={styles.crossSellHeader}>
              <MaterialCommunityIcons name="lightning-bolt-outline" size={18} color="#FFD700" />
              <Text style={styles.crossSellTitle}>{getCrossSell(listing.category).title}</Text>
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <View style={styles.crossSellRow}>
                  {getCrossSell(listing.category).services.map((service) => (
                    <TouchableOpacity
                      key={service.label}
                      style={styles.crossSellCard}
                      onPress={() => navigation.navigate("Explore", { searchQuery: service.searchQuery })}
                  >
                    <View style={[styles.crossSellIcon, { backgroundColor: service.color + "20" }]}>
                      <Ionicons name={service.icon} size={24} color={service.color} />
                    </View>
                    <Text style={styles.crossSellLabel}>{service.label}</Text>
                    <Text style={styles.crossSellFind}>Find nearby</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>
          </View>
)}

        <View style={{ height: 120 }} />
      </ScrollView>

      {/* Bottom actions */}
      {!isOwner && (
        <View style={styles.bottomBar}>
          <TouchableOpacity
            style={styles.messageBtn}
            onPress={() => navigation.navigate("Chat", {
              otherUserId: listing.seller_id,
              otherPersonName: listing.seller_name,
              referenceId: listing.id,
              referenceType: "listing"
            })}
          >
            <Ionicons name="chatbubble-outline" size={20} color="#1DB954" />
            <Text style={styles.messageBtnText}>Message</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.buyBtn}
            onPress={() => Alert.alert(
              "Buy with Escrow",
              `Pay ?${parseFloat(listing.price).toLocaleString()} safely through Proxi Escrow?\n\nYour payment is held until you confirm delivery.`,
              [
                { text: "Cancel", style: "cancel" },
                { text: "Proceed", onPress: () => Alert.alert("Coming soon", "Escrow purchase flow coming in next update") }
              ]
            )}
          >
            <Text style={styles.buyBtnText}>Buy Now</Text>
            <Text style={styles.buyBtnSub}>?{parseFloat(listing.price).toLocaleString()}</Text>
          </TouchableOpacity>
        </View>
      )}

      {isOwner && (
        <View style={styles.bottomBar}>
          <View style={styles.ownerBar}>
            <MaterialCommunityIcons name="check-circle-outline" size={22} color="#1DB954" />
            <Text style={styles.ownerText}>This is your listing</Text>
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0A0A0A" },
  loadingContainer: { flex: 1, backgroundColor: "#0A0A0A", justifyContent: "center", alignItems: "center" },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", padding: 20, paddingTop: 60, position: "absolute", top: 0, left: 0, right: 0, zIndex: 10 },
  backBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "center", alignItems: "center" },
  shareBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "center", alignItems: "center" },
  imagePlaceholder: { width: "100%", height: 260, backgroundColor: "#1A1A1A", justifyContent: "center", alignItems: "center", gap: 8 },
  imagePlaceholderText: { color: "#333", fontSize: 14 },
  mainInfo: { padding: 20 },
  badgeRow: { flexDirection: "row", gap: 8, marginBottom: 12, flexWrap: "wrap" },
  categoryBadge: { backgroundColor: "#0D2818", paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20 },
  categoryBadgeText: { color: "#1DB954", fontSize: 11, fontWeight: "600" },
  conditionBadge: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20, borderWidth: 1 },
  conditionBadgeText: { fontSize: 11, fontWeight: "600" },
  deliveryBadge: { flexDirection: "row", alignItems: "center", gap: 4, backgroundColor: "#1A1A1A", paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20 },
  deliveryBadgeText: { color: "#888", fontSize: 11 },
  title: { fontSize: 24, fontWeight: "700", color: "#FFFFFF", marginBottom: 8, lineHeight: 30 },
  price: { fontSize: 32, fontWeight: "700", color: "#1DB954", marginBottom: 16 },
  metaRow: { flexDirection: "row", flexWrap: "wrap", gap: 12 },
  metaItem: { flexDirection: "row", alignItems: "center", gap: 4 },
  metaText: { color: "#888", fontSize: 12 },
  section: { paddingHorizontal: 20, marginBottom: 20 },
  sectionTitle: { color: "#888", fontSize: 12, fontWeight: "600", textTransform: "uppercase", letterSpacing: 0.8, marginBottom: 10 },
  descriptionCard: { backgroundColor: "#1A1A1A", borderRadius: 14, padding: 16, borderWidth: 1, borderColor: "#2A2A2A" },
  description: { color: "#CCCCCC", fontSize: 15, lineHeight: 24 },
  detailsCard: { backgroundColor: "#1A1A1A", borderRadius: 14, padding: 16, borderWidth: 1, borderColor: "#2A2A2A" },
  detailRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingVertical: 6 },
  detailLabel: { color: "#888", fontSize: 14 },
  detailValue: { color: "#FFFFFF", fontSize: 14, fontWeight: "500" },
  detailDivider: { height: 1, backgroundColor: "#2A2A2A", marginVertical: 2 },
  sellerCard: { flexDirection: "row", alignItems: "center", gap: 12, backgroundColor: "#1A1A1A", borderRadius: 14, padding: 14, borderWidth: 1, borderColor: "#2A2A2A" },
  sellerAvatar: { width: 48, height: 48, borderRadius: 24, backgroundColor: "#1DB954", justifyContent: "center", alignItems: "center" },
  sellerAvatarText: { color: "#FFFFFF", fontSize: 20, fontWeight: "700" },
  sellerInfo: { flex: 1 },
  sellerName: { color: "#FFFFFF", fontSize: 15, fontWeight: "600", marginBottom: 4 },
  sellerMeta: { flexDirection: "row", alignItems: "center", gap: 4 },
  sellerScore: { color: "#888", fontSize: 13 },
  sellerDot: { color: "#555" },
  sellerTier: { color: "#555", fontSize: 13 },
  newUserNote: { color: "#378ADD", fontSize: 11, marginTop: 4 },
  escrowNotice: { flexDirection: "row", alignItems: "flex-start", gap: 12, backgroundColor: "#0D2818", borderRadius: 14, padding: 16, margin: 20, marginTop: 0, borderWidth: 1, borderColor: "#1DB954" },
  escrowText: { flex: 1 },
  escrowTitle: { color: "#1DB954", fontSize: 14, fontWeight: "600", marginBottom: 4 },
  escrowDesc: { color: "#888", fontSize: 12, lineHeight: 18 },
  bottomBar: { position: "absolute", bottom: 0, left: 0, right: 0, padding: 16, backgroundColor: "#0A0A0A", borderTopWidth: 1, borderTopColor: "#1A1A1A", flexDirection: "row", gap: 10 },
  messageBtn: { backgroundColor: "#1A1A1A", borderRadius: 14, paddingVertical: 14, paddingHorizontal: 20, alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: "#1DB954", gap: 4 },
  messageBtnText: { color: "#1DB954", fontSize: 13, fontWeight: "600" },
  buyBtn: { flex: 1, backgroundColor: "#1DB954", borderRadius: 14, paddingVertical: 12, alignItems: "center" },
  buyBtnText: { color: "#FFFFFF", fontSize: 15, fontWeight: "700" },
  buyBtnSub: { color: "rgba(255,255,255,0.7)", fontSize: 11, marginTop: 2 },
  ownerBar: { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8 },
  ownerText: { color: "#1DB954", fontSize: 15, fontWeight: "600" },
  reviewsBtn: { flexDirection: "row", alignItems: "center", gap: 10, backgroundColor: "#1A1400", borderRadius: 12, padding: 14, marginHorizontal: 20, marginBottom: 20, borderWidth: 1, borderColor: "#FFD70040" },
  reviewsBtnText: { flex: 1, color: "#FFD700", fontSize: 14, fontWeight: "500" },
});
