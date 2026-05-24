import { useState, useEffect } from "react";
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, ActivityIndicator, TextInput, Alert } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "../../context/AuthContext";
import api from "../../services/api";

export default function ReviewsScreen({ route, navigation }) {
  const { userId, userName, referenceId, referenceType, canReview } = route.params;
  const { user } = useAuth();
  const [reviews, setReviews] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");

  useEffect(() => { loadReviews(); }, []);

  const loadReviews = async () => {
    try {
      const res = await api.get(`/api/reviews/user/${userId}`);
      setReviews(res.data.reviews || []);
      setStats(res.data.stats);
    } catch (e) { console.log(e); }
    finally { setLoading(false); }
  };

  const handleSubmit = async () => {
    if (rating === 0) { Alert.alert("Error", "Please select a rating"); return; }
    setSubmitting(true);
    try {
      await api.post("/api/reviews", {
        reviewed_id: userId,
        reference_id: referenceId,
        reference_type: referenceType,
        rating,
        comment: comment.trim(),
      });
      Alert.alert("Review submitted!", "Thank you for your feedback.", [
        { text: "OK", onPress: () => { setShowForm(false); loadReviews(); } }
      ]);
    } catch (e) {
      Alert.alert("Error", e.response?.data?.message || "Failed to submit review");
    } finally {
      setSubmitting(false);
    }
  };

  const renderStars = (count, size = 18, interactive = false) => {
    return (
      <View style={styles.starsRow}>
        {[1, 2, 3, 4, 5].map((star) => (
          <TouchableOpacity
            key={star}
            onPress={() => interactive && setRating(star)}
            disabled={!interactive}
          >
            <Ionicons
              name={star <= count ? "star" : "star-outline"}
              size={size}
              color={star <= count ? "#FFD700" : "#555"}
            />
          </TouchableOpacity>
        ))}
      </View>
    );
  };

  const getRatingLabel = (r) => {
    switch(r) {
      case 5: return "Excellent";
      case 4: return "Good";
      case 3: return "Average";
      case 2: return "Poor";
      case 1: return "Terrible";
      default: return "Tap to rate";
    }
  };

  if (loading) return (
    <View style={styles.loadingContainer}>
      <ActivityIndicator size="large" color="#1DB954" />
    </View>
  );

  const avgRating = parseFloat(stats?.avg_rating) || 0;
  const totalReviews = parseInt(stats?.total_reviews) || 0;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={20} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{userName || "User"} Reviews</Text>
        <View style={{ width: 36 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Rating overview */}
        <View style={styles.overviewCard}>
          <View style={styles.overviewLeft}>
            <Text style={styles.avgRating}>{avgRating > 0 ? avgRating.toFixed(1) : "—"}</Text>
            {renderStars(Math.round(avgRating), 20)}
            <Text style={styles.totalReviews}>{totalReviews} review{totalReviews !== 1 ? "s" : ""}</Text>
          </View>
          <View style={styles.overviewRight}>
            {[5, 4, 3, 2, 1].map((star) => {
              const count = parseInt(stats?.[`${["", "one", "two", "three", "four", "five"][star]}_star`]) || 0;
              const pct = totalReviews > 0 ? (count / totalReviews) * 100 : 0;
              return (
                <View key={star} style={styles.barRow}>
                  <Text style={styles.barLabel}>{star}</Text>
                  <Ionicons name="star" size={10} color="#FFD700" />
                  <View style={styles.barTrack}>
                    <View style={[styles.barFill, { width: `${pct}%` }]} />
                  </View>
                  <Text style={styles.barCount}>{count}</Text>
                </View>
              );
            })}
          </View>
        </View>

        {/* Write review button */}
        {canReview && user?.id !== userId && (
          <TouchableOpacity style={styles.writeReviewBtn} onPress={() => setShowForm(!showForm)}>
            <Ionicons name="create-outline" size={20} color="#1DB954" />
            <Text style={styles.writeReviewText}>Write a Review</Text>
          </TouchableOpacity>
        )}

        {/* Review form */}
        {showForm && (
          <View style={styles.reviewForm}>
            <Text style={styles.formTitle}>Your Review</Text>
            <Text style={styles.formSubtitle}>How was your experience with {userName}?</Text>
            <View style={styles.ratingSelector}>
              {renderStars(rating, 36, true)}
              <Text style={styles.ratingLabel}>{getRatingLabel(rating)}</Text>
            </View>
            <TextInput
              style={styles.commentInput}
              placeholder="Share your experience (optional)..."
              placeholderTextColor="#555"
              value={comment}
              onChangeText={setComment}
              multiline
              numberOfLines={4}
            />
            <TouchableOpacity
              style={[styles.submitBtn, (submitting || rating === 0) && { opacity: 0.5 }]}
              onPress={handleSubmit}
              disabled={submitting || rating === 0}
            >
              {submitting
                ? <ActivityIndicator color="#fff" />
                : <Text style={styles.submitBtnText}>Submit Review</Text>
              }
            </TouchableOpacity>
          </View>
        )}

        {/* Reviews list */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>All Reviews</Text>
          {reviews.length === 0 ? (
            <View style={styles.emptyCard}>
              <Ionicons name="star-outline" size={40} color="#333" />
              <Text style={styles.emptyText}>No reviews yet</Text>
              <Text style={styles.emptySubtext}>Be the first to leave a review</Text>
            </View>
          ) : (
            reviews.map((review) => (
              <View key={review.id} style={styles.reviewCard}>
                <View style={styles.reviewHeader}>
                  <View style={styles.reviewerAvatar}>
                    <Text style={styles.reviewerAvatarText}>{review.reviewer_name?.charAt(0)?.toUpperCase() || "U"}</Text>
                  </View>
                  <View style={styles.reviewerInfo}>
                    <Text style={styles.reviewerName}>{review.reviewer_name || "Anonymous"}</Text>
                    <Text style={styles.reviewDate}>{new Date(review.created_at).toLocaleDateString("en-NG", { day: "numeric", month: "short", year: "numeric" })}</Text>
                  </View>
                  {renderStars(review.rating, 14)}
                </View>
                {review.comment && (
                  <Text style={styles.reviewComment}>{review.comment}</Text>
                )}
                {review.reference_type && (
                  <View style={styles.reviewTag}>
                    <Ionicons name={review.reference_type === "listing" ? "pricetag-outline" : "briefcase-outline"} size={11} color="#888" />
                    <Text style={styles.reviewTagText}>{review.reference_type}</Text>
                  </View>
                )}
              </View>
            ))
          )}
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0A0A0A" },
  loadingContainer: { flex: 1, backgroundColor: "#0A0A0A", justifyContent: "center", alignItems: "center" },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", padding: 20, paddingTop: 60 },
  backBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: "#1A1A1A", justifyContent: "center", alignItems: "center" },
  headerTitle: { color: "#FFFFFF", fontSize: 18, fontWeight: "700" },
  overviewCard: { flexDirection: "row", backgroundColor: "#1A1A1A", margin: 20, borderRadius: 16, padding: 20, borderWidth: 1, borderColor: "#2A2A2A", gap: 20 },
  overviewLeft: { alignItems: "center", justifyContent: "center", gap: 6 },
  avgRating: { color: "#FFFFFF", fontSize: 48, fontWeight: "700" },
  starsRow: { flexDirection: "row", gap: 2 },
  totalReviews: { color: "#888", fontSize: 13 },
  overviewRight: { flex: 1, gap: 6 },
  barRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  barLabel: { color: "#888", fontSize: 12, width: 10 },
  barTrack: { flex: 1, height: 6, backgroundColor: "#2A2A2A", borderRadius: 3 },
  barFill: { height: 6, backgroundColor: "#FFD700", borderRadius: 3 },
  barCount: { color: "#888", fontSize: 12, width: 16 },
  writeReviewBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, backgroundColor: "#1A1A1A", borderRadius: 12, padding: 14, marginHorizontal: 20, marginBottom: 16, borderWidth: 1, borderColor: "#1DB954" },
  writeReviewText: { color: "#1DB954", fontSize: 15, fontWeight: "600" },
  reviewForm: { backgroundColor: "#1A1A1A", borderRadius: 16, padding: 20, marginHorizontal: 20, marginBottom: 20, borderWidth: 1, borderColor: "#2A2A2A" },
  formTitle: { color: "#FFFFFF", fontSize: 17, fontWeight: "700", marginBottom: 4 },
  formSubtitle: { color: "#888", fontSize: 13, marginBottom: 16 },
  ratingSelector: { alignItems: "center", gap: 8, marginBottom: 16 },
  ratingLabel: { color: "#FFD700", fontSize: 14, fontWeight: "600" },
  commentInput: { backgroundColor: "#0A0A0A", borderRadius: 12, padding: 14, color: "#FFFFFF", fontSize: 14, borderWidth: 1, borderColor: "#2A2A2A", height: 100, textAlignVertical: "top", marginBottom: 14 },
  submitBtn: { backgroundColor: "#1DB954", borderRadius: 12, paddingVertical: 14, alignItems: "center" },
  submitBtnText: { color: "#FFFFFF", fontSize: 15, fontWeight: "600" },
  section: { paddingHorizontal: 20, marginBottom: 24 },
  sectionTitle: { color: "#FFFFFF", fontSize: 18, fontWeight: "600", marginBottom: 14 },
  emptyCard: { backgroundColor: "#1A1A1A", borderRadius: 14, padding: 32, alignItems: "center", gap: 8, borderWidth: 1, borderColor: "#2A2A2A" },
  emptyText: { color: "#555", fontSize: 16, fontWeight: "500" },
  emptySubtext: { color: "#444", fontSize: 13 },
  reviewCard: { backgroundColor: "#1A1A1A", borderRadius: 14, padding: 16, marginBottom: 10, borderWidth: 1, borderColor: "#2A2A2A" },
  reviewHeader: { flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 10 },
  reviewerAvatar: { width: 40, height: 40, borderRadius: 20, backgroundColor: "#1DB954", justifyContent: "center", alignItems: "center" },
  reviewerAvatarText: { color: "#FFFFFF", fontSize: 16, fontWeight: "700" },
  reviewerInfo: { flex: 1 },
  reviewerName: { color: "#FFFFFF", fontSize: 14, fontWeight: "600" },
  reviewDate: { color: "#555", fontSize: 12 },
  reviewComment: { color: "#CCCCCC", fontSize: 14, lineHeight: 20, marginBottom: 8 },
  reviewTag: { flexDirection: "row", alignItems: "center", gap: 4 },
  reviewTagText: { color: "#555", fontSize: 11 },
});
