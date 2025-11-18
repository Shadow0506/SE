const Groq = require('groq-sdk').default;
require('dotenv').config();

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY
});

// Generate questions using Groq's Llama 3.3 70b model
const generateQuestions = async ({
  answerText,
  difficulty = 'medium',
  questionCount = 5,
  questionTypes = ['mcq', 'short', 'truefalse', 'application']
}) => {
  try {
    // Create a detailed prompt for question generation
    const systemPrompt = `You are an expert educational content creator. Your task is to generate high-quality exam questions based on the provided answer/content.

Generate questions in the following formats:
- MCQ: Multiple Choice Questions with 4 options (A, B, C, D) and indicate the correct answer
- Short Answer: Questions requiring brief written responses
- True/False: Statement-based questions
- Application: Scenario-based or practical application questions

Requirements:
- Generate exactly ${questionCount} questions
- Difficulty level: ${difficulty}
- Question types to include: ${questionTypes.join(', ')}
- For MCQs, include plausible distractors
- Provide hints for each question
- Extract and highlight key concepts from the answer

CRITICAL: The "correctAnswer" field MUST contain:
- For MCQ: The letter only (e.g., "A" or "B" or "C" or "D")
- For Short Answer: A complete, detailed answer text (2-5 sentences)
- For True/False: Either "True" or "False"
- For Application: A comprehensive answer with explanation (3-6 sentences)

Return the response in strict JSON format with this structure:
{
  "keyConcepts": ["concept1", "concept2", ...],
  "questions": [
    {
      "id": 1,
      "type": "mcq|short|truefalse|application",
      "difficulty": "${difficulty}",
      "question": "question text",
      "options": ["A) option1", "B) option2", "C) option3", "D) option4"], // only for MCQ
      "correctAnswer": "MUST be a letter (A/B/C/D) for MCQ, or complete answer text for other types",
      "hint": "helpful hint",
      "explanation": "why this is the correct answer"
    }
  ]
}`;

    const userPrompt = `Based on the following content, generate ${questionCount} exam questions at ${difficulty} difficulty level:

${answerText}

Remember to return ONLY valid JSON with no additional text.`;

    const completion = await groq.chat.completions.create({
      messages: [
        {
          role: 'system',
          content: systemPrompt
        },
        {
          role: 'user',
          content: userPrompt
        }
      ],
      model: 'llama-3.3-70b-versatile',
      temperature: 0.7,
      max_completion_tokens: 4096,
      top_p: 1,
      response_format: { type: 'json_object' }
    });

    const responseContent = completion.choices[0]?.message?.content;
    
    if (!responseContent) {
      throw new Error('No response from Groq API');
    }

    const parsedResponse = JSON.parse(responseContent);
    
    return {
      success: true,
      data: parsedResponse,
      usage: {
        promptTokens: completion.usage?.prompt_tokens || 0,
        completionTokens: completion.usage?.completion_tokens || 0,
        totalTokens: completion.usage?.total_tokens || 0
      }
    };

  } catch (error) {
    console.error('Groq API Error:', error);
    throw new Error(`Question generation failed: ${error.message}`);
  }
};

// Extract key concepts from text
// Extract key concepts from text
const extractKeyConcepts = async (text) => {
  try {
    const completion = await groq.chat.completions.create({
      messages: [
        {
          role: 'system',
          content: `You are an expert at analyzing educational content and extracting key concepts.
          
Extract the main concepts, keywords, and important terms from the given text.
Return your response in this exact JSON format:
{
  "concepts": ["concept1", "concept2", "concept3", ...]
}

Keep concepts concise (1-4 words each) and limit to the 10 most important concepts.`
        },
        {
          role: 'user',
          content: text
        }
      ],
      model: 'llama-3.3-70b-versatile',
      temperature: 0.3,
      max_completion_tokens: 1024,
      response_format: { type: 'json_object' }
    });

    const responseContent = completion.choices[0]?.message?.content;
    
    if (!responseContent) {
      console.error('No response from Groq API for concept extraction');
      return [];
    }

    const response = JSON.parse(responseContent);
    
    // Handle both {"concepts": [...]} and direct array formats
    if (Array.isArray(response)) {
      return response;
    } else if (response.concepts && Array.isArray(response.concepts)) {
      return response.concepts;
    } else if (response.keywords && Array.isArray(response.keywords)) {
      return response.keywords;
    } else if (response.terms && Array.isArray(response.terms)) {
      return response.terms;
    }
    
    // If we can't find concepts in expected format, try to extract from any array in response
    for (const key in response) {
      if (Array.isArray(response[key]) && response[key].length > 0) {
        return response[key];
      }
    }
    
    console.warn('Unexpected response format from concept extraction:', response);
    return [];

  } catch (error) {
    console.error('Concept extraction error:', error);
    return [];
  }
};

// Evaluate user answer using LLM for short answer and application questions
const evaluateAnswer = async ({ question, correctAnswer, userAnswer, explanation = '' }) => {
  try {
    const systemPrompt = `You are an expert exam grader. Your task is to evaluate whether a student's answer is correct by comparing it to the reference answer.

Rules for evaluation:
- Accept semantically correct answers even if worded differently
- Accept answers that convey the same meaning
- Accept partial credit for partially correct answers
- Be lenient with minor spelling or grammatical errors
- Focus on the core concepts and understanding
- Consider synonyms and alternative phrasings

Return your evaluation in strict JSON format:
{
  "isCorrect": true/false,
  "score": 0-100,
  "feedback": "brief explanation of the grading decision"
}

Score Guidelines:
- 90-100: Fully correct answer with all key points
- 70-89: Mostly correct with minor omissions
- 50-69: Partially correct, missing some key points
- 30-49: Has some correct elements but significant gaps
- 0-29: Incorrect or irrelevant answer

Consider an answer correct (isCorrect: true) if score >= 70.`;

    const userPrompt = `Question: ${question}

Reference Answer: ${correctAnswer}

${explanation ? `Additional Context: ${explanation}` : ''}

Student's Answer: ${userAnswer}

Evaluate the student's answer and return ONLY valid JSON.`;

    const completion = await groq.chat.completions.create({
      messages: [
        {
          role: 'system',
          content: systemPrompt
        },
        {
          role: 'user',
          content: userPrompt
        }
      ],
      model: 'llama-3.3-70b-versatile',
      temperature: 0.3,
      max_completion_tokens: 512,
      top_p: 1,
      response_format: { type: 'json_object' }
    });

    const responseContent = completion.choices[0]?.message?.content;
    
    if (!responseContent) {
      throw new Error('No response from Groq API');
    }

    const evaluation = JSON.parse(responseContent);
    
    return {
      success: true,
      isCorrect: evaluation.isCorrect || false,
      score: evaluation.score || 0,
      feedback: evaluation.feedback || 'No feedback available',
      usage: {
        promptTokens: completion.usage?.prompt_tokens || 0,
        completionTokens: completion.usage?.completion_tokens || 0,
        totalTokens: completion.usage?.total_tokens || 0
      }
    };

  } catch (error) {
    console.error('Answer evaluation error:', error);
    // Fallback to exact match if LLM fails
    const isExactMatch = userAnswer.trim().toLowerCase() === correctAnswer.trim().toLowerCase();
    return {
      success: false,
      isCorrect: isExactMatch,
      score: isExactMatch ? 100 : 0,
      feedback: 'AI evaluation unavailable, using exact match',
      error: error.message
    };
  }
};

module.exports = {
  generateQuestions,
  extractKeyConcepts,
  evaluateAnswer
};
