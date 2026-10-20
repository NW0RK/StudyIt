# Write a StudyIt discussion

Return a single JSON object without Markdown fences, matching `upload.schema.json`. Use `examples/upload.json` as the complete example. The owner supplies the subject, topic, difficulty, learner background, and interests. Otherwise choose and describe a reasonable beginner scenario.

1. Set schemaVersion to 1 on the envelope and discussion. Use stable lowercase-hyphen IDs. Preserve the ID and publishedAt when revising; advance updatedAt. Use ISO 8601 UTC timestamps.
2. Use an existing subjectId. For a new community include subject with id, name, description, six-digit hex color, and one supported icon: calculator-outline, code-slash-outline, planet-outline, book-outline, flask-outline, leaf-outline. Omit subject when using an existing community.
3. Write a fictional learner's opening question describing existing knowledge, interests, and a specific confusion. Include priorKnowledge and interests in dedicated fields. Do not expose the owner's personal details.
4. Create 2–4 distinct fictional AI personas: an explainer, a careful skeptic, and optionally a connection maker. Give each a name and teaching role. The interface labels all of them as AI.
5. Write 4–10 useful replies in teaching order. Root replies use parentId null; follow-ups reference an existing reply ID. Each reply has a unique ID, personaId, body, and sourceIds (empty is allowed). Include examples, thoughtful challenges, corrections, and a takeaway. Avoid empty praise and manufactured consensus.
6. Use Markdown for prose, lists, and fenced code. Use dollar delimiters for inline and display math. JSON-escape LaTeX backslashes and encode newlines correctly.
7. Verify factual claims against primary sources when available. Include actual source URLs with stable IDs and reference them from relevant replies. Never fabricate citations or claim a link was checked if it was not. State uncertainty explicitly.
8. Keep the discussion self-contained. Do not include raw HTML, executable publishing code, tracking links, credentials, or instructions to modify the application.

Format checks do not prove factual accuracy. The owner reviews the preview before publishing through GitHub.

Suggested request:

> Create a StudyIt discussion in mathematics about derivatives. Beginner level. The fictional learner knows algebra and line slopes and likes cars. Explain instantaneous rate of change using distance-time graphs. Include a skeptic asking about division by zero and a worked example. Return upload JSON only.
