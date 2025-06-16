import React, { useState } from "react";
import { X } from "lucide-react";
import { Task, Employee } from "@/types/types";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CalendarIcon, UserCircle } from "lucide-react";
import TaskStatusUpdateForm from "./TaskEditForm";

interface TaskDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  task: Task | null;
  onEditClick?: () => void;
  assignedEmployees?: Employee[];
  showEditButton?: boolean;
  isEmployee?: boolean;
  onTaskUpdate?: () => void;
}

export function TaskDetailsModal({
  isOpen,
  onClose,
  task,
  onEditClick,
  assignedEmployees = [],
  showEditButton = false,
  isEmployee = false,
  onTaskUpdate,
}: TaskDetailsModalProps) {
  const [showStatusUpdateForm, setShowStatusUpdateForm] = useState(false);
  if (!task) return null;

  const getStatusVariant = (status: string): string => {
    switch (status) {
      case "completed":
        return "bg-green-200 text-green-600";
      case "in_progress":
        return "bg-blue-200 text-blue-600";
      case "pending":
        return "bg-amber-200 text-amber-600";
      default:
        return "bg-black text-white";
    }
  };

  const getPriorityVariant = (priority: string): string => {
    switch (priority) {
      case "low":
        return "bg-green-200 text-green-600";
      case "medium":
        return "bg-blue-200 text-blue-600";
      case "high":
        return "bg-red-200 text-red-600";
      default:
        return "bg-black text-white";
    }
  };

  const formatDate = (dateString?: Date | string) => {
    if (!dateString) return null;
    return new Date(dateString).toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md p-0">
        <DialogHeader className="sticky top-0 z-10 bg-white p-4 pb-2 border-b sm:rounded-t-lg">
          <Button
            variant="ghost"
            size="icon"
            className="absolute right-2 top-2 h-8 w-8 rounded-full p-0 hover:bg-slate-100 sm:right-4 sm:top-4"
            onClick={onClose}
          >
            <X className="h-4 w-4" />
          </Button>
          <DialogTitle className="text-xl font-medium pr-10 sm:pr-12">
            {task.title}
          </DialogTitle>
        </DialogHeader>

        <div className="p-4 space-y-6 max-h-[calc(90vh-100px)] overflow-y-auto">
          {task.description && (
            <p className="text-sm text-muted-foreground">{task.description}</p>
          )}
          <div className="flex flex-wrap gap-3">
            <Badge
              className={`px-2 py-1 text-xs rounded-md font-medium ${getPriorityVariant(
                task.priority
              )}`}
            >
              {task.priority.toLowerCase()} priority
            </Badge>

            <Badge
              className={`px-2 py-1 text-xs rounded-md font-medium ${getStatusVariant(
                task.status
              )}`}
            >
              {task.status.replace("_", " ").toLowerCase()}
            </Badge>
          </div>

          {task.dueDate && (
            <div className="flex items-center text-sm text-muted-foreground border border-gray-100 rounded-lg p-1 bg-gray-50">
              <CalendarIcon className="h-5 w-5 mr-3 text-gray-400" />
              <span className="font-medium">
                Due: {formatDate(task.dueDate)}
              </span>
            </div>
          )}

          {assignedEmployees && assignedEmployees.length > 0 && (
            <div className="border border-gray-100 rounded-lg p-3 bg-gray-50">
              <div className="flex items-center mb-3">
                <UserCircle className="h-5 w-5 mr-3 text-gray-400" />
                <span className="text-sm font-medium">Assigned to:</span>
              </div>
              <ul className="pl-2 space-y-2">
                {assignedEmployees.map((employee) => (
                  <li
                    key={employee.id}
                    className="text-sm flex items-center bg-white p-2 rounded-md border border-gray-100"
                  >
                    <div className="h-6 w-6 rounded-full bg-blue-100 text-blue-800 flex items-center justify-center text-xs font-medium mr-2">
                      {employee.name.charAt(0).toUpperCase() ||
                        employee.email.charAt(0).toUpperCase()}
                    </div>
                    <span className="font-medium">
                      {employee.name || employee.email}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {task.media && task.media.length > 0 && (
            <div className="border border-gray-100 rounded-lg p-3 bg-gray-50">
              <p className="text-sm font-medium mb-3 flex items-center">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5 mr-3 text-gray-400"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13"
                  />
                </svg>
                {task.media.length}{" "}
                {task.media.length === 1 ? "Attachment" : "Attachments"}
              </p>
              <div className="flex flex-wrap gap-2">
                {task.media.map((media, index) => (
                  <div
                    key={`${media.id || media.url || ""}${index}`}
                    className="text-xs bg-white border border-gray-100 rounded-md px-3 py-2 flex items-center"
                  >
                    <div className="h-6 w-6 rounded-full bg-blue-100 text-blue-800 flex items-center justify-center text-xs font-medium mr-2">
                      {media.type.charAt(0).toUpperCase()}
                    </div>
                    <span className="font-medium">
                      {media.type.charAt(0).toUpperCase() + media.type.slice(1)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {showStatusUpdateForm ? (
            <TaskStatusUpdateForm
              task={task}
              onSave={() => {
                setShowStatusUpdateForm(false);
                if (onTaskUpdate) onTaskUpdate();
              }}
              onCancel={() => setShowStatusUpdateForm(false)}
            />
          ) : (
            <div className="pt-3 pb-2 space-y-2">
              {showEditButton && onEditClick && (
                <Button
                  onClick={onEditClick}
                  variant="default"
                  size="lg"
                  className="w-full"
                >
                  Edit Task
                </Button>
              )}

              {isEmployee && (
                <Button
                  onClick={() => setShowStatusUpdateForm(true)}
                  variant="outline"
                  size="lg"
                  className="w-full"
                >
                  Update Status
                </Button>
              )}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default TaskDetailsModal;
