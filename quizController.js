const Quiz = require('../models/Quiz');
const QuizAttempt = require('../models/QuizAttempt');
const geminiAPI = require('../utils/geminiUtils'); // ትክክለኛው ፋይል እዚህ ጋር ነው የሚጠራው

// Generate quiz from Gemini API
const generateQuiz = async (req, res) => {
    try {
        const { category, count = 15, difficulty = 'medium', date, language = 'english' } = req.body;

        const today = new Date();
        const context = date || { 
            month: today.getMonth() + 1, 
            day: today.getDate() 
        };

        console.log(`🚀 Generating ${category} quiz using the updated GeminiUtils...`);

        // እዚህ ጋር ነው ስራው ለ geminiUtils የሚሰጠው
        const questions = await geminiAPI.generateQuiz(category, count, difficulty, context);

        if (!questions || questions.length === 0) {
            throw new Error('ጥያቄዎችን ማመንጨት አልተቻለም');
        }

        // Save questions to database
        const savedQuestions = [];
        for (const q of questions) {
            const quiz = new Quiz({
                question: q.question,
                options: q.options.map((opt, idx) => ({
                    text: typeof opt === 'object' ? opt.text : (opt || `Option ${idx + 1}`),
                    isCorrect: idx === q.correctAnswer
                })),
                category,
                difficulty,
                explanation: q.explanation || 'No explanation provided',
                source: q.source || 'gemini',
                metadata: { ...context, language }
            });
            
            await quiz.save();
            savedQuestions.push(quiz);
        }

        res.json({
            success: true,
            questions: savedQuestions,
            count: savedQuestions.length,
            source: savedQuestions[0]?.source || 'api'
        });

    } catch (error) {
        console.error('Quiz generation error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to generate quiz',
            error: error.message
        });
    }
};

const generateFallbackQuestions = (category, count, language = 'english') => {
    // English fallbacks
    const englishFallbacks = {
        synaxarium: [
            {
                question: "Who is known as the 'Patron Saint of Ethiopia'?",
                options: ["St. George", "St. Mary", "St. Michael", "St. Tekle Haimanot"],
                correctAnswer: 0,
                explanation: "St. George (ቅዱስ ጊዮርጊስ) is widely venerated as the patron saint of Ethiopia."
            },
            {
                question: "Which saint stood on one leg for 27 years in prayer?",
                options: ["St. Tekle Haimanot", "St. Yared", "St. Gebre Menfes Qidus", "St. Samuel"],
                correctAnswer: 0,
                explanation: "St. Tekle Haimanot (ቅዱስ ተክለ ሃይማኖት) is known for praying on one leg for 27 years."
            }
        ],
        gizae: [
            {
                question: "Which Gospel begins with 'In the beginning was the Word'?",
                options: ["Matthew", "Mark", "Luke", "John"],
                correctAnswer: 3,
                explanation: "The Gospel of John begins with this profound theological statement about the pre-existence of Christ."
            }
        ],
        holidays: [
            {
                question: "When is Ethiopian Christmas (Genna) celebrated?",
                options: ["December 25", "January 7", "January 19", "February 2"],
                correctAnswer: 1,
                explanation: "Ethiopian Christmas (ገና) is celebrated on January 7 (Tahsas 29 in Ethiopian calendar)."
            }
        ]
    };

    // Amharic fallbacks
    const amharicFallbacks = {
        synaxarium: [
            {
                question: "የኢትዮጵያ ዋነኛ ቅዱስ ማን ነው?",
                options: ["ቅዱስ ጊዮርጊስ", "ቅድስት ማርያም", "ቅዱስ ሚካኤል", "ቅዱስ ተክለ ሃይማኖት"],
                correctAnswer: 0,
                explanation: "ቅዱስ ጊዮርጊስ የኢትዮጵያ ዋነኛ ቅዱስ ተደርጎ ይከበራል።"
            },
            {
                question: "የትኛው ቅዱስ ለ27 ዓመታት በአንድ እግሩ ቆሞ ጸለየ?",
                options: ["ቅዱስ ተክለ ሃይማኖት", "ቅዱስ ያሬድ", "ቅዱስ ገብረ መንፈስ ቅዱስ", "ቅዱስ ሳሙኤል"],
                correctAnswer: 0,
                explanation: "ቅዱስ ተክለ ሃይማኖት ለ27 ዓመታት በአንድ እግሩ ቆሞ በመጸለዩ ይታወቃል።"
            }
        ],
        gizae: [
            {
                question: "የትኛው ወንጌል 'በመጀመሪያ ቃል ነበረ' በሚለው ይጀምራል?",
                options: ["ማቴዎስ", "ማርቆስ", "ሉቃስ", "ዮሐንስ"],
                correctAnswer: 3,
                explanation: "የዮሐንስ ወንጌል በዚህ ጥልቅ የሥነ-መለኮት መግለጫ ይጀምራል።"
            }
        ],
        holidays: [
            {
                question: "የኢትዮጵያ ገና (ልደት) መቼ ይከበራል?",
                options: ["ታህሳስ 29", "ጥር 7", "የካቲት 2", "መጋቢት 2"],
                correctAnswer: 0,
                explanation: "የኢትዮጵያ ገና በታህሳስ 29 ይከበራል።"
            }
        ]
    };

    const fallbackSet = language === 'amharic' ? amharicFallbacks : englishFallbacks;
    const source = fallbackSet[category] || fallbackSet.synaxarium;
    
    const questions = [];
    for (let i = 0; i < count; i++) {
        const sourceIndex = i % source.length;
        questions.push({...source[sourceIndex]});
    }
    
    return questions;
};

// Get quiz questions by category
const getQuizQuestions = async (req, res) => {
    try {
        const { category, difficulty, limit = 15 } = req.query;
        
        const query = {};
        if (category) query.category = category;
        if (difficulty) query.difficulty = difficulty;
        
        const questions = await Quiz.find(query)
            .sort({ usedCount: 1 })
            .limit(parseInt(limit));
        
        res.json({
            success: true,
            questions
        });
    } catch (error) {
        console.error('Error fetching quiz questions:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch quiz questions'
        });
    }
};

// Submit quiz attempt
const submitQuizAttempt = async (req, res) => {
    try {
        // Check if user is authenticated
        if (!req.user || !req.user.id) {
            return res.status(401).json({
                success: false,
                message: 'User not authenticated'
            });
        }

        const { answers, score, totalQuestions, timeSpent, category } = req.body;
        
        // Validate required fields
        if (!answers || score === undefined || !totalQuestions || !category) {
            return res.status(400).json({
                success: false,
                message: 'Missing required fields'
            });
        }

        const attempt = new QuizAttempt({
            userId: req.user.id,
            answers,
            score,
            totalQuestions,
            timeSpent: timeSpent || 0,
            category
        });
        
        await attempt.save();
        
        // Update used count for questions (optional, don't fail if this doesn't work)
        try {
            for (const answer of answers) {
                if (answer.questionId) {
                    await Quiz.findByIdAndUpdate(answer.questionId, {
                        $inc: { usedCount: 1 }
                    });
                }
            }
        } catch (updateError) {
            console.warn('Error updating question counts:', updateError);
            // Continue - this is not critical
        }
        
        res.json({
            success: true,
            attempt
        });
    } catch (error) {
        console.error('Error submitting quiz attempt:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to submit quiz attempt'
        });
    }
};

// Get user's quiz history
const getQuizHistory = async (req, res) => {
    try {
        // Check if user is authenticated
        if (!req.user || !req.user.id) {
            return res.status(401).json({
                success: false,
                message: 'User not authenticated'
            });
        }

        const attempts = await QuizAttempt.find({ userId: req.user.id })
            .sort({ completedAt: -1 })
            .limit(50);
        
        res.json({
            success: true,
            attempts
        });
    } catch (error) {
        console.error('Error fetching quiz history:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch quiz history'
        });
    }
};

module.exports = {
    generateQuiz,
    getQuizQuestions,
    submitQuizAttempt,
    getQuizHistory
};
