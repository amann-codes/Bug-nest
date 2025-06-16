"use client";

import React, { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useForm, Controller } from "react-hook-form";
import { Task, Employee, TaskStatus, TaskPriority } from "@/types/types";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { format } from "date-fns";
import { Calendar as CalendarIcon, Mic, X } from "lucide-react";
import { toast } from "sonner";

interface TaskEditFormProps {
  task: Task;
  employees?: Employee[];
  onSave: () => void;
  onCancel: () => void;
}

const TaskEditForm = ({
  task,
  employees: initialEmployees = [],
  onSave,
  onCancel,
}: TaskEditFormProps) => {
  const [userRole, setUserRole] = useState<string | undefined>(undefined);
  const [canEditAllFields, setCanEditAllFields] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const [employees, setEmployees] = useState<Employee[]>(initialEmployees);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const session = useSession();
  
  // Handle session data on client-side only
  useEffect(() => {
    setIsMounted(true);
    if (typeof window !== 'undefined') {
      const role = session?.data?.user?.role as string | undefined;
      setUserRole(role);
      setCanEditAllFields(role === 'Admin' || role === 'Manager');
    }
  }, [session?.data?.user?.role]);

  const {
    control,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm({
    defaultValues: {
      title: task?.title || "",
      description: task?.description || "",
      priority: task?.priority || "LOW",
      status: task?.status || "OPEN",
      endDate: task?.endDate ? new Date(task.endDate) : undefined,
      assigneeIds: task?.assigneeId ? [task.assigneeId] : [],
    },
  });
  
  // Don't render form until client-side
  if (!isMounted || !task) {
    return null;
  }

  const endDate = watch("endDate");
  const assigneeIds = watch("assigneeIds");

  useEffect(() => {
    const fetchEmployees = async () => {
      if (canEditAllFields && initialEmployees.length === 0) {
        setIsLoading(true);
        try {
          const response = await fetch(`${process.env.FRONTEND_URL}/api/team/get-employee`);
          const data = await response.json();
          if (response.status === 200 && data.employees) {
            setEmployees(data.employees);
          }
        } catch (error) {
          console.error("Error fetching employees:", error);
        } finally {
          setIsLoading(false);
        }
      }
    };

    fetchEmployees();
  }, [canEditAllFields, initialEmployees]);

  const onSubmit = async (data: any) => {
    try {
      setIsSubmitting(true);
      const taskData = {
        id: task.id,
        title: data.title,
        description: data.description,
        priority: data.priority,
        status: data.status,
        endDate: data.endDate,
        assignedEmployeeIds: data.assigneeIds,
      };

      const response = await fetch(`${process.env.FRONTEND_URL}/api/task`, { 
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(taskData),
      });
      const result = await response.json();
      if (response.ok && result.status === 'success') {
        toast.success(`Task '${taskData.title || task.title}' updated successfully.`);
        onSave();
      } else {
        const errorMessage = result.message || "Failed to update task. Please try again.";
        toast.error(errorMessage);
        console.error("Failed to update task:", errorMessage);
      }
    } catch (error) {
      console.error("Failed to update task:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-4 p-4">
      <h2 className="text-xl font-bold mb-4">Edit Task</h2>

      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="task-name">Task Title</Label>
          <Controller
            name="title"
            control={control}
            rules={{ required: "Task title is required" }}
            render={({ field }) => (
              <Input id="" {...field} placeholder="Enter task titles" disabled={!canEditAllFields} />
            )}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="task-description">Description</Label>
          <Controller
            name="description"
            control={control}
            render={({ field }) => (
              <Textarea
                id="task-description"
                {...field}
                placeholder="Enter task description"
                className="min-h-[80px]"
                disabled={!canEditAllFields}
              />
            )}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="task-priority">Priority</Label>
            <Controller
              name="priority"
              control={control}
              render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange} disabled={!canEditAllFields}>
                  <SelectTrigger id="task-priority">
                    <SelectValue placeholder="Select priority" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={TaskPriority.LOW}>Low</SelectItem>
                    <SelectItem value={TaskPriority.MEDIUM}>Medium</SelectItem>
                    <SelectItem value={TaskPriority.HIGH}>High</SelectItem>
                    <SelectItem value={TaskPriority.URGENT}>Urgent</SelectItem>
                  </SelectContent>
                </Select>
              )}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="task-status">Status</Label>
            <Controller
              name="status"
              control={control}
              render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger id="task-status">
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={TaskStatus.PENDING}>Pending</SelectItem>
                    <SelectItem value={TaskStatus.IN_PROGRESS}>
                      In Progress
                    </SelectItem>
                    <SelectItem value={TaskStatus.COMPLETED}>
                      Completed
                    </SelectItem>
                  </SelectContent>
                </Select>
              )}
            />
          </div>
        </div>

        {canEditAllFields && (
          <div className="space-y-2">
            <Label htmlFor="task-assignee">Assign To</Label>
          <div className="flex flex-wrap gap-2 mb-2">
            {assigneeIds.map((id) => {
              const employee = employees.find((e) => e.id === id);
              return (
                <Badge
                  key={id}
                  variant="secondary"
                  className="flex items-center gap-1"
                >
                  {employee?.name || id}
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-4 w-4 p-0 hover:bg-transparent"
                    onClick={() =>
                      setValue(
                        "assigneeIds",
                        assigneeIds.filter((i) => i !== id)
                      )
                    }
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </Badge>
              );
            })}
          </div>
          <Select
            disabled={isLoading}
            onValueChange={(value) => {
              if (value && !assigneeIds.includes(value)) {
                setValue("assigneeIds", [...assigneeIds, value]);
              }
            }}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select employees" />
            </SelectTrigger>
            <SelectContent>
              {employees.length > 0 ? (
                employees
                  .filter((employee) => !assigneeIds.includes(employee.id))
                  .map((employee) => (
                    <SelectItem key={employee.id} value={employee.id}>
                      {employee.name}
                    </SelectItem>
                  ))
              ) : (
                <SelectItem value="no-employees" disabled>
                  No employees found
                </SelectItem>
              )}
            </SelectContent>
          </Select>
        </div>
        )}

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="task-deadline-date">Due Date</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  id="task-deadline-date"
                  variant="outline"
                  className="w-full justify-start text-left font-normal"
                  disabled={!canEditAllFields}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {endDate ? format(endDate, "PPP") : <span>Pick a date</span>}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Controller
                  name="endDate"
                  control={control}
                  render={({ field }) => (
                    <Calendar
                      mode="single"
                      selected={field.value}
                      onSelect={field.onChange}
                      initialFocus
                    />
                  )}
                />
              </PopoverContent>
            </Popover>
          </div>

          <div className="space-y-2">
            <Label htmlFor="task-deadline-time">Due Time</Label>
            <Input
              id="task-deadline-time"
              type="time"
              disabled={!endDate || !canEditAllFields}
              value={
                endDate
                  ? `${String(endDate.getHours()).padStart(2, "0")}:${String(
                      endDate.getMinutes()
                    ).padStart(2, "0")}`
                  : ""
              }
              onChange={(e) => {
                if (!endDate) return;
                const [hours, minutes] = e.target.value.split(":").map(Number);
                const newDate = new Date(endDate);
                newDate.setHours(hours);
                newDate.setMinutes(minutes);
                setValue("endDate", newDate);
              }}
              className="w-full"
            />
          </div>
        </div>
      </div>

      <div className="flex justify-end gap-2 mt-6">
        <Button variant="outline" type="button" onClick={onCancel} size="lg">
          Cancel
        </Button>
        <Button
          onClick={handleSubmit(onSubmit)}
          disabled={isSubmitting}
          variant="default"
          size="lg"
        >
          {isSubmitting ? "Updating..." : "Update Task"}
        </Button>
      </div>
    </div>
  );
};

export default TaskEditForm;
