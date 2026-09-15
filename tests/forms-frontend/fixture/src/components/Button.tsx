export function Button({ children, ...props }: { children?: unknown; onClick?: () => void; disabled?: boolean; type?: string }) {
  return <button {...props}>{children as string}</button>;
}
