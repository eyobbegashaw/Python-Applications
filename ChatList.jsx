import React, { useState, useEffect } from 'react';
import { chatAPI } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
import CreateGroup from './CreateGroup';
import '../styles/Chat.css';

const ChatList = ({ onSelectChat }) => {
    const { currentUser } = useAuth();
    const [groups, setGroups] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [showCreateGroup, setShowCreateGroup] = useState(false);
    const [filter, setFilter] = useState('all');
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        loadGroups();
    }, []);

    const loadGroups = async () => {
        setLoading(true);
        setError(null);
        try {
            const response = await chatAPI.getGroups();
            setGroups(response.data.groups);
        } catch (err) {
            console.error('Error loading groups:', err);
            setError('Failed to load groups');
        } finally {
            setLoading(false);
        }
    };

// ChatList.jsx ውስጥ handleJoinGroup-ን በዚህ ተካው

// ChatList.jsx ውስጥ ያለውን handleJoinGroup በዚህ ተካው
const handleJoinGroup = async (groupId) => {
    try {
        const response = await chatAPI.joinGroup(groupId);
        if (response.data.pending) {
            alert('Join request sent!');
        } else {
            // ዳታቤዙ እንዲታደስ loadGroups እንጥራ
            await loadGroups(); 
            
            // እዚህ ጋር ነው ጥንቃቄ የሚያስፈልገው፡
            // አዲሱን የግሩፕ ዳታ ከ response ውስጥ ወስደን ለ Chat.jsx እንስጠው
            const joinedGroup = response.data.group;
            if (joinedGroup) {
                onSelectChat(joinedGroup);
            }
            alert('Joined group successfully!');
        }
    } catch (err) {
        console.error('Error joining group:', err);
        alert('Failed to join group');
    }
};
    const filteredGroups = groups.filter(group => {
        if (filter === 'my' && !group.isMember) return false;
        if (filter === 'public' && group.settings.isPrivate) return false;
        if (searchTerm) {
            return group.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                   group.description?.toLowerCase().includes(searchTerm.toLowerCase());
        }
        return true;
    });

    return (
        <div className="chat-list-container">
            <div className="chat-list-header">
                <h2>Discussion Groups</h2>
                {currentUser && (
                    <button 
                        className="create-group-btn"
                        onClick={() => setShowCreateGroup(true)}
                    >
                        <i className="fas fa-plus"></i> Create Group
                    </button>
                )}
            </div>

            <div className="chat-filters">
                <input
                    type="text"
                    placeholder="Search groups..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="search-input"
                />
                <div className="filter-buttons">
                    <button 
                        className={filter === 'all' ? 'active' : ''}
                        onClick={() => setFilter('all')}
                    >
                        All
                    </button>
                    <button 
                        className={filter === 'my' ? 'active' : ''}
                        onClick={() => setFilter('my')}
                    >
                        My Groups
                    </button>
                    <button 
                        className={filter === 'public' ? 'active' : ''}
                        onClick={() => setFilter('public')}
                    >
                        Public
                    </button>
                </div>
            </div>

            {loading ? (
                <div className="chat-loading">
                    <i className="fas fa-spinner fa-spin"></i> Loading groups...
                </div>
            ) : error ? (
                <div className="chat-error">
                    <i className="fas fa-exclamation-circle"></i> {error}
                </div>
            ) : (
                <div className="groups-list">
                    {filteredGroups.map(group => (
                        <div key={group._id} className="group-card">
                            <div className="group-avatar">
                                {group.avatar ? (
                                    <img src={group.avatar} alt={group.name} />
                                ) : (
                                    <div className="avatar-placeholder">
                                        {group.name.charAt(0)}
                                    </div>
                                )}
                            </div>
                            <div className="group-info">
                                <h3>{group.name}</h3>
                                <p className="group-description">{group.description}</p>
                                <div className="group-meta">
                                    <span>
                                        <i className="fas fa-users"></i> {group.memberCount} members
                                    </span>
                                    <span>
                                        <i className="fas fa-tag"></i> {group.category}
                                    </span>
                                </div>
                                <div className="group-tags">
                                    {group.tags?.map(tag => (
                                        <span key={tag} className="tag">#{tag}</span>
                                    ))}
                                </div>
                            </div>
                            <div className="group-actions">
                                {/* {group.isMember ? ( */}
                                    <button 
                                        className="chat-btn"
                                        onClick={() => onSelectChat(group)}
                                    >
                                        <i className="fas fa-comments"></i> Chat
                                    </button>
                                {/* ) : group.pendingRequest ? (
                                    <button className="pending-btn" disabled>
                                        Request Pending
                                    </button>
                                ) : (
                                    <button 
                                        className="join-btn"
                                        onClick={() => handleJoinGroup(group._id)}
                                    >
                                        <i className="fas fa-sign-in-alt"></i> Join
                                    </button>
                                )} */}
                            </div>
                        </div>
                    ))}

                    {filteredGroups.length === 0 && (
                        <div className="no-groups">
                            <i className="fas fa-comments"></i>
                            <p>No groups found</p>
                        </div>
                    )}
                </div>
            )}

            {showCreateGroup && (
                <CreateGroup 
                    onClose={() => setShowCreateGroup(false)}
                    onGroupCreated={loadGroups}
                />
            )}
        </div>
    );
};

export default ChatList;