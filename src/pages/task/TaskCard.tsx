"use client";

import React from "react";
import { Task, TaskStatus, TaskPriority, Employee } from "@/types/types";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { User, Edit, Trash2, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";

type TaskCardProps = {
  task: Task;
  onClick?: () => void;
  onEdit?: () => void;
  onDelete?: (e: React.MouseEvent) => void;
  compact?: boolean;
  assignedEmployees?: Employee[];
};

const TaskCard: React.FC<TaskCardProps> = ({
  task,
  onClick,
  onEdit,
  onDelete,
  compact = false,
  assignedEmployees = [],
}) => {
  const formatDate = (dateString?: Date | string) => {
    if (!dateString) return null;
    return new Date(dateString).toLocaleDateString();
  };

  const handleEdit = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onEdit) onEdit();
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onDelete) onDelete(e);
  };

  const getPriorityVariant = (priority: TaskPriority): string => {
    switch (priority) {
      case TaskPriority.LOW:
        return "bg-green-100 text-green-800 hover:bg-green-100";
      case TaskPriority.MEDIUM:
        return "bg-yellow-100 text-yellow-800 hover:bg-yellow-100";
      case TaskPriority.HIGH:
        return "bg-red-100 text-red-800 hover:bg-red-100";
      case TaskPriority.URGENT:
        return "bg-red-500 text-white hover:bg-red-600";
      default:
        return "bg-gray-100 text-gray-800 hover:bg-gray-100";
    }
  };

  const getStatusVariant = (status: TaskStatus): string => {
    switch (status) {
      case TaskStatus.COMPLETED:
        return "bg-green-500 text-white hover:bg-green-600";
      case TaskStatus.IN_PROGRESS:
        return "bg-blue-500 text-white hover:bg-blue-600";
      case TaskStatus.PENDING:
        return "bg-yellow-500 text-white hover:bg-yellow-600";
      default:
        return "bg-gray-500 text-white hover:bg-gray-600";
    }
  };

  if (!task) {
    return null;
  }

  return (
    <Card
      onClick={onClick}
      className="cursor-pointer border-2 rounded-2xl transition-all"
    >
      <CardHeader className="flex items-center justify-between">
        <CardTitle className="text-lg font-medium">{task?.title}</CardTitle>
        <div className="flex gap-1">
          {onEdit && (
            <Button
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0 rounded-full text-blue-500"
              onClick={handleEdit}
            >
              <Edit className="h-4 w-4 text-black" />
            </Button>
          )}
          {onDelete && (
            <Button
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0 rounded-full text-blue-500"
              onClick={handleDelete}
            >
              <Trash2 className="h-4 w-4 text-red-500" />
            </Button>
          )}
        </div>
      </CardHeader>

      <CardContent className="">
        {task.description && (
          <CardDescription className="text-sm line-clamp-2 mb-3 text-muted-foreground">
            {task.description}
          </CardDescription>
        )}
        {assignedEmployees && assignedEmployees.length > 0 && (
          <div className="flex items-center mb-4 text-sm">
            <User className="mr-2 h-4 w-4" />
            <span className="font-bold text-black">
              {assignedEmployees[0]?.name || assignedEmployees[0]?.email}
            </span>
            {assignedEmployees.length > 1 && (
              <Badge variant="secondary" className="ml-2 rounded-full">
                +{assignedEmployees.length - 1}
              </Badge>
            )}
          </div>
        )}

        <div className="flex items-center justify-between w-full mt-2">
          <div className="flex gap-2">
            <Badge
              className={`px-4 py-1 rounded-full font-medium ${getPriorityVariant(
                task.priority
              )}`}
            >
              {task?.priority?.toLowerCase() || ''}
            </Badge>

            <Badge
              className={`px-4 py-1 rounded-full font-medium ${getStatusVariant(
                task.status
              )}`}
            >
              {task?.status?.replace("_", " ").toLowerCase() || ''}
            </Badge>
          </div>

          {task.endDate && (
            <div className="flex items-center text-sm text-muted-foreground">
              <Calendar className="h-4 w-4 mr-1" />
              {formatDate(task.endDate)}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default TaskCard;
