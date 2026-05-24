import { useState } from "react";
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator, Alert, KeyboardAvoidingView, Platform, ScrollView } from "react-native";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import * as Location from "expo-location";
import { tasksAPI } from "../../services/api";
import { formatCurrency, parseCurrency, NAIRA } from "../../utils/format";

const TASK_TYPES = [
  { key: "delivery", label: "Delivery", icon: "truck-delivery-outline", desc: "Move or deliver something" },
  { key: "errand", label: "Errand", icon: "run-fast", desc: "Quick task or pickup" },
  { key: "labour", label: "Labour", icon: "arm-flex-outline", desc: "Physical work needed" },
  { key: "skilled", label: "Skilled Work", icon: "hammer-wrench", desc: "Trade or technical skill" },
  { key: "cleaning", label: "Cleaning", icon: "broom", desc: "Home or office cleaning" },
  { key: "promotion", label: "Promotion", icon: "bullhorn-outline", desc: "Marketing or social media" },
];

const SKILLS = ["Plumber", "Electrician", "Cleaner", "Driver", "Tutor", "Mechanic", "Painter", "Carpenter", "Welder", "Tailor", "Chef", "Security"];

const TEMPLATES = [
  "Deliver food from restaurant to my address",
  "Fix leaking tap in my bathroom",
  "Clean 3-bedroom flat",
  "Drive me from Lagos Island to Ikeja",
  "Help me move furniture to new apartment",
  "Buy items from market and deliver",
];

const AUTO_TYPE = {
  "deliver": "delivery", "pickup": "delivery", "transport": "delivery",
  "fix": "skilled", "repair": "skilled", "install": "skilled",
  "clean": "cleaning", "wash": "cleaning",
  "buy": "errand", "get": "errand", "collect": "errand",
};

export default function PostTaskScreen({ navigation }) {
  const [form, setForm] = useState({
    title: "", description: "", task_type: "", budget: "",
    area_description: "", workers_needed: "1", required_skill: "",
    deadline: "", urgent: false,
  });
  const [loading, setLoading] = useState(false);
  const [locationLoading, setLocationLoading] = useState(false);
  const [showSkills, setShowSkills] = useState(false);

  const getLocation = async () => {
    setLocationLoading(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") { Alert.alert("Permission denied"); return; }
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
    const lower = value.toLowerCase();
    let suggestedType = "";
    for (const [keyword, type] of Object.entries(AUTO_TYPE)) {
      if (lower.includes(keyword)) { suggestedType = type; break; }
    }
    setForm({ ...form, title: value, task_type: suggestedType || form.task_type });
  };

  const handleSubmit = async () => {
    if (!form.title.trim()) { Alert.alert("Error", "Please enter a task title"); return; }
    if (!form.task_type) { Alert.alert("Error", "Please select a task type"); return; }
    if (!form.budget) { Alert.alert("Error", "Please enter a budget"); return; }
    if (!form.area_description.trim()) { Alert.alert("Error", "Please enter a location"); return; }
    setLoading(true);
    try {
      await tasksAPI.create({
        ...form,
        budget: parseCurrency(form.budget),
        workers_needed: parseInt(form.workers_needed) || 1,
      });
      Alert.alert("Task Posted!", "Earners near you can now apply.", [
        { text: "Back to feed", onPress: () => navigation.goBack() }
      ]);
    } catch (e) {
      Alert.alert("Error", e.response?.data?.message || "Failed to post task");
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
            <Text style={styles.title}>Post a Task</Text>
            <Text style={styles.subtitle}>Hire someone from your community</Text>
          </View>
        </View>

        {/* Urgent toggle */}
        <View style={styles.section}>
          <TouchableOpacity style={[styles.urgentBtn, form.urgent && styles.urgentBtnActive]} onPress={() => setForm({ ...form, urgent: !form.urgent })}>
            <Ionicons name="flash" size={18} color={form.urgent ? "#FF6B35" : "#555"} />
            <Text style={[styles.urgentText, form.urgent && styles.urgentTextActive]}>
              {form.urgent ? "URGENT � Earners will see this first" : "Mark as Urgent"}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Title with templates */}
        <View style={styles.section}>
          <Text style={styles.label}>What do you need done? *</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g. Deliver package to Lekki, Fix my generator"
            placeholderTextColor="#555"
            value={form.title}
            onChangeText={handleTitleChange}
          />
          <Text style={styles.hint}>Quick templates:</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View style={styles.templatesRow}>
              {TEMPLATES.map((t) => (
                <TouchableOpacity key={t} style={styles.templateChip} onPress={() => handleTitleChange(t)}>
                  <Text style={styles.templateChipText} numberOfLines={1}>{t}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>
        </View>

        {/* Task type */}
        <View style={styles.section}>
          <Text style={styles.label}>Task Type * {form.task_type ? <Text style={styles.autoLabel}>(auto-detected)</Text> : null}</Text>
          {TASK_TYPES.map((t) => (
            <TouchableOpacity
              key={t.key}
              style={[styles.typeCard, form.task_type === t.key && styles.typeCardActive]}
              onPress={() => setForm({ ...form, task_type: t.key })}
            >
              <View style={styles.typeRow}>
                <MaterialCommunityIcons name={t.icon} size={22} color={form.task_type === t.key ? "#1DB954" : "#555"} />
                <View style={styles.typeText}>
                  <Text style={[styles.typeLabel, form.task_type === t.key && styles.typeLabelActive]}>{t.label}</Text>
                  <Text style={styles.typeDesc}>{t.desc}</Text>
                </View>
                {form.task_type === t.key && <Ionicons name="checkmark-circle" size={20} color="#1DB954" />}
              </View>
            </TouchableOpacity>
          ))}
        </View>

        {/* Required skill */}
        <View style={styles.section}>
          <Text style={styles.label}>Required Skill</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g. Plumber, Electrician, Driver"
            placeholderTextColor="#555"
            value={form.required_skill}
            onChangeText={(v) => setForm({ ...form, required_skill: v })}
          />
          <TouchableOpacity style={styles.showSkillsBtn} onPress={() => setShowSkills(!showSkills)}>
            <Text style={styles.showSkillsBtnText}>{showSkills ? "Hide" : "Browse"} common skills</Text>
            <Ionicons name={showSkills ? "chevron-up" : "chevron-down"} size={14} color="#1DB954" />
          </TouchableOpacity>
          {showSkills && (
            <View style={styles.skillsGrid}>
              {SKILLS.map((s) => (
                <TouchableOpacity key={s} style={[styles.skillChip, form.required_skill === s && styles.active]} onPress={() => setForm({ ...form, required_skill: s })}>
                  <Text style={[styles.skillChipText, form.required_skill === s && styles.activeText]}>{s}</Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>

        {/* Budget */}
        <View style={styles.section}>
          <Text style={styles.label}>Budget (NGN) *</Text>
          <View style={styles.priceRow}>
            <Text style={styles.nairaSign}>{NAIRA}</Text>
            <TextInput
              style={styles.priceInput}
              placeholder="0"
              placeholderTextColor="#555"
              value={form.budget}
              onChangeText={(v) => setForm({ ...form, budget: formatCurrency(v) })}
              keyboardType="numeric"
            />
          </View>
          <Text style={styles.hint}>Total amount you are willing to pay</Text>
        </View>

        {/* Workers */}
        <View style={styles.section}>
          <Text style={styles.label}>Number of Workers</Text>
          <View style={styles.workerRow}>
            {["1", "2", "3", "4", "5+"].map((n) => (
              <TouchableOpacity key={n} style={[styles.workerBtn, form.workers_needed === n && styles.active]} onPress={() => setForm({ ...form, workers_needed: n })}>
                <Text style={[styles.workerText, form.workers_needed === n && styles.activeText]}>{n}</Text>
              </TouchableOpacity>
            ))}
          </View>
          <Text style={styles.hint}>Need more than 5? Post as a Labour job above.</Text>
        </View>

        {/* Description with prompts */}
        <View style={styles.section}>
          <Text style={styles.label}>Description</Text>
          <Text style={styles.hint}>Include: pickup location � dropoff location � preferred time � special instructions</Text>
          <TextInput
            style={[styles.input, { height: 110, textAlignVertical: "top" }]}
            placeholder={"e.g.\n- Pickup: Alaba Market, Lagos\n- Dropoff: Lekki Phase 1\n- Time: Before 3pm today\n- Item: 1 Samsung phone in a box"}
            placeholderTextColor="#555"
            value={form.description}
            onChangeText={(v) => setForm({ ...form, description: v })}
            multiline
          />
        </View>

        {/* Deadline */}
        <View style={styles.section}>
          <Text style={styles.label}>Complete by (optional)</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g. Today, Tomorrow, Friday 5pm, This week"
            placeholderTextColor="#555"
            value={form.deadline}
            onChangeText={(v) => setForm({ ...form, deadline: v })}
          />
        </View>

        {/* Location */}
        <View style={styles.section}>
          <Text style={styles.label}>Location *</Text>
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

        <View style={styles.notice}>
          <MaterialCommunityIcons name="shield-check-outline" size={18} color="#1DB954" />
          <Text style={styles.noticeText}>Payment held in Proxi Escrow. Worker gets paid only after you confirm task is done.</Text>
        </View>

        <TouchableOpacity style={[styles.submitBtn, loading && { opacity: 0.5 }]} onPress={handleSubmit} disabled={loading}>
          {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.submitText}>Post Task</Text>}
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
  hint: { color: "#555", fontSize: 12, marginBottom: 8, marginTop: 4 },
  input: { backgroundColor: "#1A1A1A", borderRadius: 12, paddingHorizontal: 16, paddingVertical: 14, fontSize: 15, color: "#FFFFFF", borderWidth: 1, borderColor: "#2A2A2A" },
  urgentBtn: { flexDirection: "row", alignItems: "center", gap: 8, backgroundColor: "#1A1A1A", borderRadius: 12, padding: 14, borderWidth: 1, borderColor: "#2A2A2A" },
  urgentBtnActive: { backgroundColor: "#1A0A00", borderColor: "#FF6B35" },
  urgentText: { color: "#555", fontSize: 14, fontWeight: "500" },
  urgentTextActive: { color: "#FF6B35", fontWeight: "700" },
  templatesRow: { flexDirection: "row", gap: 8, paddingBottom: 4 },
  templateChip: { backgroundColor: "#1A1A1A", borderRadius: 20, paddingHorizontal: 14, paddingVertical: 8, borderWidth: 1, borderColor: "#2A2A2A", maxWidth: 220 },
  templateChipText: { color: "#888", fontSize: 12 },
  typeCard: { backgroundColor: "#1A1A1A", borderRadius: 12, padding: 14, marginBottom: 8, borderWidth: 1, borderColor: "#2A2A2A" },
  typeCardActive: { borderColor: "#1DB954", backgroundColor: "#0D2818" },
  typeRow: { flexDirection: "row", alignItems: "center", gap: 12 },
  typeText: { flex: 1 },
  typeLabel: { color: "#888", fontSize: 15, fontWeight: "600" },
  typeLabelActive: { color: "#FFFFFF" },
  typeDesc: { color: "#555", fontSize: 12, marginTop: 2 },
  autoLabel: { color: "#1DB954", fontSize: 11 },
  showSkillsBtn: { flexDirection: "row", alignItems: "center", gap: 4, marginTop: 8 },
  showSkillsBtnText: { color: "#1DB954", fontSize: 13 },
  skillsGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 10 },
  skillChip: { backgroundColor: "#1A1A1A", borderRadius: 20, paddingHorizontal: 14, paddingVertical: 8, borderWidth: 1, borderColor: "#2A2A2A" },
  skillChipText: { color: "#555", fontSize: 13 },
  priceRow: { flexDirection: "row", alignItems: "center", backgroundColor: "#1A1A1A", borderRadius: 12, borderWidth: 1, borderColor: "#2A2A2A", paddingHorizontal: 16 },
  nairaSign: { color: "#1DB954", fontSize: 22, fontWeight: "700", marginRight: 8 },
  priceInput: { flex: 1, paddingVertical: 14, fontSize: 20, color: "#FFFFFF", fontWeight: "600" },
  workerRow: { flexDirection: "row", gap: 8 },
  workerBtn: { backgroundColor: "#1A1A1A", borderRadius: 10, paddingHorizontal: 18, paddingVertical: 12, borderWidth: 1, borderColor: "#2A2A2A" },
  workerText: { color: "#555", fontSize: 15, fontWeight: "600" },
  active: { borderColor: "#1DB954", backgroundColor: "#0D2818" },
  activeText: { color: "#1DB954" },
  locationRow: { flexDirection: "row", gap: 8, alignItems: "center" },
  gpsBtn: { width: 48, height: 48, backgroundColor: "#1A1A1A", borderRadius: 12, justifyContent: "center", alignItems: "center", borderWidth: 1, borderColor: "#1DB954" },
  notice: { flexDirection: "row", alignItems: "flex-start", gap: 10, backgroundColor: "#0D2818", borderRadius: 12, padding: 14, marginHorizontal: 20, marginBottom: 20, borderWidth: 1, borderColor: "#1DB954" },
  noticeText: { color: "#888", fontSize: 13, flex: 1, lineHeight: 18 },
  submitBtn: { backgroundColor: "#1DB954", paddingVertical: 16, borderRadius: 12, alignItems: "center", marginHorizontal: 20 },
  submitText: { color: "#FFFFFF", fontSize: 16, fontWeight: "600" },
});
