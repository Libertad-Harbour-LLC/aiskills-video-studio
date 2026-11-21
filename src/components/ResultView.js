"use client";
// Default view of a text result: formatted Markdown + copy / download. Apps replace this file for custom layouts.
import Markdown from "./Markdown";
import CopyBar from "./CopyBar";

export default function ResultView({ job, text }) {
  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-glass-border bg-bg-elevated/40 p-4 sm:p-5">
        <Markdown text={text} />
      </div>
      <CopyBar text={text} id={job.id} />
    </div>
  );
}
