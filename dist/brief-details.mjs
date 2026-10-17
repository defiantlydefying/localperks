import { escapeHTML as e } from './domain.mjs';
export function questionFields(questions = []) {
  if (!questions.length) return '';
  return `<section class="callout brief-questions" aria-labelledby="questions-heading"><h3 id="questions-heading">A few details for your creator</h3><p>Answer Gemma’s questions here. Your answers appear on the opportunity and in the collaboration. You can leave an answer blank to discuss it with the creator.</p>${questions.map((question, index) => `<label for="brief-answer-${index}">${e(question)}</label><textarea id="brief-answer-${index}" name="answer_${index}" maxlength="1500" placeholder="Your answer (optional)"></textarea>`).join('')}</section>`;
}
export function collectAnswers(questions = [], data = {}) {
  return questions.map((question, index) => ({
    question,
    answer: String(data[`answer_${index}`] || '').trim(),
  }));
}
export function briefDetailsHTML(answers = []) {
  if (!Array.isArray(answers) || !answers.length) return '';
  return `<section class="brief-details"><h3>Details from the business</h3><dl>${answers.map(item => `<dt>${e(item.question)}</dt><dd>${item.answer ? e(item.answer) : '<span class="form-hint">To discuss with the creator.</span>'}</dd>`).join('')}</dl></section>`;
}
