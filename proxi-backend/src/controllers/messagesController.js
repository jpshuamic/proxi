const pool = require("../config/database");

const sendPushToUser = async (userId, title, body, data = {}) => {
  try {
    const userRes = await pool.query("SELECT push_token FROM users WHERE id = $1", [userId]);
    const pushToken = userRes.rows[0]?.push_token;
    if (!pushToken) return;
    await fetch("https://exp.host/--/api/v2/push/send", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ to: pushToken, sound: "default", title, body, data }),
    });
  } catch (e) { console.log("Push error:", e); }
};

const getOrCreateConversation = async (userId, otherUserId, referenceId, referenceType) => {
  const existing = await pool.query(
    `SELECT * FROM conversations WHERE (participant_one = $1 AND participant_two = $2) AND (reference_id = $3 OR ($3 IS NULL AND reference_id IS NULL))`,
    [userId, otherUserId, referenceId || null]
  );
  if (existing.rows.length > 0) return existing.rows[0];
  const newConv = await pool.query(
    `INSERT INTO conversations (participant_one, participant_two, reference_id, reference_type) VALUES ($1, $2, $3, $4) RETURNING *`,
    [userId, otherUserId, referenceId || null, referenceType || null]
  );
  return newConv.rows[0];
};

const getConversations = async (req, res) => {
  try {
    const conversations = await pool.query(
      `SELECT c.*, u1.full_name as participant_one_name, u2.full_name as participant_two_name,
        CASE WHEN c.reference_type = 'listing' THEN l.title WHEN c.reference_type = 'task' THEN t.title ELSE NULL END as reference_title,
        CASE WHEN c.reference_type = 'listing' THEN l.price::text ELSE t.budget::text END as reference_price
       FROM conversations c
       JOIN users u1 ON c.participant_one = u1.id
       JOIN users u2 ON c.participant_two = u2.id
       LEFT JOIN listings l ON c.reference_id = l.id AND c.reference_type = 'listing'
       LEFT JOIN tasks t ON c.reference_id = t.id AND c.reference_type = 'task'
       WHERE c.participant_one = $1 OR c.participant_two = $1
       ORDER BY c.last_message_at DESC`,
      [req.user.id]
    );
    res.json({ success: true, conversations: conversations.rows });
  } catch (error) {
    console.error("Get conversations error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

const getMessages = async (req, res) => {
  const { conversationId } = req.params;
  try {
    await pool.query("UPDATE messages SET is_read = true WHERE conversation_id = $1 AND receiver_id = $2", [conversationId, req.user.id]);
    const messages = await pool.query(
      `SELECT m.*, u.full_name as sender_name FROM messages m JOIN users u ON m.sender_id = u.id WHERE m.conversation_id = $1 ORDER BY m.created_at ASC`,
      [conversationId]
    );
    const conv = await pool.query(
      `SELECT c.*,
        CASE WHEN c.reference_type = 'listing' THEN l.title WHEN c.reference_type = 'task' THEN t.title ELSE NULL END as reference_title,
        CASE WHEN c.reference_type = 'listing' THEN l.price::text ELSE t.budget::text END as reference_price
       FROM conversations c
       LEFT JOIN listings l ON c.reference_id = l.id AND c.reference_type = 'listing'
       LEFT JOIN tasks t ON c.reference_id = t.id AND c.reference_type = 'task'
       WHERE c.id = $1`,
      [conversationId]
    );
    res.json({ success: true, messages: messages.rows, conversation: conv.rows[0] });
  } catch (error) {
    console.error("Get messages error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

const sendMessage = async (req, res) => {
  const { receiver_id, content, reference_id, reference_type } = req.body;
  try {
    if (!receiver_id || !content) return res.status(400).json({ success: false, message: "receiver_id and content are required" });
    if (receiver_id === req.user.id) return res.status(400).json({ success: false, message: "You cannot message yourself" });
    const conversation = await getOrCreateConversation(req.user.id, receiver_id, reference_id, reference_type);
    const message = await pool.query(
      `INSERT INTO messages (conversation_id, sender_id, receiver_id, content, reference_id, reference_type) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [conversation.id, req.user.id, receiver_id, content, reference_id || null, reference_type || null]
    );
    await pool.query("UPDATE conversations SET last_message = $1, last_message_at = NOW() WHERE id = $2", [content, conversation.id]);
    const senderRes = await pool.query("SELECT full_name FROM users WHERE id = $1", [req.user.id]);
    const senderName = senderRes.rows[0]?.full_name || "Someone";
    await sendPushToUser(receiver_id, `New message from ${senderName}`, content, { type: "new_message", conversationId: conversation.id });
    res.status(201).json({ success: true, message: message.rows[0], conversation_id: conversation.id });
  } catch (error) {
    console.error("Send message error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

const startConversation = async (req, res) => {
  const { other_user_id, reference_id, reference_type, initial_message } = req.body;
  try {
    if (!other_user_id || !initial_message) return res.status(400).json({ success: false, message: "other_user_id and initial_message are required" });
    const conversation = await getOrCreateConversation(req.user.id, other_user_id, reference_id, reference_type);
    const message = await pool.query(
      `INSERT INTO messages (conversation_id, sender_id, receiver_id, content, reference_id, reference_type) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [conversation.id, req.user.id, other_user_id, initial_message, reference_id || null, reference_type || null]
    );
    await pool.query("UPDATE conversations SET last_message = $1, last_message_at = NOW() WHERE id = $2", [initial_message, conversation.id]);
    res.status(201).json({ success: true, conversation_id: conversation.id, message: message.rows[0] });
  } catch (error) {
    console.error("Start conversation error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

module.exports = { getConversations, getMessages, sendMessage, startConversation };
