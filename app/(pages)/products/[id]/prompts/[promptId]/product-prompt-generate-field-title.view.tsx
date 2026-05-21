export function GeneratePromptBlockTitle({ title }: { title: string }) {
  return (
    <p className="text-[10px] font-bold uppercase tracking-wider text-neutral-500">
      {title}
    </p>
  );
}
