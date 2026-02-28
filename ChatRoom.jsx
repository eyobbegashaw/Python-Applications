import React, { useState, useEffect, useRef } from 'react';
import { chatAPI } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
import '../styles/Chat.css';

const ChatRoom = ({ group, onBack }) => {
    const { currentUser } = useAuth();
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');
    const [loading, setLoading] = useState(true);
    const [sending, setSending] = useState(false);
    const [showPollModal, setShowPollModal] = useState(false);
    const [showQuizModal, setShowQuizModal] = useState(false);
    const messagesEndRef = useRef(null);
    const fileInputRef = useRef(null);

    useEffect(() => {
        if (group) {
            loadMessages();
            // Set up polling for new messages (every 5 seconds)
            const interval = setInterval(loadMessages, 5000);
            return () => clearInterval(interval);
        }
    }, [group]);

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

const loadMessages = async () => {
    // chatId ከሌለ _id ን እንዲጠቀም ማድረግ
    const targetId = group.chatId || group._id;
    
    if (!targetId) return;

    try {
        const response = await chatAPI.getMessages(targetId);
        setMessages(response.data.messages);
    } catch (err) {
        console.error('Error loading messages:', err);
    } finally {
        setLoading(false);
    }
};
    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

 const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || sending) return;

    const targetId = group.chatId || group._id; // እዚህ ጋርም አስተካክለው

    setSending(true);
    try {
        const response = await chatAPI.sendMessage(targetId, {
            content: newMessage,
            contentType: 'text'
        });
        // ... የቀረው ኮድ ይቀጥላል
            
            setMessages(prev => [...prev, response.data.message]);
            setNewMessage('');
        } catch (err) {
            console.error('Error sending message:', err);
            alert('Failed to send message');
        } finally {
            setSending(false);
        }
    };

    const handleFileUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        // Here you would upload to a cloud storage and get URL
        // For now, we'll simulate with a local URL
        const reader = new FileReader();
        reader.onload = async (event) => {
            try {
                await chatAPI.sendMessage(group.chatId, {
                    content: file.name,
                    contentType: file.type.startsWith('image/') ? 'image' : 'file',
                    attachments: [{
                        url: event.target.result,
                        type: file.type
                    }]
                });
                loadMessages();
            } catch (err) {
                console.error('Error uploading file:', err);
            }
        };
        reader.readAsDataURL(file);
    };

    const handleReaction = async (messageId, reaction) => {
        try {
            await chatAPI.addReaction(group.chatId, messageId, { reaction });
            loadMessages();
        } catch (err) {
            console.error('Error adding reaction:', err);
        }
    };

    const formatTime = (timestamp) => {
        const date = new Date(timestamp);
        const now = new Date();
        const diff = now - date;

        if (diff < 60000) return 'Just now';
        if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
        if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
        return date.toLocaleDateString();
    };

    const renderMessage = (msg) => {
        const isOwnMessage = msg.sender._id === currentUser?.id;

        return (
            <div 
                key={msg._id} 
                className={`message ${isOwnMessage ? 'own' : ''}`}
            >
                {!isOwnMessage && (
                    <div className="message-sender">
                        <img 
                            src={msg.sender.avatar || '/default-avatar.png'} 
                            alt={msg.sender.username}
                        />
                    </div>
                )}
                <div className="message-content">
                    {!isOwnMessage && (
                        <div className="sender-name">{msg.sender.username}</div>
                    )}
                    
                    {msg.contentType === 'text' && (
                        <div className="message-text">{msg.content}</div>
                    )}

                    {msg.contentType === 'image' && msg.attachments?.map(att => (
                        <img 
                            key={att.url} 
                            src={att.url} 
                            alt="Shared" 
                            className="message-image"
                        />
                    ))}

                    {msg.contentType === 'poll' && msg.poll && (
                        <PollMessage poll={msg.poll} messageId={msg._id} />
                    )}

                    {msg.contentType === 'quiz' && msg.quiz && (
                        <QuizMessage quiz={msg.quiz} />
                    )}

                    <div className="message-footer">
                        <span className="message-time">{formatTime(msg.createdAt)}</span>
                        {msg.readBy?.length > 1 && (
                            <span className="read-receipt">
                                <i className="fas fa-check-double"></i> {msg.readBy.length - 1}
                            </span>
                        )}
                    </div>

                    <div className="message-reactions">
                        {msg.reactions?.map((reaction, idx) => (
                            <button
                                key={idx}
                                className="reaction-btn"
                                onClick={() => handleReaction(msg._id, reaction.reaction)}
                            >
                                {reaction.reaction} {reaction.count || 1}
                            </button>
                        ))}
                        <button 
                            className="add-reaction"
                            onClick={() => handleReaction(msg._id, '👍')}
                        >
                            <i className="fas fa-plus"></i>
                        </button>
                    </div>
                </div>
                {isOwnMessage && (
                    <div className="message-sender">
                        <img 
                            src={currentUser.avatar || '/default-avatar.png'} 
                            alt={currentUser.username}
                        />
                    </div>
                )}
            </div>
        );
    };

    return (
        <div className="chat-room">
            <div className="chat-room-header">
                <button className="back-btn" onClick={onBack}>
                    <i className="fas fa-arrow-left"></i>
                </button>
                <div className="group-info">
                    <h3>{group.name}</h3>
                    <p>{group.memberCount} members</p>
                </div>
                <div className="chat-actions">
                    <button onClick={() => setShowPollModal(true)}>
                        <i className="fas fa-poll"></i>
                    </button>
                    <button onClick={() => setShowQuizModal(true)}>
                        <i className="fas fa-question-circle"></i>
                    </button>
                    <button onClick={() => fileInputRef.current.click()}>
                        <i className="fas fa-paperclip"></i>
                    </button>
                    <input
                        type="file"
                        ref={fileInputRef}
                        onChange={handleFileUpload}
                        style={{ display: 'none' }}
                    />
                </div>
            </div>

            <div className="messages-container">
                {loading ? (
                    <div className="messages-loading">
                        <i className="fas fa-spinner fa-spin"></i>
                    </div>
                ) : (
                    <>
                        {messages.map(renderMessage)}
                        <div ref={messagesEndRef} />
                    </>
                )}
            </div>

            <form className="message-input-form" onSubmit={handleSendMessage}>
                <input
                    type="text"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder="Type a message..."
                    className="message-input"
                />
                <button type="submit" disabled={sending || !newMessage.trim()}>
                    <i className={`fas ${sending ? 'fa-spinner fa-spin' : 'fa-paper-plane'}`}></i>
                </button>
            </form>

            {showPollModal && (
                <PollModal 
                    chatId={group.chatId}
                    onClose={() => setShowPollModal(false)}
                    onPollCreated={loadMessages}
                />
            )}

            {showQuizModal && (
                <QuizModal 
                    chatId={group.chatId}
                    onClose={() => setShowQuizModal(false)}
                    onQuizSent={loadMessages}
                />
            )}
        </div>
    );
};

// Poll Message Component
const PollMessage = ({ poll, messageId }) => {
    const { currentUser } = useAuth();
    const [voted, setVoted] = useState(false);

    const handleVote = async (optionIndex) => {
        try {
            await chatAPI.votePoll(messageId, { optionIndex });
            setVoted(true);
        } catch (err) {
            console.error('Error voting:', err);
        }
    };

    const totalVotes = poll.options.reduce((sum, opt) => sum + opt.votes.length, 0);

    return (
        <div className="poll-message">
            <h4>{poll.question}</h4>
            {poll.options.map((opt, idx) => {
                const percentage = totalVotes ? (opt.votes.length / totalVotes) * 100 : 0;
                const hasVoted = opt.votes.includes(currentUser?.id);

                return (
                    <div key={idx} className="poll-option">
                        <button
                            onClick={() => handleVote(idx)}
                            disabled={voted || poll.endsAt < new Date()}
                            className={hasVoted ? 'voted' : ''}
                        >
                            <span className="option-text">{opt.text}</span>
                            <span className="vote-count">{opt.votes.length} votes</span>
                        </button>
                        <div className="poll-bar" style={{ width: `${percentage}%` }}></div>
                    </div>
                );
            })}
            <div className="poll-footer">
                <span>Total votes: {totalVotes}</span>
                {poll.endsAt && (
                    <span>Ends: {new Date(poll.endsAt).toLocaleString()}</span>
                )}
            </div>
        </div>
    );
};

// Quiz Message Component
const QuizMessage = ({ quiz }) => {
    const [showAnswer, setShowAnswer] = useState(false);

    return (
        <div className="quiz-message">
            <div className="quiz-question">{quiz.question}</div>
            <div className="quiz-options">
                {quiz.options.map((opt, idx) => (
                    <div key={idx} className="quiz-option">
                        {opt}
                        {showAnswer && idx === quiz.correctAnswer && (
                            <span className="correct-badge">✓ Correct</span>
                        )}
                    </div>
                ))}
            </div>
            <button onClick={() => setShowAnswer(!showAnswer)}>
                {showAnswer ? 'Hide Answer' : 'Show Answer'}
            </button>
        </div>
    );
};

export default ChatRoom;