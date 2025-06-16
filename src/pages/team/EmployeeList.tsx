"use client";

import React, { useEffect } from "react";
import { Employee } from "@/types/types";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Search, UserPlus } from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { CheckSquare, Clock, AlertCircle, XCircle } from "lucide-react";

interface EmployeesListProps {
  employees: Employee[];
  onAddEmployee?: () => void;
}

const EmployeesList = ({ employees = [], onAddEmployee }: EmployeesListProps) => {
  const [searchQuery, setSearchQuery] = React.useState("");
  const [employeeTaskStats, setEmployeeTaskStats] = React.useState<
    Record<
      string,
      {
        pending: number;
        inProgress: number;
        completed: number;
        cancelled: number;
      }
    >
  >({});

  const filteredEmployees = employees?.filter(
    (employee) =>
      String(employee.name).toLowerCase().includes(searchQuery.toLowerCase()) ||
      String(employee.email).toLowerCase().includes(searchQuery.toLowerCase())
  );

  useEffect(() => {
    const fetchTaskStatsForAllEmployees = async () => {
      const stats: Record<
        string,
        {
          pending: number;
          inProgress: number;
          completed: number;
          cancelled: number;
        }
      > = {};

      if (!employees || employees.length === 0) {
        return;
      }

      for (const employee of employees) {
        try {
          const apiResponse = await fetch(
            `${process.env.FRONTEND_URL}/api/task?employeeId=${employee.id}`
          );
          const response = await apiResponse.json();

          if (response.status === "success" && Array.isArray(response.data)) {
            const taskCounts = {
              pending: 0,
              inProgress: 0,
              completed: 0,
              cancelled: 0,
            };

            response.data.forEach((task: any) => {
              if (task.status === "pending") taskCounts.pending++;
              else if (task.status === "in_progress") taskCounts.inProgress++;
              else if (task.status === "completed") taskCounts.completed++;
              else if (task.status === "cancelled") taskCounts.cancelled++;
            });

            stats[employee.id] = taskCounts;
          }
        } catch (error) {
          console.error(
            `Failed to fetch tasks for employee ${employee.id}:`,
            error
          );
        }
      }

      setEmployeeTaskStats(stats);
    };

    fetchTaskStatsForAllEmployees();
  }, [employees]);

  return (
    <div className="space-y-4 w-full">
      <div className="flex items-center gap-2 mb-4">
        <Search className="h-4 w-4 text-gray-400" />
        <Input
          placeholder="Search employees..."
          className="flex-1"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      {filteredEmployees.length === 0 ? (
        <div
          className="bg-white rounded-lg shadow p-6 text-center flex flex-col items-center justify-center"
          style={{ minHeight: "150px" }}
        >
          <p className="text-gray-500 mb-4">No employees found</p>
          {onAddEmployee && (
            <Button onClick={onAddEmployee} className="flex items-center gap-2">
              <UserPlus className="h-4 w-4" />
              Add Employee
            </Button>
          )}
        </div>
      ) : (
        filteredEmployees.map((employee) => {
          return (
            <Card
              key={employee.id}
              className="cursor-pointer hover:shadow-md transition-shadow"
            >
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <Avatar>
                    <AvatarImage src={`/placeholder.svg?height=40&width=40`} />
                    <AvatarFallback>
                      {employee.name
                        ? employee.name
                            .split(" ")
                            .map((n) => n[0])
                            .join("")
                        : "?"}
                    </AvatarFallback>
                  </Avatar>

                  <div className="flex-1">
                    <h3 className="font-medium">{employee.name}</h3>
                    <p className="text-sm text-gray-600">{employee.email}</p>
                  </div>

                  <Sheet>
                    <SheetTrigger asChild>
                      <Button variant="outline" size="sm">
                        View Profile
                      </Button>
                    </SheetTrigger>
                    <SheetContent>
                      <SheetHeader>
                        <SheetTitle>
                          {!employee.name ? employee.email : employee.name} -
                          Task Statistics
                        </SheetTitle>
                      </SheetHeader>
                      <div className="space-y-4 mt-6">
                        <div className="grid grid-cols-2 gap-4 p-5">
                          <Card>
                            <CardContent className="p-4 text-center">
                              <CheckSquare className="h-4 w-4 mx-auto mb-2 text-green-500" />
                              <div className="text-2xl font-bold">
                                {employeeTaskStats[employee.id]?.completed || 0}
                              </div>
                              <div className="text-sm text-gray-600">
                                Completed
                              </div>
                            </CardContent>
                          </Card>
                          <Card>
                            <CardContent className="p-4 text-center">
                              <Clock className="h-4 w-4 mx-auto mb-2 text-blue-500" />
                              <div className="text-2xl font-bold">
                                {employeeTaskStats[employee.id]?.inProgress ||
                                  0}
                              </div>
                              <div className="text-sm text-gray-600">
                                In Progress
                              </div>
                            </CardContent>
                          </Card>
                          <Card>
                            <CardContent className="p-4 text-center">
                              <AlertCircle className="h-4 w-4 mx-auto mb-2 text-yellow-500" />
                              <div className="text-2xl font-bold">
                                {employeeTaskStats[employee.id]?.pending || 0}
                              </div>
                              <div className="text-sm text-gray-600">
                                Pending
                              </div>
                            </CardContent>
                          </Card>
                          <Card>
                            <CardContent className="p-4 text-center">
                              <XCircle className="h-4 w-4 mx-auto mb-2 text-red-500" />
                              <div className="text-2xl font-bold">
                                {employeeTaskStats[employee.id]?.cancelled || 0}
                              </div>
                              <div className="text-sm text-gray-600">
                                Cancelled
                              </div>
                            </CardContent>
                          </Card>
                        </div>
                      </div>
                    </SheetContent>
                  </Sheet>
                </div>
              </CardContent>
            </Card>
          );
        })
      )}
    </div>
  );
};

export default EmployeesList;
