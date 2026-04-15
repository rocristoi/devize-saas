"use client";

import { Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { deleteDeviz } from "@/app/actions/deviz";
import { useRouter } from "next/navigation";
import { ConfirmModal } from "../ui/ConfirmModal";

export function DeleteDevizButton({ devizId, series }: { devizId: string, series: string }) {
  const [isDeleting, setIsDeleting] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const router = useRouter();

  const handleDelete = async () => {
    setIsDeleting(true);
    const result = await deleteDeviz(devizId);
    
    if (result.success) {
      toast.success(`Devizul ${series} a fost șters!`);
      setShowConfirm(false);
      router.refresh();
    } else {
      toast.error(result.error || `Eroare la ștergerea devizului ${series}`);
      setIsDeleting(false);
    }
  };

  return (
    <>
      <button
        onClick={() => setShowConfirm(true)}
        disabled={isDeleting}
        className="p-1.5 text-red-500 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/30 rounded-md transition disabled:opacity-50"
        title="Șterge"
      >
        <Trash2 size={18} />
      </button>

      <ConfirmModal
        isOpen={showConfirm}
        onClose={() => setShowConfirm(false)}
        onConfirm={handleDelete}
        title="Ștergere deviz"
        description={
          <>Ești sigur că dorești să ștergi devizul <strong>{series}</strong>? Această acțiune este ireversibilă.</>
        }
        confirmText="Șterge devizul"
        isLoading={isDeleting}
      />
    </>
  );
}
