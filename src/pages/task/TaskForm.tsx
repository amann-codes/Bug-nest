"use client";

import React, { useEffect, useRef, useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { toast } from "sonner";
import { Task, Employee, TaskStatus, TaskPriority } from "@/types/types";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Calendar } from "@/components/ui/calendar";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { format } from "date-fns";
import {
  Calendar as CalendarIcon,
  Mic,
  Square,
  AlertTriangle,
  X,
  Clock,
} from "lucide-react";

interface TaskFormProps {
  task: Task | null;
  employees: Employee[];
  isManager: boolean;
  onSave: () => void;
  onCancel?: () => void;
}

const TaskForm = ({
  task,
  employees: initialEmployees,
  isManager,
  onSave,
  onCancel,
}: TaskFormProps) => {
  const [isRecording, setIsRecording] = useState(false);
  const [audioURL, setAudioURL] = useState<string | null>(null);
  const [recordingError, setRecordingError] = useState<string | null>(null);
  const [employees, setEmployees] = useState<Employee[]>(
    initialEmployees || []
  );
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const getEndDate = (): Date | undefined => {
    if (task?.endDate) return new Date(task.endDate);
    if (task?.dueDate) return new Date(task.dueDate);
    return undefined;
  };

  const getAssigneeIds = (): string[] => {
    if (task?.assignedEmployeeIds && task.assignedEmployeeIds.length > 0) {
      return task.assignedEmployeeIds;
    }
    if (task?.assignedEmployees && task.assignedEmployees.length > 0) {
      return task.assignedEmployees.map((emp) => emp.id);
    }
    if (task?.assigneeId) {
      return [task.assigneeId];
    }
    return [];
  };

  const {
    control,
    handleSubmit: hookFormSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm({
    defaultValues: {
      title: task?.title || task?.title || "",
      description: task?.description || "",
      priority: task?.priority || TaskPriority.MEDIUM,
      status: task?.status || TaskStatus.PENDING,
      endDate: getEndDate(),
      assigneeIds: getAssigneeIds(),
    },
  });

  const name = watch("title");
  const assigneeIds = watch("assigneeIds");

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  useEffect(() => {
    const fetchEmployees = async () => {
      if (isManager && initialEmployees.length === 0) {
        setIsLoading(true);
        try {
          const apiResponse = await fetch(
            `${process.env.FRONTEND_URL}/api/employees`
          );
          if (apiResponse.ok) {
            console.log("apiResponse", apiResponse);
            const data = await apiResponse.json();
            if (data.status === "success" && data.employees) {
              setEmployees(data.employees);
            }
          } else {
            console.error("Failed to fetch employees");
          }
        } catch (error) {
        } finally {
          setIsLoading(false);
        }
      }
    };

    fetchEmployees();
  }, [isManager, initialEmployees]);

  const startRecording = async () => {
    setRecordingError(null);
    audioChunksRef.current = [];

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, {
          type: "audio/mp3",
        });
        const audioUrl = URL.createObjectURL(audioBlob);
        setAudioURL(audioUrl);
      };

      mediaRecorderRef.current = mediaRecorder;
      mediaRecorder.start();
      setIsRecording(true);
    } catch (error) {
      setRecordingError(
        "Could not access microphone. Please ensure you've granted permission."
      );
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);

      if (mediaRecorderRef.current.stream) {
        mediaRecorderRef.current.stream
          .getTracks()
          .forEach((track) => track.stop());
      }
    }
  };

  const onSubmit = async (data: any) => {
    try {
      setIsSubmitting(true);

      const taskData: any = {
        name: data.name,
        description: data.description,
        priority: data.priority,
        status: data.status,
        endDate: data.endDate ? new Date(data.endDate).toISOString() : null,
        assignedEmployeeIds: data.assigneeIds,
      };

      if (task && task.id) {
        taskData.id = task.id;
      }

      let apiResponse;
      if (task) {
        apiResponse = await fetch(`${process.env.FRONTEND_URL}/api/task`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(taskData),
        });
      } else {
        apiResponse = await fetch(`${process.env.FRONTEND_URL}/api/task`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(taskData),
        });
      }

      const response = await apiResponse.json();

      if (response.status === "success") {
        let assignedEmployeeText = "Not assigned to anyone";

        if (data.assigneeIds && data.assigneeIds.length > 0) {
          const assignedEmployees = employees.filter((emp) =>
            data.assigneeIds.includes(emp.id)
          );

          if (assignedEmployees.length === 1) {
            assignedEmployeeText = `Assigned to ${assignedEmployees[0].name}`;
          } else if (assignedEmployees.length === 2) {
            assignedEmployeeText = `Assigned to ${assignedEmployees[0].name} and ${assignedEmployees[1].name}`;
          } else if (assignedEmployees.length > 2) {
            assignedEmployeeText = `Assigned to ${assignedEmployees[0].name}, ${
              assignedEmployees[1].name
            } and ${assignedEmployees.length - 2} more`;
          }
        }
        toast.message(`Task ${task ? "updated" : "created"} successfully`, {
          description: `${assignedEmployeeText} · Due ${
            data.endDate ? format(data.endDate, "MMM d, yyyy") : "No due date"
          }`,
        });

        onSave();
      } else {
        toast.error(
          `Failed to ${task ? "update" : "create"} task: ${response.message}`
        );
      }
    } catch (error) {
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isManager) {
    return (
      <div className="space-y-4 py-4 bg-white">
        <div className="space-y-2">
          <Label htmlFor="task-name">Task Name</Label>
          <Controller
            name="title"
            control={control}
            render={({ field }) => (
              <Input
                id="task-title"
                {...field}
                placeholder="Record a quick task or note"
              />
            )}
          />
        </div>

        <div className="bg-gray-50 p-4 rounded-lg text-center space-y-4">
          {recordingError && (
            <div className="flex items-center justify-center text-red-500 mb-4">
              <AlertTriangle className="h-5 w-5 mr-2" />
              <span>{recordingError}</span>
            </div>
          )}

          {!audioURL ? (
            <Button
              type="button"
              onClick={isRecording ? stopRecording : startRecording}
              variant={isRecording ? "destructive" : "default"}
              size="lg"
              className="rounded-full h-16 w-16 p-0 flex items-center justify-center"
            >
              {isRecording ? (
                <Square className="h-6 w-6" />
              ) : (
                <Mic className="h-6 w-6" />
              )}
            </Button>
          ) : (
            <audio src={audioURL} controls className="w-full" />
          )}

          <p className="text-sm text-gray-500">
            {isRecording
              ? "Recording... Click to stop"
              : audioURL
              ? "Review your recording"
              : "Click to start recording"}
          </p>
        </div>

        <div className="flex justify-end gap-2 pt-6">
          {onCancel && (
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
              disabled={isSubmitting}
              size="lg"
            >
              Cancel
            </Button>
          )}
          <Button
            type="submit"
            disabled={isSubmitting}
            variant="default"
            size="lg"
          >
            {isSubmitting
              ? task
                ? "Updating..."
                : "Creating..."
              : task
              ? "Update Task"
              : "Create Task"}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={hookFormSubmit(onSubmit)} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="task-title">Task Title</Label>
        <Controller
          name="title"
          control={control}
          rules={{ required: "Task name is required" }}
          render={({ field }) => (
            <Input
              id="task-title"
              {...field}
              placeholder="Enter task title"
              required
            />
          )}
        />
        {errors.title && (
          <p className="text-sm text-red-500">
            {errors.title.message as string}
          </p>
        )}
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
              <Select value={field.value} onValueChange={field.onChange}>
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

      <div className="space-y-4">
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
              <SelectValue
                placeholder={
                  isLoading ? "Loading employees..." : "Select employees"
                }
              />
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
      </div>

      <div className="space-y-2">
        <Label htmlFor="task-due-date">Due Date</Label>
        <Controller
          name="endDate"
          control={control}
          render={({ field }) => {
            const [time, setTime] = useState(() => {
              if (field.value) {
                const date = new Date(field.value);
                return {
                  hours: date.getHours().toString().padStart(2, "0"),
                  minutes: date.getMinutes().toString().padStart(2, "0"),
                };
              }
              return { hours: "12", minutes: "00" };
            });
            const [open, setOpen] = useState(false);

            const handleTimeChange = (
              timeField: "hours" | "minutes",
              value: string
            ) => {
              if (timeField === "hours") {
                const hours = Number.parseInt(value);
                if (hours >= 0 && hours <= 23) {
                  setTime((prev) => ({
                    ...prev,
                    hours: value.padStart(2, "0"),
                  }));
                }
              } else {
                const minutes = Number.parseInt(value);
                if (minutes >= 0 && minutes <= 59) {
                  setTime((prev) => ({
                    ...prev,
                    minutes: value.padStart(2, "0"),
                  }));
                }
              }
            };

            const getDateTime = () => {
              if (!field.value) return null;
              const dateTime = new Date(field.value);
              return dateTime;
            };

            const formatDateTime = (dateTime: Date | null) => {
              if (!dateTime) return "Pick a date and time";
              return format(dateTime, "PPP 'at' p");
            };

            const handleDateChange = (date: Date | undefined) => {
              if (!date) return;

              const currentDate = field.value
                ? new Date(field.value)
                : new Date();
              const newDate = new Date(date);

              newDate.setHours(
                Number.parseInt(time.hours),
                Number.parseInt(time.minutes),
                0,
                0
              );

              field.onChange(newDate);
            };

            const handleDoneClick = () => {
              if (field.value) {
                const newDate = new Date(field.value);
                newDate.setHours(
                  Number.parseInt(time.hours),
                  Number.parseInt(time.minutes),
                  0,
                  0
                );
                field.onChange(newDate);
              }
              setOpen(false);
            };

            const handleClearClick = () => {
              field.onChange(null);
              setOpen(false);
            };

            return (
              <Popover open={open} onOpenChange={setOpen}>
                <PopoverTrigger asChild>
                  <Button
                    id="task-due-date"
                    variant="outline"
                    className={`w-full justify-start text-left font-normal ${
                      !field.value && "text-muted-foreground"
                    }`}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {formatDateTime(getDateTime())}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <div className="p-3">
                    <Calendar
                      mode="single"
                      selected={field.value || undefined}
                      onSelect={handleDateChange}
                      initialFocus
                    />
                    <Separator className="my-3" />
                    <div className="space-y-3">
                      <div className="flex items-center space-x-2">
                        <Clock className="h-4 w-4 text-muted-foreground" />
                        <Label className="text-sm font-medium">Time</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <div className="grid w-full max-w-sm items-center gap-1.5">
                          <Label htmlFor="hours" className="text-xs">
                            Hours
                          </Label>
                          <Input
                            id="hours"
                            type="number"
                            min="0"
                            max="23"
                            value={time.hours}
                            onChange={(e) =>
                              handleTimeChange("hours", e.target.value)
                            }
                            className="w-16 text-center"
                          />
                        </div>
                        <div className="text-xl font-bold">:</div>
                        <div className="grid w-full max-w-sm items-center gap-1.5">
                          <Label htmlFor="minutes" className="text-xs">
                            Minutes
                          </Label>
                          <Input
                            id="minutes"
                            type="number"
                            min="0"
                            max="59"
                            value={time.minutes}
                            onChange={(e) =>
                              handleTimeChange("minutes", e.target.value)
                            }
                            className="w-16 text-center"
                          />
                        </div>
                      </div>
                    </div>
                    <div className="mt-3 flex justify-between">
                      {field.value && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={handleClearClick}
                        >
                          Clear
                        </Button>
                      )}
                      <Button
                        size="sm"
                        onClick={handleDoneClick}
                        disabled={!field.value}
                        className="ml-auto"
                      >
                        Done
                      </Button>
                    </div>
                  </div>
                </PopoverContent>
              </Popover>
            );
          }}
        />
      </div>

      <div className="flex justify-end gap-2">
        {onCancel ? (
          <Button variant="outline" type="button" onClick={onCancel} size="lg">
            Cancel
          </Button>
        ) : (
          <Button variant="outline" type="button" onClick={onSave} size="lg">
            Cancel
          </Button>
        )}
        <Button
          type="submit"
          variant="default"
          disabled={!name || isRecording || isSubmitting}
          size="lg"
        >
          {isSubmitting
            ? task
              ? "Updating..."
              : "Creating..."
            : task
            ? "Update Task"
            : "Create Task"}
        </Button>
      </div>
    </form>
  );
};

export default TaskForm;
