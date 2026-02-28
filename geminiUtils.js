const { GoogleGenerativeAI } = require("@google/generative-ai");

class GeminiAPI {
    constructor() {
        if (!process.env.GEMINI_API_KEY) {
            throw new Error("GEMINI_API_KEY is not set");
        }

        const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
 
        // ✅ Use a stable model that works
        this.model = genAI.getGenerativeModel({
            model: "gemini-1.5-flash"
        });
    }
    async generateContent(prompt) {
        try {
            const result = await this.model.generateContent(prompt);
            const response = await result.response;
            const text = response.text();
            
          
            return {
                candidates: [{
                    content: { parts: [{ text: text }] }
                }]
            };
        } catch (error) {
            console.error('Gemini SDK Detail Error:', error.message);
             
            throw error;
        }
    }

 async generateQuiz(category, count = 15, difficulty = 'medium', context = {}) {
        let prompt = '';
        
        switch(category) {
            case 'synaxarium':
                prompt = this.buildSynaxariumPrompt(count, difficulty, context);
                break;
            case 'gizae':
                prompt = this.buildGizaePrompt(count, difficulty, context);
                break;
            case 'holidays':
                prompt = this.buildHolidaysPrompt(count, difficulty, context);
                break;
            case 'bible':
                prompt = this.buildBiblePrompt(count, difficulty, context);
                break;
            default:
                prompt = this.buildGeneralPrompt(count, difficulty);
        }

        try {
            const response = await this.generateContent(prompt);
            return this.parseQuizResponse(response, category);
        } catch (error) {
            console.error('Quiz generation error:', error);
            return this.getFallbackQuestions(category, count);
        }
    }

    buildSynaxariumPrompt(count, difficulty, context) {
        const { month, day, saint } = context;
        return `Generate ${count} multiple choice questions about Ethiopian Orthodox saints and the Synaxarium.
        
Context:
${month ? `- Month: ${month}` : ''}
${day ? `- Day: ${day}` : ''}
${saint ? `- Specific saint: ${saint}` : ''}

Requirements:
- Questions should be ${difficulty} difficulty
- Each question must have 4 options with exactly one correct answer
- Include questions about saints' lives, miracles, feast days, and significance
- Provide brief explanations for correct answers
- Include some questions in Amharic script where appropriate

Format the response as a JSON array with this structure:
[
  {
    "question": "Question text in English",
    "questionAmharic": "Question text in Amharic (optional)",
    "options": [
      {"text": "Option 1", "textAmharic": "አማርኛ አማራጭ 1"},
      {"text": "Option 2", "textAmharic": "አማርኛ አማራጭ 2"},
      {"text": "Option 3", "textAmharic": "አማርኛ አማራጭ 3"},
      {"text": "Option 4", "textAmharic": "አማርኛ አማራጭ 4"}
    ],
    "correctAnswer": 0,
    "explanation": "Explanation of the correct answer",
    "explanationAmharic": "ማብራሪያ በአማርኛ",
    "saint": "Name of saint if applicable",
    "feastDay": {"month": 1, "day": 1}
  }
]

Make questions engaging and educational. Include a mix of easy and challenging questions appropriate for ${difficulty} level.`;
    }

    buildGizaePrompt(count, difficulty, context) {
        const { month, day, book } = context;
        return `Generate ${count} multiple choice questions about Ethiopian Orthodox daily readings (ግጻዊ).
        
Context:
${month ? `- Month: ${month}` : ''}
${day ? `- Day: ${day}` : ''}
${book ? `- Specific book: ${book}` : ''}

Requirements:
- Questions should be ${difficulty} difficulty
- Focus on Biblical passages, interpretations, and liturgical readings
- Include questions about both Old and New Testament
- Reference specific verses and chapters
- Provide theological context and interpretations

Format the response as a JSON array with this structure:
[
  {
    "question": "Question text",
    "questionAmharic": "የጥያቄ ጽሑፍ",
    "options": [
      {"text": "Option 1", "textAmharic": "አማራጭ 1"},
      {"text": "Option 2", "textAmharic": "አማራጭ 2"},
      {"text": "Option 3", "textAmharic": "አማራጭ 3"},
      {"text": "Option 4", "textAmharic": "አማራጭ 4"}
    ],
    "correctAnswer": 0,
    "explanation": "Explanation",
    "explanationAmharic": "ማብራሪያ",
    "reference": "Bible reference (e.g., John 1:1)",
    "book": "Book of the Bible"
  }
]`;
    }

    buildHolidaysPrompt(count, difficulty, context) {
        return `Generate ${count} multiple choice questions about Ethiopian Orthodox holidays and feasts.
        
Requirements:
- Questions should be ${difficulty} difficulty
- Cover major feasts (Easter, Christmas, Epiphany, Meskel, etc.)
- Include questions about fasting periods and traditions
- Cover both fixed and movable feasts
- Include historical and cultural significance

Format the response as a JSON array with appropriate structure.`;
    }

    buildBiblePrompt(count, difficulty, context) {
        return `Generate ${count} multiple choice questions about the Bible from an Ethiopian Orthodox perspective.
        
Requirements:
- Questions should be ${difficulty} difficulty
- Include questions from both Old and New Testaments
- Cover key events, people, and teachings
- Reference the Ethiopian Orthodox canon
- Include questions about Biblical interpretations

Format the response as a JSON array with appropriate structure.`;
    }

    buildGeneralPrompt(count, difficulty) {
        return `Generate ${count} multiple choice questions about Ethiopian Orthodox Church traditions, history, and practices.
        
Requirements:
- Questions should be ${difficulty} difficulty
- Cover a mix of topics: saints, liturgy, history, traditions
- Include both English and Amharic where appropriate
- Provide educational explanations

Format the response as a JSON array.`;
    }

    parseQuizResponse(response, category) {
        try {
            const text = response.candidates[0].content.parts[0].text;
            // Extract JSON from the response
            const jsonMatch = text.match(/\[[\s\S]*\]/);
            if (jsonMatch) {
                const questions = JSON.parse(jsonMatch[0]);
                return questions.map(q => ({
                    ...q,
                    category,
                    source: 'gemini',
                    createdAt: new Date()
                }));
            }
            throw new Error('No JSON found in response');
        } catch (error) {
            console.error('Error parsing quiz response:', error);
            return null;
        }
    }

    getFallbackQuestions(category, count) {
        // Provide fallback questions if API fails
        const fallbacks = {
            synaxarium: [
                {
                    question: "Who is considered the patron saint of Ethiopia?",
                    questionAmharic: "የኢትዮጵያ ረዳት ቅዱስ ማን ነው?",
                    options: [
                        { text: "St. George", textAmharic: "ቅዱስ ጊዮርጊስ" },
                        { text: "St. Mary", textAmharic: "ቅድስት ማርያም" },
                        { text: "St. Michael", textAmharic: "ቅዱስ ሚካኤል" },
                        { text: "St. Tekle Haimanot", textAmharic: "ቅዱስ ተክለ ሃይማኖት" }
                    ],
                    correctAnswer: 0,
                    explanation: "St. George (ቅዱስ ጊዮርጊስ) is widely venerated as the patron saint of Ethiopia.",
                    explanationAmharic: "ቅዱስ ጊዮርጊስ የኢትዮጵያ ረዳት ቅዱስ ተብሎ ይከበራል።"
                }
            ],
            gizae: [
                {
                    question: "Which Gospel begins with 'In the beginning was the Word'?",
                    options: [
                        { text: "Matthew" },
                        { text: "Mark" },
                        { text: "Luke" },
                        { text: "John" }
                    ],
                    correctAnswer: 3,
                    explanation: "The Gospel of John begins with this profound theological statement about the pre-existence of Christ."
                }
            ],
            holidays: [
                {
                    question: "When is Ethiopian Christmas (Genna) celebrated?",
                    options: [
                        { text: "December 25" },
                        { text: "January 7" },
                        { text: "January 19" },
                        { text: "February 2" }
                    ],
                    correctAnswer: 1,
                    explanation: "Ethiopian Christmas (ገና) is celebrated on January 7 (Tahsas 29 in Ethiopian calendar)."
                }
            ]
        };

        const source = fallbacks[category] || fallbacks.synaxarium;
        const questions = [];
        
        for (let i = 0; i < Math.min(count, source.length * 3); i++) {
            const baseQuestion = source[i % source.length];
            questions.push({
                ...baseQuestion,
                _id: `fallback-${Date.now()}-${i}`,
                category,
                source: 'fallback'
            });
        }
        
        return questions;
    }

async generateSaintsInfo(saintName) {
        const prompt = `Provide detailed information about the Ethiopian Orthodox saint: ${saintName}
        
Include:
- Brief biography
- Key events in their life
- Miracles attributed to them
- Feast day
- Significance in Ethiopian Orthodox tradition
- Iconography and symbols

Format the response as JSON with fields: biography, miracles, feastDay, significance, iconography.`;

        try {
            const response = await this.generateContent(prompt);
            return this.parseTextResponse(response);
        } catch (error) {
            console.error('Error generating saint info:', error);
            return null;
        }
    }

    async generateHolidayInfo(holidayName) {
        const prompt = `Provide detailed information about the Ethiopian Orthodox holiday: ${holidayName}
        
Include:
- Date and duration
- Biblical or historical basis
- Traditions and customs
- Liturgical practices
- Foods and special observances
- Significance for believers

Format the response as JSON.`;

        try {
            const response = await this.generateContent(prompt);
            return this.parseTextResponse(response);
        } catch (error) {
            console.error('Error generating holiday info:', error);
            return null;
        }
    }

    parseTextResponse(response) {
        try {
            const text = response.candidates[0].content.parts[0].text;
            const jsonMatch = text.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
                return JSON.parse(jsonMatch[0]);
            }
            return { text };
        } catch (error) {
            console.error('Error parsing text response:', error);
            return { text: response.candidates[0].content.parts[0].text };
        }
    }
}

module.exports = new GeminiAPI();
