import ReactMarkdown, { type Components } from "react-markdown";
import remarkGfm from "remark-gfm";

function safeHref(href: string | undefined): string | null {
  if (!href || !/^(https?:|mailto:)/i.test(href)) return null;
  return href;
}

const components: Components = {
  img: () => null,
  a: ({ href, children }) => {
    const safe = safeHref(href);
    if (!safe) return <span>{children}</span>;
    return (
      <a href={safe} target="_blank" rel="noopener noreferrer" className="text-slateblue underline underline-offset-2">
        {children}
      </a>
    );
  },
  h1: ({ children }) => <p className="chat-markdown-heading">{children}</p>,
  h2: ({ children }) => <p className="chat-markdown-heading">{children}</p>,
  h3: ({ children }) => <p className="chat-markdown-heading">{children}</p>,
  h4: ({ children }) => <p className="chat-markdown-heading">{children}</p>,
  h5: ({ children }) => <p className="chat-markdown-heading">{children}</p>,
  h6: ({ children }) => <p className="chat-markdown-heading">{children}</p>,
};

export default function AssistantMarkdown({ content }: { content: string }) {
  return (
    <div className="chat-markdown break-words text-[0.9375rem] leading-[1.55] text-navy">
      <ReactMarkdown remarkPlugins={[remarkGfm]} components={components}>
        {content}
      </ReactMarkdown>
    </div>
  );
}
