import { revalidatePath } from "next/cache";

export function revalidateAppPaths(taskId?: string) {
  revalidatePath("/");
  revalidatePath("/tasks");
  revalidatePath("/calendar");
  revalidatePath("/shared");
  revalidatePath("/profile");
  revalidatePath("/quick-add");

  if (taskId) {
    revalidatePath(`/tasks/${taskId}`);
  }
}
