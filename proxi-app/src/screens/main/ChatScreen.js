import { useState, useEffect, useRef } from "react";
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, ActivityIndicator, TextInput, KeyboardAvoidingView, Platform, Alert, Modal } from "react-native";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { useAuth } from "../../context/AuthContext";
import { messagesAPI } from "../../services/api";

const getSmartReplies = (referenceType) => {
  if (referenceType === "listing") return ["Is this still available?", "What is your best price?", "Can you deliver to me?", "I am interested"];
  if (referenceType === "task") return ["I can do this task", "When do you need it done?", "What is the exact location?", "I am available now"];
  return ["Hello", "I am interested", "Can we talk?", "Thank you"];
};

export default function ChatScreen({ route, navigation }) {
  const { conversationId, otherPersonName, otherUserId, referenceId, referenceType } = route.params;
  const { user } = useAuth();
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [text, setText] = useState("");
  const [aiSuggestion, setAiSuggestion] = useState("");
  const [aiLoading, setAiLoading] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(true);
  const [showAttachments, setShowAttachments] = useState(false);
  const scrollRef = useRef(null);
  const aiTimer = useRef(null);

  const smartReplies = getSmartReplies(referenceType);

  useEffect(() => { loadMessages(); }, []);

  const loadMessages = async () => {
    try {
      if (conversationId) {
        const res = await messagesAPI.getMessages(conversationId);
        setMessages(res.data.messages || []);
        if (res.data.messages?.length > 0) setShowSuggestions(false);
      }
    } catch (e) { console.log(e); }
    finally { setLoading(false); }
  };

  const handleTextChange = (value) => {
    setText(value);
    setAiSuggestion("");
    if (value.length > 0) setShowSuggestions(false);
    if (value.length < 3) return;
    if (aiTimer.current) clearTimeout(aiTimer.current);
    aiTimer.current = setTimeout(() => getAiSuggestion(value), 600);
  };

  const getAiSuggestion = async (currentText) => {
    setAiLoading(true);
    try {
      const response = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514",
          max_tokens: 60,
          system: "You are helping complete a chat message on a Nigerian marketplace app called Proxi. Complete the user's message naturally in 1 short sentence. Return ONLY the completion text, nothing else. Keep it conversational and Nigerian-friendly.",
          messages: [{ role: "user", content: `Complete this message: "${currentText}"` }]
        })
      });
      const data = await response.json();
      const suggestion = data.content?.[0]?.text || "";
      if (suggestion && suggestion.trim()) {
        setAiSuggestion(suggestion.trim());
      }
    } catch (e) { console.log(e); }
    finally { setAiLoading(false); }
  };

  const acceptSuggestion = () => {
    if (aiSuggestion) {
      setText(text + " " + aiSuggestion);
      setAiSuggestion("");
    }
  };

  const handleSend = async (messageText) => {
    const content = messageText || text.trim();
    if (!content) return;
    setSending(true);
    setText("");
    setAiSuggestion("");
    setShowSuggestions(false);
    try {
      let res;
      if (conversationId) {
        res = await messagesAPI.sendMessage({
          receiver_id: otherUserId,
          content,
          reference_id: referenceId,
          reference_type: referenceType,
        });
      } else {
        res = await messagesAPI.startConversation({
          other_user_id: otherUserId,
          initial_message: content,
          reference_id: referenceId,
          reference_type: referenceType,
        });
      }
      setMessages(prev => [...prev, res.data.message]);
      setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 100);
    } catch (e) {
      Alert.alert("Error", "Failed to send message");
      setText(content);
    } finally {
      setSending(false);
    }
  };

  const handleAttachment = (type) => {
    setShowAttachments(false);
    switch(type) {
      case "photo":
        ImagePicker.launchImageLibraryAsync({
          mediaTypes: ImagePicker.MediaTypeOptions.Images,
          quality: 0.7,
        }).then(result => {
          if (!result.canceled) {
            handleSend("[Photo shared]");
          }
        });
        break;
      case "camera":
        ImagePicker.launchCameraAsync({ quality: 0.7 }).then(result => {
          if (!result.canceled) {
            handleSend("[Photo taken]");
          }
        });
        break;
      case "location":
        handleSend("[Location shared]");
        break;
      case "voice":
        Alert.alert("Coming soon", "Voice notes coming in next update");
        break;
    }
  };

  const formatTime = (d) => new Date(d).toLocaleTimeString("en-NG", { hour: "2-digit", minute: "2-digit" });

  if (loading) return (
    <View style={styles.loadingContainer}>
      <ActivityIndicator size="large" color="#1DB954" />
    </View>
  );

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === "ios" ? "padding" : "height"} keyboardVerticalOffset={0}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={20} color="#FFFFFF" />
        </TouchableOpacity>
        <View style={styles.headerInfo}>
          <View style={styles.headerAvatar}>
            <Text style={styles.headerAvatarText}>{otherPersonName?.charAt(0)?.toUpperCase() || "U"}</Text>
          </View>
          <View>
            <Text style={styles.headerName}>{otherPersonName || "User"}</Text>
            <Text style={styles.headerStatus}>Proxi member</Text>
          </View>
        </View>
        <TouchableOpacity style={styles.headerBtn} onPress={() => Alert.alert("Coming soon", "Voice calls coming in next update")}>
          <Ionicons name="call-outline" size={20} color="#888" />
        </TouchableOpacity>
      </View>
      {(route.params.referenceTitle || route.params.referenceType) && (
  <TouchableOpacity
    style={styles.contextBanner}
    onPress={() => {
      if (route.params.referenceType === "listing") {
        navigation.navigate("ListingDetail", { listingId: route.params.referenceId });
      } else if (route.params.referenceType === "task") {
        navigation.navigate("TaskDetail", { taskId: route.params.referenceId });
      }
    }}
    >
      <Ionicons
        name={route.params.referenceType === "listing" ? "pricetag-outline" : "briefcase-outline"}
        size={14}
        color="#FFD700"
      />
      <Text style={styles.contextBannerText} numberOfLines={1}>
        Re: {route.params.referenceTitle || route.params.referenceType}
      </Text>
      <Ionicons name="chevron-forward" size={14} color="#555" />
  </TouchableOpacity>
  )}

      {/* Escrow banner */}
      <View style={styles.escrowBanner}>
        <Ionicons name="shield-checkmark-outline" size={14} color="#1DB954" />
        <Text style={styles.escrowBannerText}>Always transact safely through Proxi Escrow</Text>
      </View>

      {/* Messages */}
      <ScrollView
        ref={scrollRef}
        style={styles.messageList}
        showsVerticalScrollIndicator={false}
        onContentSizeChange={() => scrollRef.current?.scrollToEnd({ animated: true })}
      >
        {messages.length === 0 && (
          <View style={styles.emptyChat}>
            <View style={styles.emptyChatAvatar}>
              <Text style={styles.emptyChatAvatarText}>{otherPersonName?.charAt(0)?.toUpperCase() || "U"}</Text>
            </View>
            <Text style={styles.emptyChatName}>{otherPersonName}</Text>
            <Text style={styles.emptyChatText}>Start the conversation</Text>
          </View>
        )}

        {messages.map((msg) => {
          const isMe = msg.sender_id === user?.id;
          return (
            <View key={msg.id} style={[styles.messageRow, isMe && styles.messageRowMe]}>
              {!isMe && (
                <View style={styles.msgAvatar}>
                  <Text style={styles.msgAvatarText}>{otherPersonName?.charAt(0)?.toUpperCase() || "U"}</Text>
                </View>
              )}
              <View style={[styles.bubble, isMe ? styles.bubbleMe : styles.bubbleThem]}>
                <Text style={[styles.bubbleText, isMe && styles.bubbleTextMe]}>{msg.content}</Text>
                <Text style={[styles.bubbleTime, isMe && styles.bubbleTimeMe]}>{formatTime(msg.created_at)}</Text>
              </View>
            </View>
          );
        })}
        <View style={{ height: 16 }} />
      </ScrollView>

      {/* Smart reply suggestions */}
      {showSuggestions && (
        <View style={styles.suggestionsContainer}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.suggestionsScroll}>
            {smartReplies.map((reply) => (
              <TouchableOpacity key={reply} style={styles.suggestionChip} onPress={() => handleSend(reply)}>
                <Text style={styles.suggestionText}>{reply}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      )}

      {/* AI autocomplete suggestion */}
      {aiSuggestion && !showSuggestions && (
        <TouchableOpacity style={styles.aiSuggestionBar} onPress={acceptSuggestion}>
          <MaterialCommunityIcons name="lightning-bolt" size={16} color="#1DB954" />
          <Text style={styles.aiSuggestionText} numberOfLines={1}>
            {text} <Text style={styles.aiSuggestionCompletion}>{aiSuggestion}</Text>
          </Text>
          <Text style={styles.aiSuggestionTap}>Tap to use</Text>
        </TouchableOpacity>
      )}

      {aiLoading && text.length > 2 && (
        <View style={styles.aiLoadingBar}>
          <ActivityIndicator size="small" color="#1DB954" />
          <Text style={styles.aiLoadingText}>AI thinking...</Text>
        </View>
      )}

      {/* Attachment modal */}
      <Modal visible={showAttachments} transparent animationType="slide">
        <TouchableOpacity style={styles.attachmentOverlay} onPress={() => setShowAttachments(false)}>
          <View style={styles.attachmentSheet}>
            <Text style={styles.attachmentTitle}>Share</Text>
            <View style={styles.attachmentGrid}>
              <TouchableOpacity style={styles.attachmentBtn} onPress={() => handleAttachment("camera")}>
                <View style={[styles.attachmentIcon, { backgroundColor: "#0D2818" }]}>
                  <Ionicons name="camera-outline" size={28} color="#1DB954" />
                </View>
                <Text style={styles.attachmentLabel}>Camera</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.attachmentBtn} onPress={() => handleAttachment("photo")}>
                <View style={[styles.attachmentIcon, { backgroundColor: "#0D1A2E" }]}>
                  <Ionicons name="images-outline" size={28} color="#378ADD" />
                </View>
                <Text style={styles.attachmentLabel}>Gallery</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.attachmentBtn} onPress={() => handleAttachment("location")}>
                <View style={[styles.attachmentIcon, { backgroundColor: "#1A1000" }]}>
                  <Ionicons name="location-outline" size={28} color="#FFD700" />
                </View>
                <Text style={styles.attachmentLabel}>Location</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.attachmentBtn} onPress={() => handleAttachment("voice")}>
                <View style={[styles.attachmentIcon, { backgroundColor: "#130D1A" }]}>
                  <Ionicons name="mic-outline" size={28} color="#9B59B6" />
                </View>
                <Text style={styles.attachmentLabel}>Voice Note</Text>
              </TouchableOpacity>
            </View>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Input row */}
      <View style={styles.inputRow}>
        <TouchableOpacity
          style={styles.attachBtn}
          onPress={() => setShowAttachments(true)}
        >
          <Ionicons name="add" size={24} color="#888" />
        </TouchableOpacity>
        <View style={styles.inputWrap}>
          <TextInput
            style={styles.input}
            placeholder="Type a message..."
            placeholderTextColor="#555"
            value={text}
            onChangeText={handleTextChange}
            multiline
            maxLength={500}
          />
        </View>
        <TouchableOpacity
          style={[styles.sendBtn, (!text.trim() || sending) && styles.sendBtnDisabled]}
          onPress={() => handleSend()}
          disabled={!text.trim() || sending}
        >
          {sending
            ? <ActivityIndicator size="small" color="#fff" />
            : <Ionicons name="send" size={18} color="#fff" />
          }
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0A0A0A" },
  loadingContainer: { flex: 1, backgroundColor: "#0A0A0A", justifyContent: "center", alignItems: "center" },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", padding: 16, paddingTop: 60, borderBottomWidth: 1, borderBottomColor: "#1A1A1A" },
  backBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: "#1A1A1A", justifyContent: "center", alignItems: "center" },
  headerInfo: { flexDirection: "row", alignItems: "center", gap: 10, flex: 1, marginLeft: 10 },
  headerAvatar: { width: 38, height: 38, borderRadius: 19, backgroundColor: "#1DB954", justifyContent: "center", alignItems: "center" },
  headerAvatarText: { color: "#FFFFFF", fontSize: 16, fontWeight: "700" },
  headerName: { color: "#FFFFFF", fontSize: 16, fontWeight: "600" },
  headerStatus: { color: "#888", fontSize: 12 },
  headerBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: "#1A1A1A", justifyContent: "center", alignItems: "center" },
  escrowBanner: { flexDirection: "row", alignItems: "center", gap: 6, backgroundColor: "#0D2818", paddingHorizontal: 16, paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: "#1A1A1A" },
  escrowBannerText: { color: "#1DB954", fontSize: 12, flex: 1 },
  messageList: { flex: 1, padding: 16 },
  emptyChat: { alignItems: "center", paddingTop: 40, gap: 10 },
  emptyChatAvatar: { width: 64, height: 64, borderRadius: 32, backgroundColor: "#1DB954", justifyContent: "center", alignItems: "center" },
  emptyChatAvatarText: { color: "#FFFFFF", fontSize: 26, fontWeight: "700" },
  emptyChatName: { color: "#FFFFFF", fontSize: 16, fontWeight: "600" },
  emptyChatText: { color: "#888", fontSize: 14 },
  messageRow: { flexDirection: "row", alignItems: "flex-end", gap: 8, marginBottom: 12 },
  messageRowMe: { flexDirection: "row-reverse" },
  msgAvatar: { width: 28, height: 28, borderRadius: 14, backgroundColor: "#1DB954", justifyContent: "center", alignItems: "center" },
  msgAvatarText: { color: "#FFFFFF", fontSize: 12, fontWeight: "700" },
  bubble: { maxWidth: "75%", borderRadius: 18, padding: 12, gap: 4 },
  bubbleMe: { backgroundColor: "#1DB954", borderBottomRightRadius: 4 },
  bubbleThem: { backgroundColor: "#1A1A1A", borderBottomLeftRadius: 4 },
  bubbleText: { color: "#CCCCCC", fontSize: 15, lineHeight: 20 },
  bubbleTextMe: { color: "#FFFFFF" },
  bubbleTime: { color: "#555", fontSize: 10, alignSelf: "flex-end" },
  bubbleTimeMe: { color: "rgba(255,255,255,0.6)" },
  suggestionsContainer: { backgroundColor: "#0A0A0A", paddingVertical: 8, borderTopWidth: 1, borderTopColor: "#1A1A1A" },
  suggestionsScroll: { paddingHorizontal: 16, gap: 8 },
  suggestionChip: { backgroundColor: "#1A1A1A", borderRadius: 20, paddingHorizontal: 14, paddingVertical: 8, borderWidth: 1, borderColor: "#1DB954" },
  suggestionText: { color: "#1DB954", fontSize: 13 },
  aiSuggestionBar: { flexDirection: "row", alignItems: "center", gap: 8, backgroundColor: "#0D2818", paddingHorizontal: 16, paddingVertical: 10, borderTopWidth: 1, borderTopColor: "#1DB954" },
  aiSuggestionText: { flex: 1, fontSize: 14, color: "#888" },
  aiSuggestionCompletion: { color: "#1DB954", fontStyle: "italic" },
  aiSuggestionTap: { color: "#1DB954", fontSize: 11, fontWeight: "600" },
  aiLoadingBar: { flexDirection: "row", alignItems: "center", gap: 8, backgroundColor: "#0A0A0A", paddingHorizontal: 16, paddingVertical: 8 },
  aiLoadingText: { color: "#555", fontSize: 12 },
  inputRow: { flexDirection: "row", alignItems: "flex-end", gap: 8, padding: 12, borderTopWidth: 1, borderTopColor: "#1A1A1A", backgroundColor: "#0A0A0A" },
  attachBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: "#1A1A1A", justifyContent: "center", alignItems: "center", borderWidth: 1, borderColor: "#2A2A2A" },
  inputWrap: { flex: 1 },
  input: { backgroundColor: "#1A1A1A", borderRadius: 20, paddingHorizontal: 16, paddingVertical: 10, fontSize: 15, color: "#FFFFFF", borderWidth: 1, borderColor: "#2A2A2A", maxHeight: 100 },
  sendBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: "#1DB954", justifyContent: "center", alignItems: "center" },
  sendBtnDisabled: { opacity: 0.4 },
  attachmentOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.7)", justifyContent: "flex-end" },
  attachmentSheet: { backgroundColor: "#1A1A1A", borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, paddingBottom: 40 },
  attachmentTitle: { color: "#FFFFFF", fontSize: 18, fontWeight: "700", marginBottom: 20, textAlign: "center" },
  attachmentGrid: { flexDirection: "row", justifyContent: "space-around" },
  attachmentBtn: { alignItems: "center", gap: 8 },
  attachmentIcon: { width: 64, height: 64, borderRadius: 20, justifyContent: "center", alignItems: "center" },
  attachmentLabel: { color: "#888", fontSize: 12, fontWeight: "500" },
  contextBanner: { flexDirection: "row", alignItems: "center", gap: 8, backgroundColor: "#1A1400", paddingHorizontal: 16, paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: "#2A2A00" },
contextBannerText: { flex: 1, color: "#FFD700", fontSize: 12, fontWeight: "500" },
});
