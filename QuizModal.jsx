import React, { useState } from 'react';
import { quizAPI } from '../../services/api';
import { chatAPI, quizAPI } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
import '../styles/Chat.css';

const QuizModal = ({ chatId, onClose, onQuizSent }) => {
    const { currentUser } = useAuth();
    const [loading, setLoading] = useState(false);
    const [generating, setGenerating] = useState(false);
    const [selectedQuiz, setSelectedQuiz] = useState(null);
    const [quizzes, setQuizzes] = useState([]);
    const [category, setCategory] = useState('synaxarium');
    const [difficulty, setDifficulty] = useState('medium');
    const [searchTerm, setSearchTerm] = useState('');

    const categories = [
        { value: 'synaxarium', label: 'Synaxarium', icon: '⛪' },
        { value: 'gizae', label: 'Gizae', icon: '📖' },
        { value: 'holidays', label: 'Holidays', icon: '🎉' },
        { value: 'bible', label: 'Bible', icon: '📜' },
        { value: 'history', label: 'Church History', icon: '📅' }
    ];

    const difficulties = [
        { value: 'easy', label: 'Easy', color: '#28a745' },
        { value: 'medium', label: 'Medium', color: '#ffc107' },
        { value: 'hard', label: 'Hard', color: '#dc3545' }
    ];

    const loadQuizzes = async () => {
        setLoading(true);
        try {
            const response = await quizAPI.getQuestions({
                category,
                difficulty,
                limit: 20
            });
            setQuizzes(response.data.questions);
        } catch (error) {
            console.error('Error loading quizzes:', error);
        } finally {
            setLoading(false);
        }
    };

    const generateQuiz = async () => {
        setGenerating(true);
        try {
            const response = await quizAPI.generateQuiz({
                category,
                count: 5,
                difficulty
            });
            setQuizzes(prev => [...response.data.questions, ...prev]);
        } catch (error) {
            console.error('Error generating quiz:', error);
        } finally {
            setGenerating(false);
        }
    };

    const sendQuiz = async () => {
        if (!selectedQuiz) return;

        try {
            const response = await chatAPI.sendMessage(chatId, {
                contentType: 'quiz',
                quiz: {
                    question: selectedQuiz.question,
                    options: selectedQuiz.options.map(opt => opt.text),
                    correctAnswer: selectedQuiz.correctAnswer,
                    explanation: selectedQuiz.explanation
                }
            });
            onQuizSent(response.data.message);
            onClose();
        } catch (error) {
            console.error('Error sending quiz:', error);
        }
    };

    const filteredQuizzes = quizzes.filter(quiz =>
        quiz.question.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="quiz-modal-overlay" onClick={onClose}>
            <div className="quiz-modal-content" onClick={e => e.stopPropagation()}>
                <div className="quiz-modal-header">
                    <h3><i className="fas fa-question-circle"></i> Share a Quiz</h3>
                    <button className="close-btn" onClick={onClose}>
                        <i className="fas fa-times"></i>
                    </button>
                </div>

                <div className="quiz-controls">
                    <div className="control-group">
                        <label>Category</label>
                        <select value={category} onChange={(e) => setCategory(e.target.value)}>
                            {categories.map(cat => (
                                <option key={cat.value} value={cat.value}>
                                    {cat.icon} {cat.label}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className="control-group">
                        <label>Difficulty</label>
                        <select value={difficulty} onChange={(e) => setDifficulty(e.target.value)}>
                            {difficulties.map(d => (
                                <option key={d.value} value={d.value}>
                                    {d.label}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className="control-group">
                        <label>&nbsp;</label>
                        <button onClick={loadQuizzes} disabled={loading}>
                            <i className="fas fa-search"></i> Load Quizzes
                        </button>
                    </div>

                    <div className="control-group">
                        <label>&nbsp;</label>
                        <button onClick={generateQuiz} disabled={generating}>
                            <i className={`fas ${generating ? 'fa-spinner fa-spin' : 'fa-magic'}`}></i>
                            {generating ? 'Generating...' : 'Generate New'}
                        </button>
                    </div>
                </div>

                <div className="search-box">
                    <i className="fas fa-search"></i>
                    <input
                        type="text"
                        placeholder="Search quizzes..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>

                <div className="quizzes-list">
                    {loading ? (
                        <div className="loading-spinner">
                            <i className="fas fa-spinner fa-spin"></i> Loading quizzes...
                        </div>
                    ) : filteredQuizzes.length === 0 ? (
                        <div className="empty-state">
                            <i className="fas fa-question-circle"></i>
                            <p>No quizzes found. Try generating new ones!</p>
                        </div>
                    ) : (
                        filteredQuizzes.map(quiz => (
                            <div
                                key={quiz._id}
                                className={`quiz-item ${selectedQuiz?._id === quiz._id ? 'selected' : ''}`}
                                onClick={() => setSelectedQuiz(quiz)}
                            >
                                <div className="quiz-preview">
                                    <h4>{quiz.question}</h4>
                                    <div className="quiz-meta">
                                        <span className="difficulty" style={{
                                            backgroundColor: difficulties.find(d => d.value === quiz.difficulty)?.color
                                        }}>
                                            {quiz.difficulty}
                                        </span>
                                        <span className="category">
                                            {categories.find(c => c.value === quiz.category)?.icon}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>

                {selectedQuiz && (
                    <div className="selected-quiz-preview">
                        <h4>Selected Quiz</h4>
                        <div className="quiz-preview-card">
                            <p className="question">{selectedQuiz.question}</p>
                            <div className="options-preview">
                                {selectedQuiz.options.map((opt, idx) => (
                                    <div key={idx} className={`option-preview ${idx === selectedQuiz.correctAnswer ? 'correct' : ''}`}>
                                        {String.fromCharCode(65 + idx)}. {opt.text}
                                        {idx === selectedQuiz.correctAnswer && (
                                            <i className="fas fa-check-circle"></i>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                )}

                <div className="modal-actions">
                    <button 
                        className="send-btn" 
                        onClick={sendQuiz}
                        disabled={!selectedQuiz}
                    >
                        <i className="fas fa-paper-plane"></i> Send Quiz
                    </button>
                    <button className="cancel-btn" onClick={onClose}>
                        Cancel
                    </button>
                </div>
            </div>
        </div>
    );
};

export default QuizModal;