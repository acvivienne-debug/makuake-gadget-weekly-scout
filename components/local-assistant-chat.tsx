"use client";

import { FormEvent, KeyboardEvent, useEffect, useRef, useState } from "react";
import { Bot, Send, Sparkles, Trash2, X } from "lucide-react";
import type { ProjectDetail } from "@/data/mockProjects";
import { Badge, Button } from "@/components/ui";
import { cn } from "@/lib/utils";

const quickPrompts = [
  "記事構成を作って",
  "Shorts台本を作って",
  "概要欄を短く",
  "サムネ構図を作って",
  "撮影カットに装着アップを追加"
];

export function LocalAssistantChat({
  project,
  isOpen,
  onClose,
  onSendMessage,
  onClearMessages
}: {
  project: ProjectDetail;
  isOpen: boolean;
  onClose: () => void;
  onSendMessage: (message: string) => void;
  onClearMessages: () => void;
}) {
  const [message, setMessage] = useState("");
  const endRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    endRef.current?.scrollIntoView({ block: "end" });
  }, [isOpen, project.chatMessages]);

  if (!isOpen) {
    return null;
  }

  function submitMessage(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const trimmedMessage = message.trim();

    if (!trimmedMessage) {
      return;
    }

    onSendMessage(trimmedMessage);
    setMessage("");
  }

  function handleKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key === "Enter" && !event.shiftKey && !event.nativeEvent.isComposing) {
      event.preventDefault();
      event.currentTarget.form?.requestSubmit();
    }
  }

  return (
    <aside
      className="fixed inset-x-3 bottom-3 z-50 mx-auto flex max-h-[min(43rem,calc(100dvh-1.5rem))] w-[min(100%,27rem)] flex-col overflow-hidden rounded-[1.35rem] border border-violet-300/20 bg-[#08111f]/96 shadow-[0_30px_90px_-38px_rgba(0,0,0,0.95)] backdrop-blur-xl sm:inset-x-auto sm:right-5"
      aria-label="ローカルチャット"
    >
      <div className="flex items-start justify-between gap-3 border-b border-slate-800/90 px-4 py-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-violet-500/18 text-violet-100 ring-1 ring-violet-300/25">
              <Bot className="size-4" />
            </span>
            <div className="min-w-0">
              <h2 className="truncate text-sm font-bold text-slate-50">
                AIチャット
              </h2>
              <p className="truncate text-xs text-slate-400">{project.product.name}</p>
            </div>
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-1.5">
          <Badge tone="violet" className="hidden h-8 sm:inline-flex">
            ローカルMVP
          </Badge>
          <button
            type="button"
            onClick={onClearMessages}
            className="grid size-9 place-items-center rounded-xl text-slate-400 transition hover:bg-white/[0.06] hover:text-slate-100"
            aria-label="チャット履歴を初期化"
          >
            <Trash2 className="size-4" />
          </button>
          <button
            type="button"
            onClick={onClose}
            className="grid size-9 place-items-center rounded-xl text-slate-400 transition hover:bg-white/[0.06] hover:text-slate-100"
            aria-label="チャットを閉じる"
          >
            <X className="size-4" />
          </button>
        </div>
      </div>

      <div className="studio-scrollbar min-h-0 flex-1 space-y-3 overflow-y-auto px-4 py-4">
        {project.chatMessages.map((chatMessage) => (
          <div
            key={chatMessage.id}
            className={cn(
              "flex gap-2",
              chatMessage.role === "user" ? "justify-end" : "justify-start"
            )}
          >
            {chatMessage.role === "assistant" ? (
              <span className="mt-1 grid size-7 shrink-0 place-items-center rounded-lg bg-violet-500/16 text-violet-100 ring-1 ring-violet-300/20">
                <Sparkles className="size-3.5" />
              </span>
            ) : null}
            <div
              className={cn(
                "max-w-[82%] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed",
                chatMessage.role === "user"
                  ? "bg-violet-500 text-white shadow-[0_16px_30px_-22px_rgba(124,92,255,0.95)]"
                  : "border border-slate-700/65 bg-white/[0.055] text-slate-100"
              )}
            >
              <p className="whitespace-pre-wrap break-words">{chatMessage.content}</p>
              <time
                className={cn(
                  "mt-1 block text-[10px]",
                  chatMessage.role === "user" ? "text-violet-100/75" : "text-slate-500"
                )}
              >
                {formatMessageTime(chatMessage.createdAt)}
              </time>
            </div>
          </div>
        ))}
        <div ref={endRef} />
      </div>

      <div className="border-t border-slate-800/90 px-4 py-3">
        <div className="studio-scrollbar mb-3 flex gap-2 overflow-x-auto pb-1">
          {quickPrompts.map((prompt) => (
            <button
              key={prompt}
              type="button"
              onClick={() => onSendMessage(prompt)}
              className="shrink-0 rounded-full border border-slate-700/70 bg-white/[0.045] px-3 py-1.5 text-xs font-medium text-slate-300 transition hover:border-violet-300/35 hover:bg-violet-500/12 hover:text-violet-100"
            >
              {prompt}
            </button>
          ))}
        </div>
        <form onSubmit={submitMessage} className="flex items-end gap-2">
          <textarea
            value={message}
            onChange={(event) => setMessage(event.target.value)}
            onKeyDown={handleKeyDown}
            rows={2}
            className="studio-scrollbar min-h-[3rem] flex-1 resize-none rounded-xl border border-slate-700/70 bg-white/[0.055] px-3.5 py-3 text-sm text-slate-100 outline-none shadow-studio-inset transition placeholder:text-slate-500 focus:border-violet-300/45"
            placeholder="例: 概要欄を短く"
          />
          <Button
            type="submit"
            variant="primary"
            className="size-12 shrink-0 px-0"
            aria-label="送信"
          >
            <Send className="size-4" />
          </Button>
        </form>
      </div>
    </aside>
  );
}

function formatMessageTime(createdAt: string) {
  const date = new Date(createdAt);

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  return new Intl.DateTimeFormat("ja-JP", {
    hour: "2-digit",
    minute: "2-digit"
  }).format(date);
}
