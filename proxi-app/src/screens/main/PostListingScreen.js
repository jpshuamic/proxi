import { useState, useRef } from "react";
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator, Alert, KeyboardAvoidingView, Platform, ScrollView, Image } from "react-native";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import * as Location from "expo-location";
import { listingsAPI } from "../../services/api";
import { formatCurrency, parseCurrency, NAIRA } from "../../utils/format";

const CATEGORIES = [
  { key: "vehicles", label: "Vehicles", icon: "car-outline" },
  { key: "electronics", label: "Electronics", icon: "phone-portrait-outline" },
  { key: "fashion", label: "Fashion", icon: "shirt-outline" },
  { key: "home_furniture", label: "Home", icon: "home-outline" },
  { key: "repair_services", label: "Repairs", icon: "construct-outline" },
  { key: "other", label: "Other", icon: "apps-outline" },
];

const CONDITIONS = [
  { key: "brand_new", label: "Brand New" },
  { key: "used_like_new", label: "Used - Like New" },
  { key: "used_good", label: "Used - Good" },
  { key: "used_fair", label: "Used - Fair" },
  { key: "refurbished", label: "Refurbished" },
];

const TITLE_SUGGESTIONS = {
  iphone: "electronics", samsung: "electronics", tecno: "electronics",
  infinix: "electronics", laptop: "electronics", phone: "electronics",
  tv: "electronics", television: "electronics", generator: "home_furniture",
  fridge: "home_furniture", sofa: "home_furniture", bed: "home_furniture",
  car: "vehicles", toyota: "vehicles", honda: "vehicles", mercedes: "vehicles",
  shirt: "fashion", shoes: "fashion", bag: "fashion", dress: "fashion",
};

export default function PostListingScreen({ navigation }) {
  const [form, setForm] = useState({
    title: "", description: "", category: "", price: "",
    condition: "used_good", area_description: "",
    delivery_available: false, delivery_fee: "", negotiate: false,
  });
  const [images, setImages] = useState([]);
  const [coverIndex, setCoverIndex] = useState(0);
  const [loading, setLoading] = useState(false);
  const [locationLoading, setLocationLoading] = useState(false);
  const [suggestedCategory, setSuggestedCategory] = useState(null);

  const getLocation = async () => {
    setLocationLoading(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") { Alert.alert("Permission denied", "Please allow location access"); return; }
      const loc = await Location.getCurrentPositionAsync({});
      const geo = await Location.reverseGeocodeAsync({ latitude: loc.coords.latitude, longitude: loc.coords.longitude });
      if (geo.length > 0) {
        const g = geo[0];
        const area = [g.district || g.subregion, g.city, g.region].filter(Boolean).join(", ");
        setForm(f => ({ ...f, area_description: area }));
      }
    } catch (e) { Alert.alert("Error", "Could not get location"); }
    finally { setLocationLoading(false); }
  };

  const handleTitleChange = (value) => {
    setForm({ ...form, title: value });
    const lower = value.toLowerCase();
    for (const [keyword, category] of Object.entries(TITLE_SUGGESTIONS)) {
      if (lower.includes(keyword)) {
        setSuggestedCategory(category);
        return;
      }
    }
    setSuggestedCategory(null);
  };

  const pickImages = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") { Alert.alert("Permission needed", "Please allow photo access"); return; }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsMultipleSelection: true,
      selectionLimit: 8 - images.length,
      quality: 0.7,
    });
    if (!result.canceled) setImages(prev => [...prev, ...result.assets.map(a => a.uri)].slice(0, 8));
  };

  const takePhoto = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== "granted") { Alert.alert("Permission needed"); return; }
    const result = await ImagePicker.launchCameraAsync({ quality: 0.7 });
    if (!result.canceled) setImages(prev => [...prev, result.assets[0].uri].slice(0, 8));
  };

  const handleSubmit = async () => {
    if (!form.title.trim()) { Alert.alert("Error", "Please enter a title"); return; }
    if (!form.category) { Alert.alert("Error", "Please select a category"); return; }
    if (!form.price) { Alert.alert("Error", "Please enter a price"); return; }
    if (!form.area_description.trim()) { Alert.alert("Error", "Please enter your location"); return; }
    setLoading(true);
    try {
      await listingsAPI.create({
        ...form,
        price: parseCurrency(form.price),
        delivery_fee: form.delivery_fee ? parseCurrency(form.delivery_fee) : 0,
      });
      Alert.alert(
        "Listed Successfully!",
        "Your listing is now live. Buyers near you can see it.",
        [
          { text: "View feed", onPress: () => navigation.goBack() },
          { text: "See related services", onPress: () => navigation.navigate("Explore") }
        ]
      );
    } catch (e) {
      Alert.alert("Error", e.response?.data?.message || "Failed to post listing");
    } finally { setLoading(false); }
  };

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === "ios" ? "padding" : "height"}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={20} color="#FFFFFF" />
          </TouchableOpacity>
          <View>
            <Text style={styles.title}>Post a Listing</Text>
            <Text style={styles.subtitle}>Sell something to your community</Text>
          </View>
        </View>

        {/* Photos */}
        <View style={styles.section}>
          <Text style={styles.label}>Photos ({images.length}/8)</Text>
          <Text style={styles.hint}>Tap a photo to set it as cover photo</Text>
          {images.length > 0 && (
            <View style={styles.photoGrid}>
              {images.map((uri, index) => (
                <TouchableOpacity key={index} style={styles.photoItem} onPress={() => setCoverIndex(index)}>
                  <Image source={{ uri }} style={styles.photoThumb} />
                  {coverIndex === index && (
                    <View style={styles.coverBadge}><Text style={styles.coverBadgeText}>Cover</Text></View>
                  )}
                  <TouchableOpacity style={styles.removePhoto} onPress={() => setImages(images.filter((_, i) => i !== index))}>
                    <Ionicons name="close-circle" size={22} color="#FF3B30" />
                  </TouchableOpacity>
                </TouchableOpacity>
              ))}
            </View>
          )}
          {images.length < 8 && (
            <View style={styles.addPhotoRow}>
              <TouchableOpacity style={styles.addPhotoBtn} onPress={takePhoto}>
                <Ionicons name="camera-outline" size={24} color="#1DB954" />
                <Text style={styles.addPhotoBtnText}>Camera</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.addPhotoBtn} onPress={pickImages}>
                <Ionicons name="images-outline" size={24} color="#1DB954" />
                <Text style={styles.addPhotoBtnText}>Gallery</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* Title with autocomplete */}
        <View style={styles.section}>
          <Text style={styles.label}>What are you selling? *</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g. Samsung Galaxy A15, Honda Civic 2018"
            placeholderTextColor="#555"
            value={form.title}
            onChangeText={handleTitleChange}
          />
          {suggestedCategory && !form.category && (
            <TouchableOpacity
              style={styles.suggestion}
              onPress={() => { setForm({ ...form, category: suggestedCategory }); setSuggestedCategory(null); }}
            >
              <Ionicons name="bulb-outline" size={14} color="#FFD700" />
              <Text style={styles.suggestionText}>
                Suggested category: <Text style={styles.suggestionBold}>{CATEGORIES.find(c => c.key === suggestedCategory)?.label}</Text>
              </Text>
              <Text style={styles.suggestionApply}>Apply</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Category */}
        <View style={styles.section}>
          <Text style={styles.label}>Category *</Text>
          <View style={styles.categoryGrid}>
            {CATEGORIES.map((cat) => (
              <TouchableOpacity
                key={cat.key}
                style={[styles.categoryBtn, form.category === cat.key && styles.active]}
                onPress={() => setForm({ ...form, category: cat.key })}
              >
                <Ionicons name={cat.icon} size={20} color={form.category === cat.key ? "#1DB954" : "#555"} />
                <Text style={[styles.categoryText, form.category === cat.key && styles.activeText]}>{cat.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Price */}
        <View style={styles.section}>
          <Text style={styles.label}>Price (NGN) *</Text>
          <View style={styles.priceRow}>
            <Text style={styles.nairaSign}>{NAIRA}</Text>
            <TextInput
              style={styles.priceInput}
              placeholder="0"
              placeholderTextColor="#555"
              value={form.price}
              onChangeText={(v) => setForm({ ...form, price: formatCurrency(v) })}
              keyboardType="numeric"
            />
          </View>
          <TouchableOpacity style={styles.toggleRow} onPress={() => setForm({ ...form, negotiate: !form.negotiate })}>
            <View style={styles.toggleLeft}>
              <MaterialCommunityIcons name="handshake-outline" size={18} color="#888" />
              <View>
                <Text style={styles.toggleLabel}>Price is negotiable</Text>
                <Text style={styles.toggleSub}>Buyers can suggest a different price. You can accept or decline.</Text>
              </View>
            </View>
            <View style={[styles.toggle, form.negotiate && styles.toggleActive]}>
              <View style={[styles.toggleDot, form.negotiate && styles.toggleDotActive]} />
            </View>
          </TouchableOpacity>
        </View>

        {/* Condition */}
        <View style={styles.section}>
          <Text style={styles.label}>Condition *</Text>
          <View style={styles.conditionRow}>
            {CONDITIONS.map((c) => (
              <TouchableOpacity
                key={c.key}
                style={[styles.conditionBtn, form.condition === c.key && styles.active]}
                onPress={() => setForm({ ...form, condition: c.key })}
              >
                <Text style={[styles.conditionText, form.condition === c.key && styles.activeText]}>{c.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Description with prompts */}
        <View style={styles.section}>
          <Text style={styles.label}>Description</Text>
          <Text style={styles.hint}>Include: condition details � reason for selling � accessories included</Text>
          <TextInput
            style={[styles.input, { height: 110, textAlignVertical: "top" }]}
            placeholder={"e.g.\n- Still in excellent condition\n- Selling because I upgraded\n- Includes original charger and box"}
            placeholderTextColor="#555"
            value={form.description}
            onChangeText={(v) => setForm({ ...form, description: v })}
            multiline
          />
        </View>

        {/* Location with GPS */}
        <View style={styles.section}>
          <Text style={styles.label}>Your Location *</Text>
          <View style={styles.locationRow}>
            <TextInput
              style={[styles.input, { flex: 1 }]}
              placeholder="e.g. Wuse 2 Abuja, Lekki Lagos"
              placeholderTextColor="#555"
              value={form.area_description}
              onChangeText={(v) => setForm({ ...form, area_description: v })}
            />
            <TouchableOpacity style={styles.gpsBtn} onPress={getLocation} disabled={locationLoading}>
              {locationLoading
                ? <ActivityIndicator size="small" color="#1DB954" />
                : <Ionicons name="location-outline" size={20} color="#1DB954" />
              }
            </TouchableOpacity>
          </View>
          <Text style={styles.hint}>Tap pin to auto-fill your current location</Text>
        </View>

        {/* Delivery */}
        <View style={styles.section}>
          <TouchableOpacity style={styles.toggleRow} onPress={() => setForm({ ...form, delivery_available: !form.delivery_available })}>
            <View style={styles.toggleLeft}>
              <MaterialCommunityIcons name="truck-delivery-outline" size={18} color="#888" />
              <View>
                <Text style={styles.toggleLabel}>Delivery available</Text>
                <Text style={styles.toggleSub}>Can this item be delivered to the buyer?</Text>
              </View>
            </View>
            <View style={[styles.toggle, form.delivery_available && styles.toggleActive]}>
              <View style={[styles.toggleDot, form.delivery_available && styles.toggleDotActive]} />
            </View>
          </TouchableOpacity>
          {form.delivery_available && (
            <View>
              <Text style={styles.label}>Delivery Fee (NGN)</Text>
              <View style={styles.priceRow}>
                <Text style={styles.nairaSign}>{NAIRA}</Text>
                <TextInput
                  style={styles.priceInput}
                  placeholder="0 (free delivery)"
                  placeholderTextColor="#555"
                  value={form.delivery_fee}
                  onChangeText={(v) => setForm({ ...form, delivery_fee: formatCurrency(v) })}
                  keyboardType="numeric"
                />
              </View>
            </View>
          )}
        </View>

        {/* Escrow notice */}
        <View style={styles.notice}>
          <MaterialCommunityIcons name="shield-check-outline" size={18} color="#1DB954" />
          <Text style={styles.noticeText}>Payments protected by Proxi Escrow. You get paid after delivery confirmed.</Text>
        </View>

        <TouchableOpacity style={[styles.submitBtn, loading && { opacity: 0.5 }]} onPress={handleSubmit} disabled={loading}>
          {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.submitText}>Post Listing</Text>}
        </TouchableOpacity>

        <View style={{ height: 40 }} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0A0A0A" },
  header: { flexDirection: "row", alignItems: "center", gap: 14, padding: 20, paddingTop: 60 },
  backBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: "#1A1A1A", justifyContent: "center", alignItems: "center" },
  title: { color: "#FFFFFF", fontSize: 22, fontWeight: "700" },
  subtitle: { color: "#888", fontSize: 13, marginTop: 2 },
  section: { paddingHorizontal: 20, marginBottom: 20 },
  label: { color: "#AAAAAA", fontSize: 13, fontWeight: "600", marginBottom: 8 },
  hint: { color: "#555", fontSize: 12, marginBottom: 8 },
  input: { backgroundColor: "#1A1A1A", borderRadius: 12, paddingHorizontal: 16, paddingVertical: 14, fontSize: 15, color: "#FFFFFF", borderWidth: 1, borderColor: "#2A2A2A" },
  suggestion: { flexDirection: "row", alignItems: "center", gap: 8, backgroundColor: "#1A1400", borderRadius: 10, padding: 10, marginTop: 8, borderWidth: 1, borderColor: "#FFD70040" },
  suggestionText: { flex: 1, color: "#888", fontSize: 13 },
  suggestionBold: { color: "#FFD700", fontWeight: "600" },
  suggestionApply: { color: "#FFD700", fontSize: 13, fontWeight: "600" },
  photoGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 12 },
  photoItem: { position: "relative", width: "31%" },
  photoThumb: { width: "100%", aspectRatio: 1, borderRadius: 10 },
  coverBadge: { position: "absolute", bottom: 6, left: 6, backgroundColor: "#1DB954", paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6 },
  coverBadgeText: { color: "#fff", fontSize: 10, fontWeight: "700" },
  removePhoto: { position: "absolute", top: -8, right: -8 },
  addPhotoRow: { flexDirection: "row", gap: 10 },
  addPhotoBtn: { flex: 1, height: 90, backgroundColor: "#1A1A1A", borderRadius: 12, justifyContent: "center", alignItems: "center", borderWidth: 1, borderColor: "#2A2A2A", borderStyle: "dashed", gap: 6 },
  addPhotoBtnText: { color: "#1DB954", fontSize: 12 },
  categoryGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  categoryBtn: { backgroundColor: "#1A1A1A", borderRadius: 10, padding: 10, alignItems: "center", width: "30%", borderWidth: 1, borderColor: "#2A2A2A", gap: 4 },
  categoryText: { color: "#555", fontSize: 10, textAlign: "center" },
  priceRow: { flexDirection: "row", alignItems: "center", backgroundColor: "#1A1A1A", borderRadius: 12, borderWidth: 1, borderColor: "#2A2A2A", paddingHorizontal: 16, marginBottom: 10 },
  nairaSign: { color: "#1DB954", fontSize: 22, fontWeight: "700", marginRight: 8 },
  priceInput: { flex: 1, paddingVertical: 14, fontSize: 20, color: "#FFFFFF", fontWeight: "600" },
  conditionRow: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  conditionBtn: { backgroundColor: "#1A1A1A", borderRadius: 20, paddingHorizontal: 14, paddingVertical: 8, borderWidth: 1, borderColor: "#2A2A2A" },
  conditionText: { color: "#555", fontSize: 13 },
  active: { borderColor: "#1DB954", backgroundColor: "#0D2818" },
  activeText: { color: "#1DB954" },
  locationRow: { flexDirection: "row", gap: 8, alignItems: "center" },
  gpsBtn: { width: 48, height: 48, backgroundColor: "#1A1A1A", borderRadius: 12, justifyContent: "center", alignItems: "center", borderWidth: 1, borderColor: "#1DB954" },
  toggleRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", backgroundColor: "#1A1A1A", borderRadius: 12, padding: 14, marginBottom: 10, borderWidth: 1, borderColor: "#2A2A2A" },
  toggleLeft: { flexDirection: "row", alignItems: "center", gap: 10, flex: 1 },
  toggleLabel: { color: "#FFFFFF", fontSize: 14, fontWeight: "500" },
  toggleSub: { color: "#555", fontSize: 12, marginTop: 2, flexShrink: 1 },
  toggle: { width: 44, height: 24, borderRadius: 12, backgroundColor: "#333", justifyContent: "center", paddingHorizontal: 2 },
  toggleActive: { backgroundColor: "#1DB954" },
  toggleDot: { width: 20, height: 20, borderRadius: 10, backgroundColor: "#fff" },
  toggleDotActive: { alignSelf: "flex-end" },
  notice: { flexDirection: "row", alignItems: "flex-start", gap: 10, backgroundColor: "#0D2818", borderRadius: 12, padding: 14, marginHorizontal: 20, marginBottom: 20, borderWidth: 1, borderColor: "#1DB954" },
  noticeText: { color: "#888", fontSize: 13, flex: 1, lineHeight: 18 },
  submitBtn: { backgroundColor: "#1DB954", paddingVertical: 16, borderRadius: 12, alignItems: "center", marginHorizontal: 20 },
  submitText: { color: "#FFFFFF", fontSize: 16, fontWeight: "600" },
});
