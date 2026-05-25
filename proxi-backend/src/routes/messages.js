const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/auth");
const { getConversations, getMessages, sendMessage, startConversation } = require("../controllers/messagesController");

router.get("/", protect, getConversations);
router.get("/:conversationId", protect, getMessages);
router.post("/send", protect, sendMessage);
router.post("/start", protect, startConversation);

module.exports = router;
