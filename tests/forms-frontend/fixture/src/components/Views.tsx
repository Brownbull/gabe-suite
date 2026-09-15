import { Button } from "./Button";

export function SyncError() {
  return (
    <div>
      <Button>Retry</Button>
      <Button onClick={() => {}}>Offline</Button>
      <Button disabled>Wait</Button>
      <button type="submit">Send</button>
    </div>
  );
}

export function EmptyList({ onAdd }: { onAdd?: () => void }) {
  return onAdd ? (
    <Button onClick={onAdd}>Add</Button>
  ) : (
    <Button>Connect</Button>
  );
}

export function Toast({ message, onDismiss }: { message: string; onDismiss?: () => void }) {
  return (
    <p>
      {message}
      <button onClick={onDismiss}>x</button>
    </p>
  );
}

export function Menu({ items, onMore }: { items: { label: string; onPick: () => void }[]; onMore?: () => void }) {
  return (
    <div>
      {items.map((item) => (
        <button {...{ title: item.label }} onClick={item.onPick}>{item.label}</button>
      ))}
      {onMore ? <button onClick={onMore}>more</button> : null}
    </div>
  );
}

export function Panel({ compact, onClose }: { compact?: boolean; onClose?: () => void }) {
  return compact ? null : <button onClick={onClose}>close</button>;
}

export function RetryRow({ onRetry }: { onRetry?: () => void }) {
  return <Button onClick={onRetry}>Again</Button>;
}

export function ListPage({ extra }: { extra: unknown }) {
  return (
    <form onSubmit={() => {}}>
      <Toast message="saved" onDismiss={() => history.back()} />
      <Toast message="gone" />
      <Menu items={[]} />
      <Panel compact />
      <RetryRow onRetry={() => history.back()} />
      <RetryRow />
      <Popup />
      <ActionBar actions={[]} />
      <Disclosure onRemove={() => history.back()} />
      <EmptyList onAdd={() => {}} />
      <EmptyList />
      <a href="/help">Help</a>
      <a>Nowhere</a>
      <Button {...(extra as object)}>Spread</Button>
    </form>
  );
}

export function CollapsibleTrigger({ children }: { asChild?: boolean; children?: unknown }) {
  return <div>{children as string}</div>;
}

export function Disclosure({ onRemove }: { onRemove: () => void }) {
  return (
    <div>
      <CollapsibleTrigger asChild>
        <button>toggle</button>
      </CollapsibleTrigger>
      <span role="button" onClick={onRemove}>
        name
        <button>x</button>
      </span>
      <form action="/save">
        <button type="submit">save</button>
      </form>
    </div>
  );
}

export function ActionBar({ actions, ...props }: { actions: { label: string; onPick: () => void }[] }) {
  return (
    <div>
      {actions.map((action) => (
        <button {...props} onClick={action.onPick}>{action.label}</button>
      ))}
    </div>
  );
}

export function Popup() {
  const extra = { title: "t" };
  return <a {...extra}>open</a>;
}
