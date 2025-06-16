"use client";

import React, { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { Task, Employee } from "@/types/types";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Loader2, PlusCircle } from "lucide-react";
import TasksList from "@/pages/task/TasksList";
import TaskForm from "@/pages/task/TaskForm";


export default function TasksPage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showTaskForm, setShowTaskForm] = useState(false);
  const [isManager, setIsManager] = useState(false);
  const [userData, setUserData] = useState<any>(null);
  const [isMounted, setIsMounted] = useState(false);
  
  // Safe way to use session on client-side only
  const session = useSession();
  
  // Update user data and role when session changes (client-side only)
  useEffect(() => {
    setIsMounted(true);
    if (typeof window !== 'undefined') {
      // Safely access session data
      const sessionData = session?.data;
      const user = sessionData ? (sessionData as any).user : null;
      setUserData(user);
      setIsManager(user?.role === "manager" || user?.role === "Admin");
    }
  }, [session?.data]);

  useEffect(() => {
    // Don't fetch data until component is mounted on client-side
    if (!isMounted) return;
    
    const fetchData = async () => {
      if (!userData) {
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      setError(null);

      try {
        const promises = [fetch(`${process.env.FRONTEND_URL}/api/task`)];
        // Only fetch employees if user is a manager - using the state value
        if (isManager) {
          promises.push(fetch(`${process.env.FRONTEND_URL}/api/team/get-employee`));
        }

        const responses = await Promise.all(promises);

        const taskRes = responses[0];
        if (!taskRes.ok) {
          const errorData = await taskRes.json();
          throw new Error(errorData.message || "Failed to fetch tasks");
        }
        const taskData = await taskRes.json();
        setTasks(taskData.tasks || []);

        if (isManager) {
          const employeeRes = responses[1];
          if (!employeeRes.ok) {
            const errorData = await employeeRes.json();
            throw new Error(errorData.message || "Failed to fetch employees");
          }
          const employeeData = await employeeRes.json();
          setEmployees(employeeData.employees || []);
        }
      } catch (err: any) {
        setError(err.message || "Failed to load data. Please try again later.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [userData, isManager, isMounted]);
  
  // Don't render until client-side
  if (!isMounted) {
    return null;
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-screen">
        <div className="text-red-500 mb-4">{error}</div>
        <Button onClick={() => window.location.reload()}>Retry</Button>
      </div>
    );
  }

  return (
    <div className="bg-gray-50 p-4">
      <div className="bg-white shadow-sm border-b p-4 mb-2 rounded-lg">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-semibold">Tasks Management</h1>
          {isManager && (
            <Button
              onClick={() => setShowTaskForm(true)}
              className="flex items-center gap-2"
            >
              <PlusCircle className="h-4 w-4" />
              Create Task
            </Button>
          )}
        </div>
      </div>
      {isLoading ? (
        <div className="h-64 flex items-center justify-center">
          <Loader2 className="animate-spin" />
        </div>
      ) : (
        <TasksList
          tasks={tasks}
          employees={employees}
          isManager={isManager}
        />
      )}
      <Dialog open={showTaskForm} onOpenChange={setShowTaskForm}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Create New Task</DialogTitle>
          </DialogHeader>
          <TaskForm
            task={null}
            employees={employees}
            isManager={isManager}
            onSave={() => {
              setShowTaskForm(false);
            }}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}
