"use client";

import { Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { deleteDeviz } from "@/app/actions/deviz";
import { useRouter } from "next/navigation";

export function DeleteDevizButton({ devizId, series }: { devizId: string, series: string }) {
  const [isDeleting, setIsDeleting] = useState(false);
  const router = useRouter();

  const handleDelete = async () => {
    if (!window.confirm(`Ești sigur că dorești să ștergi devizul ${series}? Această acțiune este ireversibilă.`)) return;
    
    setIsDeleting(true);
    const result = await deleteDeviz(devizId);
    
    if (result.success) {
      toast.success(`Devizul ${series} a fost șters!`);
      router.refresh();
    } else {
      toast.error(result.error || `Eroare la ștergerea devizului ${series}`);
      setIsDeleting(false);
    }
  };

  return (
    <button
      onClick={handleDelete}
      disabled={isDeleting}
      className="p-1.5 text-red-500 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/30 rounded-md transition disabled:opacity-50"
      title="Șterge"
    >
      <Trash2 size={18} />
    </button>
  );
}
