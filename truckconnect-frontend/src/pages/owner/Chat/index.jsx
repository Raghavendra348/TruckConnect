import React, { useState, useEffect, useRef } from 'react';
import { useSelector } from 'react-redux';
import { conversationsAPI } from '../../../services/api';
import Button from '../../../components/Button';
import Loading from '../../../components/Loading';
import ErrorMessage from '../../../components/ErrorMessage';
import { formatCurrency, formatDate } from '../../../utils/formatters';
import './index.css';

const OwnerChat = () => {
  const { user } = useSelector((state) => state.auth);

  const [conversations, setConversations] = useState([]);
  const [activeConversation, setActiveConversation] = useState(null);
  const [messages, setMessages] = useState([]);

  const [isLoadingConversations, setIsLoadingConversations] = useState(true);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [newMessageText, setNewMessageText] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  const messagesEndRef = useRef(null);

  useEffect(() => {
    fetchConversations();
  }, []);

  useEffect(() => {
    if (activeConversation) {
      fetchMessages(activeConversation.id);
    }
  }, [activeConversation]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const fetchConversations = async () => {
    setIsLoadingConversations(true);
    setErrorMessage('');
    try {
      const response = await conversationsAPI.getConversations();
      const data = response.data;
      const list = Array.isArray(data) ? data : data.results || data.data || [];
      setConversations(list);
      if (list.length > 0 && !activeConversation) {
        setActiveConversation(list[0]);
      }
    } catch (error) {
      setErrorMessage('Unable to load discussions with shippers.');
    } finally {
      setIsLoadingConversations(false);
    }
  };

  const fetchMessages = async (convId) => {
    setIsLoadingMessages(true);
    try {
      const response = await conversationsAPI.getMessages(convId);
      const data = response.data;
      setMessages(Array.isArray(data) ? data : data.results || data.data || []);
      try {
        await conversationsAPI.markMessagesRead(convId);
      } catch (e) {
        // ignore
      }
    } catch (error) {
      setMessages([]);
    } finally {
      setIsLoadingMessages(false);
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessageText.trim() || !activeConversation) return;

    const textToSend = newMessageText.trim();
    setNewMessageText('');
    setIsSending(true);

    try {
      const response = await conversationsAPI.sendMessage(activeConversation.id, {
        message: textToSend,
      });

      setMessages((prev) => [...prev, response.data]);
    } catch (error) {
      setErrorMessage('Failed to send message. Please retry.');
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="owner-chat-page">
      <div className="page-header">
        <div className="header-left">
          <h1>Shipper Chat & Rate Negotiation</h1>
          <p>Communicate directly with freight shippers regarding schedules, pickup, and rates.</p>
        </div>
      </div>

      <ErrorMessage message={errorMessage} />

      <div className="chat-layout-card">
        {/* Left Panel: Conversations */}
        <div className="chat-sidebar-panel">
          <div className="chat-panel-header">
            <h3>Active Conversations ({conversations.length})</h3>
          </div>

          {isLoadingConversations ? (
            <Loading message="Loading discussions..." />
          ) : conversations.length === 0 ? (
            <div className="no-chats-sidebar">
              <p>No active conversations yet. Submit offers to open negotiation threads.</p>
            </div>
          ) : (
            <div className="conversation-list-scroll">
              {conversations.map((conv) => {
                const isSelected = activeConversation?.id === conv.id;
                const shipperName =
                  conv.load?.customer?.company_name ||
                  conv.load?.customer?.full_name ||
                  'Shipper';

                return (
                  <div
                    key={conv.id}
                    className={`conversation-item ${isSelected ? 'selected-conv' : ''}`}
                    onClick={() => setActiveConversation(conv)}
                  >
                    <div className="conv-avatar">📦</div>
                    <div className="conv-meta">
                      <div className="conv-title-row">
                        <strong className="conv-partner">{shipperName}</strong>
                      </div>
                      <span className="conv-route">
                        {conv.load?.pickup_location} ➔ {conv.load?.destination}
                      </span>
                      <span className="conv-offer-price">
                        Bid: {formatCurrency(conv.offer?.offered_price)}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Right Panel: Messages Thread */}
        <div className="chat-main-panel">
          {activeConversation ? (
            <>
              <div className="chat-thread-header">
                <div className="thread-partner-details">
                  <h4>
                    {activeConversation.load?.customer?.company_name ||
                      activeConversation.load?.customer?.full_name ||
                      'Shipper Customer'}
                  </h4>
                  <span className="thread-load-badge">
                    Load #{activeConversation.load?.id} ({activeConversation.load?.pickup_location} ➔{' '}
                    {activeConversation.load?.destination})
                  </span>
                </div>
                <div className="thread-offer-badge">
                  <span>Your Bid: {formatCurrency(activeConversation.offer?.offered_price)}</span>
                </div>
              </div>

              <div className="chat-messages-container">
                {isLoadingMessages ? (
                  <Loading message="Loading chat thread..." />
                ) : messages.length === 0 ? (
                  <div className="chat-empty-thread">
                    <p>No messages sent yet in this negotiation thread.</p>
                    <span>Write to the shipper regarding route timelines or truck readiness.</span>
                  </div>
                ) : (
                  messages.map((msg) => {
                    const isOwnMessage =
                      msg.sender?.id === user?.id || msg.sender === user?.id;

                    return (
                      <div
                        key={msg.id}
                        className={`chat-bubble-wrapper ${isOwnMessage ? 'own-bubble-wrap' : 'partner-bubble-wrap'}`}
                      >
                        <div className={`chat-bubble ${isOwnMessage ? 'own-bubble' : 'partner-bubble'}`}>
                          <p className="bubble-text">{msg.message}</p>
                          <span className="bubble-time">{formatDate(msg.created_at)}</span>
                        </div>
                      </div>
                    );
                  })
                )}
                <div ref={messagesEndRef} />
              </div>

              <form onSubmit={handleSendMessage} className="chat-input-bar">
                <input
                  type="text"
                  placeholder="Type a message to the shipper..."
                  value={newMessageText}
                  onChange={(e) => setNewMessageText(e.target.value)}
                  disabled={isSending}
                  className="chat-text-input"
                />
                <Button
                  type="submit"
                  variant="primary"
                  size="md"
                  isLoading={isSending}
                  disabled={!newMessageText.trim()}
                >
                  Send
                </Button>
              </form>
            </>
          ) : (
            <div className="chat-empty-thread">
              <p>Select a shipper thread to view and send messages.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default OwnerChat;
