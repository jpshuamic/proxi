import { useState, useRef } from "react";
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator, Animated } from "react-native";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { detectListingCategory, getFormRoute } from "../../services/aiDetect";

const MANUAL_OPTIONS = [
  { key: "vehicle", label: "Vehicle", desc: "Car, motorcycle, truck", icon: "car-outline", color: "#378ADD", screen: "PostVehicle" },
  { key: "listing", label: "General Listing", desc: "Electronics, fashion, furniture", icon: "store-outline", color: "#1DB954", screen: "PostListing" },
  { key: "task", label: "Task / Gig", desc: "Hire someone for a job", icon: "clipboard-list-outline", color: "#9B59B6", screen: "PostTask" },
];

export default function PostScreen({ navigation }) {
  const [input, setInput] = useState("");
  const [detecting, setDetecting] = useState(false);
  const [detected, setDetected] = useState(null);
  const [showManual, setShowManual] = useState(false);
  const detectTimer = useRef(null);

  const navigate = (screen, params = {}) => {
    navigation.getParent()?.navigate(screen, params);
  };

  const handleInputChange = (text) => {
    setInput(text);
    setDetected(null);
    setShowManual(false);
    if (detectTimer.current) clearTimeout(detectTimer.current);
    if (text.trim().length < 3) return;
    detectTimer.current = setTimeout(() => runDetection(text), 1000);
  };

  const runDetection = async (text) => {
    setDetecting(true);
    try {
      console.log("Running detection for:", text);
      const result = await detectListingCategory(text);
      console.log("Detection result:", result);
      if (result && result.suggested_form) {
        setDetected(result);
      } else {
        setShowManual(true);
      }
    } catch (e) {
      console.log("Detection error:", e);
      setShowManual(true);
    } finally {
      setDetecting(false);
    }
  };

  const handleDetectedRoute = () => {
    if (!detected) return;
    const route = getFormRoute(detected.suggested_form);
    if (route) navigate(route);
    else setShowManual(true);
  };

  const getCategoryIcon = (form) => {
    switch(form) {
      case "vehicle": return { icon: "car-outline", color: "#378ADD", label: "Vehicle" };
      case "electronics": return { icon: "phone-portrait-outline", color: "#FFD700", label: "Electronics" };
      case "fashion": return { icon: "shirt-outline", color: "#FF6B9D", label: "Fashion" };
      case "home": return { icon: "home-outline", color: "#1DB954", label: "Home & Furniture" };
      case "task_delivery": return { icon: "truck-delivery-outline", color: "#FF6B35", label: "Delivery Task" };
      case "task_skilled": return { icon: "hammer-wrench", color: "#9B59B6", label: "Skilled Work Task" };
      case "task_errand": return { icon: "run-fast", color: "#1DB954", label: "Errand Task" };
      default: return { icon: "apps-outline", color: "#888", label: "General Listing" };
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>What do you want to post?</Text>
        <Text style={styles.subtitle}>Type below and we will detect the category for you</Text>
      </View>

      {/* AI Input */}
      <View style={styles.inputSection}>
        <View style={styles.inputWrapper}>
          <Ionicons name="search-outline" size={20} color="#888" style={styles.inputIcon} />
          <TextInput
            style={styles.input}
            placeholder="e.g. Toyota Camry 2018, iPhone 14, Fix my generator..."
            placeholderTextColor="#555"
            value={input}
            onChangeText={handleInputChange}
            autoFocus
            returnKeyType="go"
            onSubmitEditing={() => input.trim().length >= 3 && runDetection(input)}
          />
          {input.length > 0 && (
            <TouchableOpacity onPress={() => { setInput(""); setDetected(null); setShowManual(false); }}>
              <Ionicons name="close-circle" size={20} color="#555" />
            </TouchableOpacity>
          )}
        </View>

        {/* Detecting indicator */}
        {detecting && (
          <View style={styles.detectingRow}>
            <ActivityIndicator size="small" color="#1DB954" />
            <Text style={styles.detectingText}>Detecting category...</Text>
          </View>
        )}

        {/* AI detected result */}
        {detected && !detecting && (
          <View style={styles.detectedCard}>
            <View style={styles.detectedLeft}>
              {(() => {
                const cat = getCategoryIcon(detected.suggested_form);
                return (
                  <>
                    <View style={[styles.detectedIcon, { backgroundColor: cat.color + "20" }]}>
                      <MaterialCommunityIcons name={cat.icon} size={24} color={cat.color} />
                    </View>
                    <View>
                      <Text style={styles.detectedLabel}>{cat.label}</Text>
                      <Text style={styles.detectedSub}>{detected.subcategory || detected.category}</Text>
                    </View>
                  </>
                );
              })()}
            </View>
            <TouchableOpacity style={styles.detectedBtn} onPress={handleDetectedRoute}>
              <Text style={styles.detectedBtnText}>Post this</Text>
              <Ionicons name="arrow-forward" size={16} color="#fff" />
            </TouchableOpacity>
          </View>
        )}

        {detected && !detecting && (
          <TouchableOpacity style={styles.wrongCategory} onPress={() => { setDetected(null); setShowManual(true); }}>
            <Text style={styles.wrongCategoryText}>Wrong category? Choose manually</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Manual category picker */}
      {(showManual || input.length === 0) && !detected && (
        <View style={styles.manualSection}>
          <Text style={styles.manualTitle}>{input.length === 0 ? "Or choose a category" : "Choose manually"}</Text>
          {MANUAL_OPTIONS.map((opt) => (
            <TouchableOpacity key={opt.key} style={styles.manualCard} onPress={() => navigate(opt.screen)}>
              <View style={[styles.manualIcon, { backgroundColor: opt.color + "20" }]}>
                <MaterialCommunityIcons name={opt.icon} size={28} color={opt.color} />
              </View>
              <View style={styles.manualInfo}>
                <Text style={styles.manualLabel}>{opt.label}</Text>
                <Text style={styles.manualDesc}>{opt.desc}</Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color="#555" />
            </TouchableOpacity>
          ))}

          <View style={styles.escrowNotice}>
            <MaterialCommunityIcons name="shield-check-outline" size={16} color="#1DB954" />
            <Text style={styles.escrowText}>All transactions protected by Proxi Escrow</Text>
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0A0A0A" },
  header: { paddingHorizontal: 20, paddingTop: 60, paddingBottom: 20 },
  title: { color: "#FFFFFF", fontSize: 26, fontWeight: "700", marginBottom: 4 },
  subtitle: { color: "#888", fontSize: 14 },
  inputSection: { paddingHorizontal: 20, marginBottom: 24 },
  inputWrapper: { flexDirection: "row", alignItems: "center", backgroundColor: "#1A1A1A", borderRadius: 14, paddingHorizontal: 14, paddingVertical: 14, borderWidth: 1, borderColor: "#2A2A2A", gap: 10 },
  inputIcon: {},
  input: { flex: 1, color: "#FFFFFF", fontSize: 15 },
  detectingRow: { flexDirection: "row", alignItems: "center", gap: 8, marginTop: 12 },
  detectingText: { color: "#888", fontSize: 13 },
  detectedCard: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", backgroundColor: "#0D2818", borderRadius: 14, padding: 14, marginTop: 12, borderWidth: 1, borderColor: "#1DB954" },
  detectedLeft: { flexDirection: "row", alignItems: "center", gap: 12 },
  detectedIcon: { width: 44, height: 44, borderRadius: 12, justifyContent: "center", alignItems: "center" },
  detectedLabel: { color: "#FFFFFF", fontSize: 15, fontWeight: "600" },
  detectedSub: { color: "#888", fontSize: 12, marginTop: 2 },
  detectedBtn: { flexDirection: "row", alignItems: "center", gap: 6, backgroundColor: "#1DB954", paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20 },
  detectedBtnText: { color: "#FFFFFF", fontSize: 13, fontWeight: "600" },
  wrongCategory: { marginTop: 8, alignItems: "center" },
  wrongCategoryText: { color: "#555", fontSize: 13 },
  manualSection: { paddingHorizontal: 20 },
  manualTitle: { color: "#888", fontSize: 13, fontWeight: "600", marginBottom: 12, textTransform: "uppercase", letterSpacing: 0.5 },
  manualCard: { flexDirection: "row", alignItems: "center", gap: 14, backgroundColor: "#1A1A1A", borderRadius: 14, padding: 16, marginBottom: 10, borderWidth: 1, borderColor: "#2A2A2A" },
  manualIcon: { width: 52, height: 52, borderRadius: 14, justifyContent: "center", alignItems: "center" },
  manualInfo: { flex: 1 },
  manualLabel: { color: "#FFFFFF", fontSize: 16, fontWeight: "600", marginBottom: 2 },
  manualDesc: { color: "#888", fontSize: 13 },
  escrowNotice: { flexDirection: "row", alignItems: "center", gap: 8, backgroundColor: "#0D2818", borderRadius: 12, padding: 12, marginTop: 12, borderWidth: 1, borderColor: "#1DB95440" },
  escrowText: { color: "#1DB954", fontSize: 12 },
});
