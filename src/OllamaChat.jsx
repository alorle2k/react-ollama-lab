
import { useState } from "react";
import Ollama from "ollama";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

export default function OllamaChat() {
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleAsk = async () => {
    if (!input.trim() || loading) return;

    const userMessage = {
      role: "user",
      content: input.trim(),
    };

    const nextMessages = [...messages, userMessage];

    setMessages(nextMessages);
    setInput("");
    setError("");
    setLoading(true);

    try {
      const response = await Ollama.chat({
        model: "llama3.2",
        messages: nextMessages,
      });

      setMessages([
        ...nextMessages,
        response.message,
      ]);
    } catch (err) {
      console.error("Ollama chat error:", err);
      setError(
        "Failed to get response from Ollama. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  const clearChat = () => {
    if (loading) return;

    setMessages([]);
    setInput("");
    setError("");
  };

  return (
    <section className="chat-shell">
      <div className="chat-card">
        <header className="chat-header">
          <h1>HR Help Assistant</h1>
          <p>
            Build a local AI chatbot prototype that helps employees ask general HR questions.
          </p>
        </header>

        <p className="chat-guidance">
          Ask about general HR topics such as benefits, time off, policies, or workplace procedures.
          Do not enter private, sensitive, or personal information.
        </p>

        <div className="chat-input-area">
          <label htmlFor="chat-prompt" className="sr-only">
            Ask the HR assistant
          </label>

          <textarea
            id="chat-prompt"
            rows="5"
            className="chat-textarea"
            placeholder="Ask about benefits, PTO, or workplace policies..."
            value={input}
            onChange={(event) => setInput(event.target.value)}
            disabled={loading}
          />
        </div>

        <div className="chat-actions">
          <button
            className="chat-button"
            onClick={handleAsk}
            disabled={loading || !input.trim()}
          >
            Send
          </button>

          <button
            className="chat-button chat-button-secondary"
            onClick={clearChat}
            disabled={
              loading ||
              (messages.length === 0 && !input && !error)
            }
          >
            Clear thread
          </button>
        </div>

        {error && (
          <p className="chat-error" role="alert">
            {error}
          </p>
        )}

        <div
          className="message-list"
          aria-label="Conversation thread"
          aria-live="polite"
        >
          {messages.map((message, index) => (
            <div
              key={`${index}-${message.role}`}
              role="article"
              className={`message message-${message.role}`}
            >
              <strong>
                {message.role === "user" ? "You" : "HR Assistant"}
              </strong>

              <div className="message-content">
                {message.role === "assistant" ? (
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>
                    {message.content}
                  </ReactMarkdown>
                ) : (
                  <p>{message.content}</p>
                )}
              </div>
            </div>
          ))}

          {loading && (
            <p className="chat-loading" role="status">
              HR Assistant is thinking...
            </p>
          )}
        </div>
      </div>
    </section>
  );
}
