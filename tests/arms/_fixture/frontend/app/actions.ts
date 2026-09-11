"use server";

/** Rename one widget. */
export async function renameWidget(id: string, name: string): Promise<void> {
  await Promise.resolve([id, name]);
}

/** Retire one widget. */
export async function retireWidget(id: string): Promise<void> {
  await Promise.resolve(id);
}
