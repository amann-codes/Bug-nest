"use client";

import React from "react";
import { Task, Employee } from "@/types/types";
import { Button } from "@/components/ui/button";
import TaskCard from "@/pages/task/TaskCard";
import TaskDetailsModal from "@/pages/task/TaskDetailsModal";
import TaskForm from "@/pages/task/TaskForm";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface TasksListProps {
  tasks: Task[];
  employees: Employee[];
  isManager: boolean;
}

const TasksList = ({
  tasks = [],
  employees = [],
  isManager,
}: TasksListProps) => {
  const [isMounted, setIsMounted] = React.useState(false);
  const [isTaskDialogOpen, setIsTaskDialogOpen] = React.useState(false);
  const [isViewTaskDialogOpen, setIsViewTaskDialogOpen] = React.useState(false);
  const [editingTask, setEditingTask] = React.useState<Task | null>(null);
  const [viewingTask, setViewingTask] = React.useState<Task | null>(null);
  const [isDeleting, setIsDeleting] = React.useState(false);
  const [tasksList, setTasksList] = React.useState<Task[]>(tasks);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = React.useState(false);
  const [taskToDelete, setTaskToDelete] = React.useState<string | null>(null);

  const getAssignedEmployees = (task: Task): Employee[] => {
    
    if (task.assignedEmployees && task.assignedEmployees.length > 0) {
      return task.assignedEmployees;
    }
    
    if (task.assignedEmployeeIds && task.assignedEmployeeIds.length > 0) {
      const assignedEmployees = employees.filter(emp => 
        task.assignedEmployeeIds?.includes(emp.id)
      );
      return assignedEmployees;
    }

    if (task.assigneeId) {
      const assignedEmployee = employees.find(emp => emp.id === task.assigneeId);
      
      if (!assignedEmployee) {
        return [];
      }
      
      return [assignedEmployee];
    }
    
    return [];
  };

  const handleViewTask = (task: Task) => {
    setViewingTask(task);
    setIsViewTaskDialogOpen(true);
  };

  const handleEditTask = (task: Task) => {
    setEditingTask(task);
    setIsTaskDialogOpen(true);
  };

  const openDeleteDialog = (taskId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setTaskToDelete(taskId);
    setIsDeleteDialogOpen(true);
  };

  const handleDeleteTask = async () => {
    if (!taskToDelete) return;

    setIsDeleting(true);
    try {
      const apiResponse = await fetch(`http://localhost:3000/api/task?id=${taskToDelete}`, {
        method: "DELETE",
      });
      const result = await apiResponse.json();
      if (result.status === "success") {
        setTasksList((prev) => prev.filter((task) => task.id !== taskToDelete));
        toast.success("Task deleted successfully");
      } else {
        toast.error(result.message || "Failed to delete task");
      }
    } catch (error) {
      console.error("Error deleting task:", error);
      toast.error("An unexpected error occurred");
    } finally {
      setIsDeleting(false);
      setIsDeleteDialogOpen(false);
      setTaskToDelete(null);
    }
  };

  React.useEffect(() => {
    setIsMounted(true);
    setTasksList(tasks || []);
  }, [tasks]);
  
  // Don't render until client-side
  if (!isMounted) {
    return null;
  }

  return (
    <div className="space-y-4 p-4">
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className="rounded-lg max-w-md w-full">
          <DialogHeader>
            <DialogTitle className="text-xl font-semibold">
              Delete Task
            </DialogTitle>
          </DialogHeader>
          <div className="text-base">
            Are you sure you want to delete this task?
          </div>
          <div className="flex justify-end gap-2 pt-4">
            <Button
              variant="outline"
              onClick={() => setIsDeleteDialogOpen(false)}
              disabled={isDeleting}
              size="lg"
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteTask}
              disabled={isDeleting}
              size="lg"
            >
              {isDeleting ? "Deleting..." : "Delete"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
      <Dialog open={isTaskDialogOpen} onOpenChange={(isOpen) => {
        setIsTaskDialogOpen(isOpen);
        if (!isOpen) {
          setEditingTask(null);
        }
      }}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>{editingTask ? "Edit Task" : "Create New Task"}</DialogTitle>
          </DialogHeader>
          {editingTask && (
            <TaskForm
              task={editingTask}
              employees={employees}
              isManager={isManager}
              onSave={() => {
                setIsTaskDialogOpen(false);
                setEditingTask(null);
              }}
              onCancel={() => {
                setIsTaskDialogOpen(false);
                setEditingTask(null);
              }}
            />
          )}
        </DialogContent>
      </Dialog>

      <TaskDetailsModal
        isOpen={isViewTaskDialogOpen}
        onClose={() => {
          setIsViewTaskDialogOpen(false);
          setViewingTask(null);
        }}
        task={viewingTask}
        assignedEmployees={viewingTask ? getAssignedEmployees(viewingTask) : []}
        showEditButton={isManager}
        onEditClick={() => {
          setIsViewTaskDialogOpen(false);
          if (viewingTask) handleEditTask(viewingTask);
        }}
      />

      {tasksList.length === 0 ? (
        <div className="text-center">
          <p className="text-gray-500">No tasks found</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {tasksList.map((task) => {
            const assignedEmployees = getAssignedEmployees(task);

            return (
              <div key={task.id} className="relative">
                <TaskCard
                  task={task}
                  assignedEmployees={assignedEmployees}
                  onClick={() => handleViewTask(task)}
                  onEdit={() => handleEditTask(task)}
                  onDelete={(e) => openDeleteDialog(task.id, e)}
                />
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default TasksList;
