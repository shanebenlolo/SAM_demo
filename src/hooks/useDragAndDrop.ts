/**
 * Custom hook for drag and drop functionality
 */

import { useState, useCallback } from "react";

interface UseDragAndDropReturn {
  draggedId: number | null;
  dragOverId: number | null;
  handleDragStart: (e: React.DragEvent, id: number) => void;
  handleDragOver: (e: React.DragEvent, id: number) => void;
  handleDragLeave: (e: React.DragEvent) => void;
  handleDrop: (
    e: React.DragEvent,
    targetId: number,
    onReorder: (draggedId: number, targetId: number) => void
  ) => void;
  handleDragEnd: () => void;
}

export function useDragAndDrop(): UseDragAndDropReturn {
  const [draggedId, setDraggedId] = useState<number | null>(null);
  const [dragOverId, setDragOverId] = useState<number | null>(null);

  const handleDragStart = useCallback((e: React.DragEvent, id: number) => {
    e.dataTransfer.effectAllowed = "move";
    setDraggedId(id);
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent, id: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    setDragOverId(id);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOverId(null);
  }, []);

  const handleDrop = useCallback(
    (
      e: React.DragEvent,
      targetId: number,
      onReorder: (draggedId: number, targetId: number) => void
    ) => {
      e.preventDefault();

      if (draggedId === null || draggedId === targetId) {
        setDraggedId(null);
        setDragOverId(null);
        return;
      }

      onReorder(draggedId, targetId);
      setDraggedId(null);
      setDragOverId(null);
    },
    [draggedId]
  );

  const handleDragEnd = useCallback(() => {
    setDraggedId(null);
    setDragOverId(null);
  }, []);

  return {
    draggedId,
    dragOverId,
    handleDragStart,
    handleDragOver,
    handleDragLeave,
    handleDrop,
    handleDragEnd,
  };
}
