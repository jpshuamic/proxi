import { useState, useEffect } from "react";
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator, Alert, KeyboardAvoidingView, Platform, ScrollView, Image } from "react-native";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import * as Location from "expo-location";
import { listingsAPI } from "../../services/api";
import { formatCurrency, parseCurrency, NAIRA } from "../../utils/format";

const VEHICLE_TYPES = ["Car", "SUV / Jeep", "Truck", "Bus / Van", "Motorcycle", "Tricycle (Keke)", "Trailer"];
const BRANDS = ["Toyota", "Honda", "Mercedes-Benz", "BMW", "Ford", "Hyundai", "Kia", "Nissan", "Lexus", "Volkswagen", "Audi", "Peugeot", "Mitsubishi", "Mazda", "Suzuki", "Ford", "Other"];
const YEARS = Array.from({ length: 30 }, (_, i) => (2025 - i).toString());
const TRANSMISSIONS = ["Automatic", "Manual", "CVT"];
const FUEL_TYPES = ["Petrol", "Diesel", "Hybrid", "Electric", "CNG"];
const CONDITIONS = ["Brand New (Foreign)", "Foreign Used", "Nigerian Used", "Used - Like New", "Salvage"];
const COLORS = ["Black", "White", "Silver", "Grey", "Blue", "Red", "Gold", "Green", "Brown", "Other"];

const STEPS = [
  { id: 1, title: "Photos" },
  { id: 2, title: "Info" },
  { id: 3, title: "Specs" },
  { id: 4, title: "Price" },
];

export default function PostVehicleScreen({ navigation }) {
  const [step, setStep] = useState(1);
  const [form, setForm] = useState({
    vehicle_type: "", brand: "", model: "", year: "",
    transmission: "", fuel_type: "", condition: "", color: "",
    mileage: "", engine_size: "", price: "", delivery_fee: "",
    description: "", area_description: "",
    delivery_available: false, registered: false,
    negotiate: false,
  });
  const [images, setImages] = useState([]);
  const [coverIndex, setCoverIndex] = useState(0);
  const [loading, setLoading] = useState(false);
  const [locationLoading, setLocationLoading] = useState(false);

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
    if (status !== "granted") { Alert.alert("Permission needed", "Please allow camera access"); return; }
    const result = await ImagePicker.launchCameraAsync({ quality: 0.7 });
    if (!result.canceled) setImages(prev => [...prev, result.assets[0].uri].slice(0, 8));
  };

  const removeImage = (index) => {
    setImages(images.filter((_, i) => i !== index));
    if (coverIndex >= images.length - 1) setCoverIndex(0);
  };

  const validateStep = () => {
    if (step === 1 && images.length === 0) { Alert.alert("Add photos", "Please add at least one photo"); return false; }
    if (step === 2 && !form.vehicle_type) { Alert.alert("Required", "Please select vehicle type"); return false; }
    if (step === 2 && !form.brand) { Alert.alert("Required", "Please select a brand"); return false; }
    if (step === 2 && !form.model.trim()) { Alert.alert("Required", "Please enter the model"); return false; }
    if (step === 2 && !form.year) { Alert.alert("Required", "Please select the year"); return false; }
    if (step === 3 && !form.condition) { Alert.alert("Required", "Please select condition"); return false; }
    if (step === 4 && !form.price) { Alert.alert("Required", "Please enter a price"); return false; }
    if (step === 4 && !form.area_description.trim()) { Alert.alert("Required", "Please enter your location"); return false; }
    return true;
  };

  const nextStep = () => { if (validateStep()) setStep(s => s + 1); };
  const prevStep = () => setStep(s => s - 1);

  const handleSubmit = async () => {
    if (!validateStep()) return;
    setLoading(true);
    try {
      const title = `${form.brand} ${form.model} ${form.year}`;
      const specs = [
        form.vehicle_type, form.transmission, form.fuel_type,
        form.color, form.mileage ? form.mileage + "km" : null,
        form.engine_size, form.registered ? "Registered" : "Not registered"
      ].filter(Boolean).join(" | ");
      const description = `${specs}\n\n${form.description || ""}`.trim();
      await listingsAPI.create({
        title,
        description,
        category: "vehicles",
        price: parseCurrency(form.price),
        condition: form.condition === "Brand New (Foreign)" ? "brand_new" : "used_good",
        area_description: form.area_description,
        delivery_available: form.delivery_available,
      });
      Alert.alert("Vehicle Listed!", `${title} is now live on Proxi.`, [
        { text: "View feed", onPress: () => navigation.goBack() }
      ]);
    } catch (e) {
      Alert.alert("Error", e.response?.data?.message || "Failed to post listing");
    } finally {
      setLoading(false);
    }
  };

  const SelectChips = ({ options, value, onSelect, columns = 3 }) => (
    <View style={styles.chipsGrid}>
      {options.map((opt) => (
        <TouchableOpacity
          key={opt}
          style={[styles.chip, value === opt && styles.chipActive, { width: columns === 2 ? "48%" : columns === 3 ? "31%" : "23%" }]}
          onPress={() => onSelect(opt)}
        >
          <Text style={[styles.chipText, value === opt && styles.chipTextActive]} numberOfLines={2}>{opt}</Text>
        </TouchableOpacity>
      ))}
    </View>
  );

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === "ios" ? "padding" : "height"}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => step === 1 ? navigation.goBack() : prevStep()}>
          <Ionicons name="arrow-back" size={20} color="#FFFFFF" />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>Post a Vehicle</Text>
          <Text style={styles.headerStep}>Step {step} of {STEPS.length}</Text>
        </View>
        <View style={{ width: 36 }} />
      </View>

      {/* Progress bar */}
      <View style={styles.progressBar}>
        {STEPS.map((s) => (
          <View key={s.id} style={styles.progressStep}>
            <View style={[styles.progressDot, step >= s.id && styles.progressDotActive]}>
              {step > s.id ? (
                <Ionicons name="checkmark" size={12} color="#fff" />
              ) : (
                <Text style={[styles.progressDotText, step >= s.id && { color: "#fff" }]}>{s.id}</Text>
              )}
            </View>
            <Text style={[styles.progressLabel, step >= s.id && styles.progressLabelActive]}>{s.title}</Text>
            {s.id < STEPS.length && <View style={[styles.progressLine, step > s.id && styles.progressLineActive]} />}
          </View>
        ))}
      </View>

      <ScrollView showsVerticalScrollIndicator={false} style={styles.content}>

        {/* STEP 1 � Photos */}
        {step === 1 && (
          <View style={styles.stepContent}>
            <Text style={styles.stepTitle}>Add Photos</Text>
            <Text style={styles.stepSubtitle}>Add up to 8 photos. Tap any photo to set it as cover.</Text>

            {images.length > 0 && (
              <View style={styles.photoGrid}>
                {images.map((uri, index) => (
                  <TouchableOpacity key={index} style={styles.photoItem} onPress={() => setCoverIndex(index)}>
                    <Image source={{ uri }} style={styles.photoThumb} />
                    {coverIndex === index && (
                      <View style={styles.coverBadge}>
                        <Text style={styles.coverBadgeText}>Cover</Text>
                      </View>
                    )}
                    <TouchableOpacity style={styles.removePhoto} onPress={() => removeImage(index)}>
                      <Ionicons name="close-circle" size={22} color="#FF3B30" />
                    </TouchableOpacity>
                  </TouchableOpacity>
                ))}
              </View>
            )}

            {images.length < 8 && (
              <View style={styles.addPhotoRow}>
                <TouchableOpacity style={styles.addPhotoBtn} onPress={takePhoto}>
                  <Ionicons name="camera-outline" size={28} color="#1DB954" />
                  <Text style={styles.addPhotoBtnText}>Camera</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.addPhotoBtn} onPress={pickImages}>
                  <Ionicons name="images-outline" size={28} color="#1DB954" />
                  <Text style={styles.addPhotoBtnText}>Gallery</Text>
                </TouchableOpacity>
              </View>
            )}

            <Text style={styles.photoHint}>{images.length}/8 photos � Tap a photo to set as cover</Text>
          </View>
        )}

        {/* STEP 2 � Vehicle Info */}
        {step === 2 && (
          <View style={styles.stepContent}>
            <Text style={styles.stepTitle}>Vehicle Details</Text>
            <Text style={styles.stepSubtitle}>Tell buyers about the vehicle</Text>

            <Text style={styles.label}>Vehicle Type *</Text>
            <SelectChips options={VEHICLE_TYPES} value={form.vehicle_type} onSelect={(v) => setForm({ ...form, vehicle_type: v })} columns={3} />

            <Text style={styles.label}>Brand *</Text>
            <SelectChips options={BRANDS} value={form.brand} onSelect={(v) => setForm({ ...form, brand: v })} columns={3} />

            <Text style={styles.label}>Model *</Text>
            <TextInput style={styles.input} placeholder="e.g. Camry, Accord, C-Class, Hilux" placeholderTextColor="#555" value={form.model} onChangeText={(v) => setForm({ ...form, model: v })} />

            <Text style={styles.label}>Year *</Text>
            <SelectChips options={YEARS.slice(0, 20)} value={form.year} onSelect={(v) => setForm({ ...form, year: v })} columns={4} />

            <Text style={styles.label}>Transmission</Text>
            <SelectChips options={TRANSMISSIONS} value={form.transmission} onSelect={(v) => setForm({ ...form, transmission: v })} columns={3} />

            <Text style={styles.label}>Fuel Type</Text>
            <SelectChips options={FUEL_TYPES} value={form.fuel_type} onSelect={(v) => setForm({ ...form, fuel_type: v })} columns={3} />

            <Text style={styles.label}>Color</Text>
            <SelectChips options={COLORS} value={form.color} onSelect={(v) => setForm({ ...form, color: v })} columns={4} />
          </View>
        )}

        {/* STEP 3 � Condition */}
        {step === 3 && (
          <View style={styles.stepContent}>
            <Text style={styles.stepTitle}>Condition & Specs</Text>
            <Text style={styles.stepSubtitle}>Be honest � it builds trust with buyers</Text>

            <Text style={styles.label}>Condition *</Text>
            <SelectChips options={CONDITIONS} value={form.condition} onSelect={(v) => setForm({ ...form, condition: v })} columns={2} />

            <Text style={styles.label}>Mileage (km)</Text>
            <TextInput style={styles.input} placeholder="e.g. 45000" placeholderTextColor="#555" value={form.mileage} onChangeText={(v) => setForm({ ...form, mileage: v })} keyboardType="numeric" />
            <Text style={styles.hint}>Enter in kilometres (km)</Text>

            <Text style={styles.label}>Engine Size</Text>
            <TextInput style={styles.input} placeholder="e.g. 2.4L, 1800cc, V6, V8" placeholderTextColor="#555" value={form.engine_size} onChangeText={(v) => setForm({ ...form, engine_size: v })} />

            <Text style={styles.label}>Additional Details</Text>
            <TextInput style={[styles.input, { height: 100, textAlignVertical: "top" }]} placeholder="Any extra info � accident history, recent repairs, extras..." placeholderTextColor="#555" value={form.description} onChangeText={(v) => setForm({ ...form, description: v })} multiline />

            <TouchableOpacity style={styles.toggleRow} onPress={() => setForm({ ...form, registered: !form.registered })}>
              <View style={styles.toggleLeft}>
                <MaterialCommunityIcons name="card-account-details-outline" size={20} color="#888" />
                <View>
                  <Text style={styles.toggleLabel}>Registered</Text>
                  <Text style={styles.toggleSub}>Does it have valid registration papers?</Text>
                </View>
              </View>
              <View style={[styles.toggle, form.registered && styles.toggleActive]}>
                <View style={[styles.toggleDot, form.registered && styles.toggleDotActive]} />
              </View>
            </TouchableOpacity>
          </View>
        )}

        {/* STEP 4 � Pricing & Location */}
        {step === 4 && (
          <View style={styles.stepContent}>
            <Text style={styles.stepTitle}>Price & Location</Text>
            <Text style={styles.stepSubtitle}>Set your price and where the vehicle is</Text>

            <Text style={styles.label}>Asking Price (NGN) *</Text>
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
                <MaterialCommunityIcons name="handshake-outline" size={20} color="#888" />
                <View>
                  <Text style={styles.toggleLabel}>Price is negotiable</Text>
                  <Text style={styles.toggleSub}>Buyers can make offers</Text>
                </View>
              </View>
              <View style={[styles.toggle, form.negotiate && styles.toggleActive]}>
                <View style={[styles.toggleDot, form.negotiate && styles.toggleDotActive]} />
              </View>
            </TouchableOpacity>

            <TouchableOpacity style={styles.toggleRow} onPress={() => setForm({ ...form, delivery_available: !form.delivery_available })}>
              <View style={styles.toggleLeft}>
                <MaterialCommunityIcons name="truck-delivery-outline" size={20} color="#888" />
                <View>
                  <Text style={styles.toggleLabel}>Delivery available</Text>
                  <Text style={styles.toggleSub}>Can you drive it to the buyer?</Text>
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

            <Text style={styles.label}>Your Location *</Text>
            <View style={styles.locationRow}>
              <TextInput
                style={[styles.input, { flex: 1 }]}
                placeholder="e.g. Lekki Lagos, Wuse Abuja"
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
            <Text style={styles.hint}>Tap the pin icon to auto-fill your location</Text>

            <View style={styles.notice}>
              <MaterialCommunityIcons name="shield-check-outline" size={18} color="#1DB954" />
              <Text style={styles.noticeText}>All payments protected by Proxi Escrow. You get paid after buyer confirms receipt.</Text>
            </View>
          </View>
        )}

        <View style={{ height: 20 }} />
      </ScrollView>

      {/* Bottom navigation */}
      <View style={styles.bottomBar}>
        {step < STEPS.length ? (
          <TouchableOpacity style={styles.nextBtn} onPress={nextStep}>
            <Text style={styles.nextBtnText}>Continue</Text>
            <Ionicons name="arrow-forward" size={20} color="#fff" />
          </TouchableOpacity>
        ) : (
          <TouchableOpacity style={[styles.nextBtn, loading && { opacity: 0.5 }]} onPress={handleSubmit} disabled={loading}>
            {loading ? <ActivityIndicator color="#fff" /> : (
              <>
                <MaterialCommunityIcons name="car-outline" size={20} color="#fff" />
                <Text style={styles.nextBtnText}>Post Vehicle</Text>
              </>
            )}
          </TouchableOpacity>
        )}
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0A0A0A" },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", padding: 20, paddingTop: 60 },
  backBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: "#1A1A1A", justifyContent: "center", alignItems: "center" },
  headerCenter: { alignItems: "center" },
  headerTitle: { color: "#FFFFFF", fontSize: 17, fontWeight: "700" },
  headerStep: { color: "#888", fontSize: 12, marginTop: 2 },
  progressBar: { flexDirection: "row", paddingHorizontal: 20, marginBottom: 20, alignItems: "center" },
  progressStep: { flexDirection: "row", alignItems: "center", flex: 1 },
  progressDot: { width: 28, height: 28, borderRadius: 14, backgroundColor: "#1A1A1A", borderWidth: 2, borderColor: "#2A2A2A", justifyContent: "center", alignItems: "center" },
  progressDotActive: { backgroundColor: "#1DB954", borderColor: "#1DB954" },
  progressDotText: { color: "#555", fontSize: 12, fontWeight: "700" },
  progressLabel: { color: "#555", fontSize: 8, marginLeft: 2, flex: 1 },
  progressLabelActive: { color: "#1DB954" },
  progressLine: { flex: 1, height: 2, backgroundColor: "#2A2A2A", marginHorizontal: 4 },
  progressLineActive: { backgroundColor: "#1DB954" },
  content: { flex: 1 },
  stepContent: { paddingHorizontal: 20 },
  stepTitle: { color: "#FFFFFF", fontSize: 22, fontWeight: "700", marginBottom: 4 },
  stepSubtitle: { color: "#888", fontSize: 14, marginBottom: 20 },
  label: { color: "#AAAAAA", fontSize: 13, fontWeight: "600", marginBottom: 8, marginTop: 12 },
  hint: { color: "#555", fontSize: 12, marginTop: 4, marginBottom: 8 },
  input: { backgroundColor: "#1A1A1A", borderRadius: 12, paddingHorizontal: 16, paddingVertical: 14, fontSize: 15, color: "#FFFFFF", borderWidth: 1, borderColor: "#2A2A2A" },
  chipsGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 4 },
  chip: { backgroundColor: "#1A1A1A", borderRadius: 10, paddingVertical: 10, paddingHorizontal: 6, alignItems: "center", borderWidth: 1, borderColor: "#2A2A2A", minHeight: 44, justifyContent: "center" },
  chipActive: { borderColor: "#1DB954", backgroundColor: "#0D2818" },
  chipText: { color: "#555", fontSize: 11, textAlign: "center" },
  chipTextActive: { color: "#1DB954", fontWeight: "600" },
  photoGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 16 },
  photoItem: { position: "relative", width: "31%" },
  photoThumb: { width: "100%", aspectRatio: 1, borderRadius: 10 },
  coverBadge: { position: "absolute", bottom: 6, left: 6, backgroundColor: "#1DB954", paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6 },
  coverBadgeText: { color: "#fff", fontSize: 10, fontWeight: "700" },
  removePhoto: { position: "absolute", top: -8, right: -8 },
  addPhotoRow: { flexDirection: "row", gap: 12, marginBottom: 12 },
  addPhotoBtn: { flex: 1, height: 100, backgroundColor: "#1A1A1A", borderRadius: 12, justifyContent: "center", alignItems: "center", borderWidth: 1, borderColor: "#2A2A2A", borderStyle: "dashed", gap: 6 },
  addPhotoBtnText: { color: "#1DB954", fontSize: 13, fontWeight: "500" },
  photoHint: { color: "#555", fontSize: 12, textAlign: "center", marginBottom: 8 },
  priceRow: { flexDirection: "row", alignItems: "center", backgroundColor: "#1A1A1A", borderRadius: 12, borderWidth: 1, borderColor: "#2A2A2A", paddingHorizontal: 16, marginBottom: 12 },
  nairaSign: { color: "#1DB954", fontSize: 22, fontWeight: "700", marginRight: 8 },
  priceInput: { flex: 1, paddingVertical: 14, fontSize: 20, color: "#FFFFFF", fontWeight: "600" },
  locationRow: { flexDirection: "row", gap: 8, alignItems: "center" },
  gpsBtn: { width: 48, height: 48, backgroundColor: "#1A1A1A", borderRadius: 12, justifyContent: "center", alignItems: "center", borderWidth: 1, borderColor: "#1DB954" },
  toggleRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", backgroundColor: "#1A1A1A", borderRadius: 12, padding: 14, marginBottom: 10, borderWidth: 1, borderColor: "#2A2A2A" },
  toggleLeft: { flexDirection: "row", alignItems: "center", gap: 12, flex: 1 },
  toggleLabel: { color: "#FFFFFF", fontSize: 14, fontWeight: "500" },
  toggleSub: { color: "#555", fontSize: 12, marginTop: 2 },
  toggle: { width: 44, height: 24, borderRadius: 12, backgroundColor: "#333", justifyContent: "center", paddingHorizontal: 2 },
  toggleActive: { backgroundColor: "#1DB954" },
  toggleDot: { width: 20, height: 20, borderRadius: 10, backgroundColor: "#fff" },
  toggleDotActive: { alignSelf: "flex-end" },
  notice: { flexDirection: "row", alignItems: "flex-start", gap: 10, backgroundColor: "#0D2818", borderRadius: 12, padding: 14, marginTop: 8, borderWidth: 1, borderColor: "#1DB954" },
  noticeText: { color: "#888", fontSize: 13, flex: 1, lineHeight: 18 },
  bottomBar: { padding: 20, borderTopWidth: 1, borderTopColor: "#1A1A1A", backgroundColor: "#0A0A0A" },
  nextBtn: { backgroundColor: "#1DB954", borderRadius: 14, paddingVertical: 16, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8 },
  nextBtnText: { color: "#FFFFFF", fontSize: 16, fontWeight: "700" },
});
