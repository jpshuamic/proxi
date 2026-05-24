import { useState, useEffect } from "react";
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, ActivityIndicator, Alert, RefreshControl, Linking } from "react-native";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { useAuth } from "../../context/AuthContext";
import { walletAPI, paystackAPI } from "../../services/api";

const timeAgo = (d) => {
  const s = Math.floor((new Date() - new Date(d)) / 1000);
  if (s < 60) return "Just now";
  if (s < 3600) return `${Math.floor(s/60)}m ago`;
  if (s < 86400) return `${Math.floor(s/3600)}h ago`;
  return `${Math.floor(s/86400)}d ago`;
};

const AMOUNTS = [1000, 2000, 5000, 10000, 20000, 50000];

export default function WalletScreen({ navigation }) {
  const { user } = useAuth();
  const [wallet, setWallet] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [funding, setFunding] = useState(false);
  const [showFund, setShowFund] = useState(false);
  const [selectedAmount, setSelectedAmount] = useState(null);

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    try {
      const [w, t] = await Promise.all([walletAPI.getWallet(), walletAPI.getTransactions()]);
      setWallet(w.data.wallet);
      setTransactions(t.data.transactions || []);
    } catch (e) { console.log(e); }
    finally { setLoading(false); setRefreshing(false); }
  };

  const handleFund = async () => {
    if (!selectedAmount) { Alert.alert("Error", "Please select an amount"); return; }
    setFunding(true);
    try {
      const res = await paystackAPI.initialize({ amount: selectedAmount, email: user?.email || `${user?.phone_number}@proxi.ng` });
      await Linking.openURL(res.data.payment_url);
      Alert.alert("Complete Payment", "After paying, tap Verify to update your balance.", [
        { text: "Verify", onPress: () => verifyPayment(res.data.reference) },
        { text: "Later", style: "cancel" },
      ]);
    } catch (e) { Alert.alert("Error", "Could not initialize payment"); }
    finally { setFunding(false); setShowFund(false); setSelectedAmount(null); }
  };

  const verifyPayment = async (reference) => {
    try {
      const res = await paystackAPI.verify(reference);
      Alert.alert("Success!", res.data.message);
      loadData();
    } catch (e) { Alert.alert("Error", "Payment verification failed"); }
  };

  const getTxIcon = (type) => {
    switch(type) {
      case "wallet_topup": return { icon: "arrow-down-circle-outline", color: "#1DB954" };
      case "escrow_hold": return { icon: "lock-closed-outline", color: "#378ADD" };
      case "escrow_release": return { icon: "arrow-up-circle-outline", color: "#1DB954" };
      case "refund": return { icon: "refresh-circle-outline", color: "#FFD700" };
      default: return { icon: "swap-horizontal-outline", color: "#888" };
    }
  };

  const getTxLabel = (type) => {
    switch(type) {
      case "wallet_topup": return "Wallet funded";
      case "escrow_hold": return "Held in escrow";
      case "escrow_release": return "Payment received";
      case "refund": return "Refund";
      default: return type?.replace(/_/g, " ");
    }
  };

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
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={20} color="#888" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Wallet</Text>
          <TouchableOpacity onPress={loadData}>
            <Ionicons name="refresh-outline" size={20} color="#888" />
          </TouchableOpacity>
        </View>

        {/* Balance card */}
        <View style={styles.balanceCard}>
          <View style={styles.balanceTop}>
            <MaterialCommunityIcons name="wallet-outline" size={24} color="#1DB954" />
            <Text style={styles.balanceLabel}>Available Balance</Text>
          </View>
          <Text style={styles.balanceValue}>
            \u20A6{wallet ? parseFloat(wallet.balance).toLocaleString("en-NG", { minimumFractionDigits: 2 }) : "0.00"}
          </Text>
          {wallet?.escrow_balance > 0 && (
            <View style={styles.escrowPill}>
              <Ionicons name="lock-closed-outline" size={12} color="#378ADD" />
              <Text style={styles.escrowPillText}>\u20A6{parseFloat(wallet.escrow_balance).toLocaleString()} in escrow</Text>
            </View>
          )}
          <View style={styles.balanceActions}>
            <TouchableOpacity style={styles.balanceActionBtn} onPress={() => setShowFund(!showFund)}>
              <Ionicons name="add-circle-outline" size={20} color="#1DB954" />
              <Text style={styles.balanceActionText}>Add Money</Text>
            </TouchableOpacity>
            <View style={styles.balanceActionDivider} />
            <TouchableOpacity style={styles.balanceActionBtn} onPress={() => Alert.alert("Coming soon", "Withdrawals coming in next update")}>
              <Ionicons name="arrow-up-circle-outline" size={20} color="#888" />
              <Text style={[styles.balanceActionText, { color: "#888" }]}>Withdraw</Text>
            </TouchableOpacity>
            <View style={styles.balanceActionDivider} />
            <TouchableOpacity style={styles.balanceActionBtn} onPress={() => Alert.alert("Coming soon", "Send money coming in next update")}>
              <Ionicons name="paper-plane-outline" size={20} color="#888" />
              <Text style={[styles.balanceActionText, { color: "#888" }]}>Send</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Fund panel */}
        {showFund && (
          <View style={styles.fundPanel}>
            <Text style={styles.fundTitle}>How much do you want to add?</Text>
            <View style={styles.amountGrid}>
              {AMOUNTS.map((amt) => (
                <TouchableOpacity
                  key={amt}
                  style={[styles.amountBtn, selectedAmount === amt && styles.amountBtnActive]}
                  onPress={() => setSelectedAmount(amt)}
                >
                  <Text style={[styles.amountText, selectedAmount === amt && styles.amountTextActive]}>
                    N{amt.toLocaleString()}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
            <TouchableOpacity
              style={[styles.payBtn, (!selectedAmount || funding) && { opacity: 0.5 }]}
              onPress={handleFund}
              disabled={!selectedAmount || funding}
            >
              {funding ? <ActivityIndicator color="#fff" /> : (
                <View style={styles.payBtnInner}>
                  <MaterialCommunityIcons name="shield-check-outline" size={18} color="#fff" />
                  <Text style={styles.payBtnText}>Pay with Paystack</Text>
                </View>
              )}
            </TouchableOpacity>
          </View>
        )}

        {/* How it works */}
        <View style={styles.howItWorks}>
          <Text style={styles.howTitle}>How Proxi Wallet works</Text>
          {[
            { n: "1", text: "Add money using Paystack — cards, bank transfer, USSD" },
            { n: "2", text: "When you buy or hire, funds are held safely in escrow" },
            { n: "3", text: "Confirm delivery or task done — funds released instantly" },
            { n: "4", text: "Withdraw earnings to your bank account anytime" },
          ].map((s) => (
            <View key={s.n} style={styles.howStep}>
              <View style={styles.howNum}><Text style={styles.howNumText}>{s.n}</Text></View>
              <Text style={styles.howText}>{s.text}</Text>
            </View>
          ))}
        </View>

        {/* Transactions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Transaction History</Text>
          {transactions.length === 0 ? (
            <View style={styles.emptyCard}>
              <MaterialCommunityIcons name="receipt-outline" size={40} color="#333" />
              <Text style={styles.emptyText}>No transactions yet</Text>
              <Text style={styles.emptySubtext}>Your payments will appear here</Text>
            </View>
          ) : (
            transactions.map((tx) => {
              const { icon, color } = getTxIcon(tx.type);
              const isCredit = tx.to_user_id === user?.id;
              return (
                <View key={tx.id} style={styles.txCard}>
                  <View style={[styles.txIcon, { backgroundColor: color + "20" }]}>
                    <Ionicons name={icon} size={22} color={color} />
                  </View>
                  <View style={styles.txInfo}>
                    <Text style={styles.txLabel}>{getTxLabel(tx.type)}</Text>
                    <Text style={styles.txTime}>{timeAgo(tx.created_at)}</Text>
                  </View>
                  <Text style={[styles.txAmount, { color: isCredit ? "#1DB954" : "#FF6B35" }]}>
                    {isCredit ? "+" : "-"}\u20A6{parseFloat(tx.amount).toLocaleString()}
                  </Text>
                </View>
              );
            })
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
  headerTitle: { color: "#FFFFFF", fontSize: 20, fontWeight: "700" },
  balanceCard: { margin: 20, marginTop: 0, backgroundColor: "#0D2818", borderRadius: 20, padding: 24, borderWidth: 1, borderColor: "#1DB954" },
  balanceTop: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 12 },
  balanceLabel: { color: "#888", fontSize: 14 },
  balanceValue: { color: "#FFFFFF", fontSize: 40, fontWeight: "700", marginBottom: 8 },
  escrowPill: { flexDirection: "row", alignItems: "center", gap: 6, backgroundColor: "#0D1A2E", paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, alignSelf: "flex-start", marginBottom: 20 },
  escrowPillText: { color: "#378ADD", fontSize: 12 },
  balanceActions: { flexDirection: "row", backgroundColor: "#0A0A0A", borderRadius: 14, padding: 4 },
  balanceActionBtn: { flex: 1, alignItems: "center", gap: 6, paddingVertical: 12 },
  balanceActionText: { color: "#1DB954", fontSize: 12, fontWeight: "600" },
  balanceActionDivider: { width: 1, backgroundColor: "#1A1A1A", marginVertical: 8 },
  fundPanel: { margin: 20, marginTop: 0, backgroundColor: "#1A1A1A", borderRadius: 16, padding: 20, borderWidth: 1, borderColor: "#2A2A2A" },
  fundTitle: { color: "#FFFFFF", fontSize: 16, fontWeight: "600", marginBottom: 16 },
  amountGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 16 },
  amountBtn: { backgroundColor: "#0A0A0A", borderRadius: 10, paddingHorizontal: 16, paddingVertical: 12, borderWidth: 1, borderColor: "#2A2A2A" },
  amountBtnActive: { borderColor: "#1DB954", backgroundColor: "#0D2818" },
  amountText: { color: "#888", fontSize: 14, fontWeight: "500" },
  amountTextActive: { color: "#1DB954" },
  payBtn: { backgroundColor: "#1DB954", borderRadius: 12, paddingVertical: 14, alignItems: "center" },
  payBtnInner: { flexDirection: "row", alignItems: "center", gap: 8 },
  payBtnText: { color: "#FFFFFF", fontSize: 15, fontWeight: "600" },
  howItWorks: { margin: 20, marginTop: 0, backgroundColor: "#1A1A1A", borderRadius: 16, padding: 20, borderWidth: 1, borderColor: "#2A2A2A" },
  howTitle: { color: "#FFFFFF", fontSize: 15, fontWeight: "600", marginBottom: 16 },
  howStep: { flexDirection: "row", alignItems: "flex-start", gap: 12, marginBottom: 12 },
  howNum: { width: 26, height: 26, borderRadius: 13, backgroundColor: "#1DB954", justifyContent: "center", alignItems: "center", flexShrink: 0 },
  howNumText: { color: "#FFFFFF", fontSize: 12, fontWeight: "700" },
  howText: { color: "#888", fontSize: 14, flex: 1, lineHeight: 20 },
  section: { paddingHorizontal: 20, marginBottom: 24 },
  sectionTitle: { color: "#FFFFFF", fontSize: 18, fontWeight: "600", marginBottom: 16 },
  emptyCard: { backgroundColor: "#1A1A1A", borderRadius: 14, padding: 32, alignItems: "center", gap: 8 },
  emptyText: { color: "#555", fontSize: 16, fontWeight: "500" },
  emptySubtext: { color: "#444", fontSize: 13 },
  txCard: { flexDirection: "row", alignItems: "center", gap: 12, backgroundColor: "#1A1A1A", borderRadius: 14, padding: 14, marginBottom: 10, borderWidth: 1, borderColor: "#2A2A2A" },
  txIcon: { width: 46, height: 46, borderRadius: 23, justifyContent: "center", alignItems: "center" },
  txInfo: { flex: 1 },
  txLabel: { color: "#FFFFFF", fontSize: 14, fontWeight: "500", marginBottom: 2 },
  txTime: { color: "#555", fontSize: 12 },
  txAmount: { fontSize: 15, fontWeight: "700" },
});


